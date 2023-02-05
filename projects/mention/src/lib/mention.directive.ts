import { ComponentFactoryResolver, Directive, DoCheck, EventEmitter, HostListener, Input, IterableDiffers, OnChanges, Output, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MentionService } from './mention.service';
import { MentionListComponent } from './components/mention-list/mention-list.component';
import { SelectionModify } from './interfaces/selection-modify';
import { KeyPressed } from './interfaces/key-pressed';
import { Item } from './interfaces/item';
import { Config } from './interfaces/config';
import { Direction } from './interfaces/direction';

@Directive({
  selector: '[mention]'
})
export class MentionDirective implements OnChanges, DoCheck {
  isChromium = window.navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && !!(<any>window).chrome;
  config: Config = {
    trigger: KeyPressed.AtSymbol,
    direction: Direction.Bottom,
  };
  mentionsList: Item[] = [];
  @Input() mention!: Item[];
  @Input() mentionConfig?: Config;
  @Input() itemTemplate?: TemplateRef<Item>;
  @Output() selectedMention = new EventEmitter();
  @Output() searchTerm = new EventEmitter();

  filteredItems: Item[] = [];
  sel: any = document.getSelection();
  caretPosition = 0;
  differ: any;

  private mentionListComponent: MentionListComponent | undefined;
  constructor(private _mentionService: MentionService,
    private _componentResolver: ComponentFactoryResolver,
    private _viewContainerRef: ViewContainerRef,
    private _iterableDiffers: IterableDiffers) {
    this.differ = this._iterableDiffers.find([]).create();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mention']) {
      this.updateMention();
    }

    if (changes['mentionConfig']) {
      this.updateMentionConfig();
    }
  }

  ngDoCheck() {
    let changes = this.differ.diff(this.mention);
    if (changes) {
      this.newItems();
    }
  }

  newItems() {
    this.mentionsList = [...this.mention];
    this.filteredItems = [...this.mentionsList];
    const term = this.getTerm();
    if (term && term[0] === this.config.trigger) {
      this.filteredItems = this.filteredItems.filter((item: Item) => {
        return item.name.toLowerCase().includes(term.slice(1).toLowerCase());
      });
      this.mentionListComponent?.setFilteredItems(this.filteredItems);
      this.setMentionListVisibility(this.filteredItems.length !== 0);
      this.mentionListComponent?.setCurrentIndex(0);
    }
  }

  updateMention() {
    this.mentionsList = [...this.mention];
  }

  updateMentionConfig() {
    this.config = Object.assign(this.config, this.mentionConfig);
  }

  extendSelection(length: number) {
    this.sel = document.getSelection();
    this.sel?.collapseToStart();
    for (let i = 0; i < length; i++) {
      this.sel?.modify(SelectionModify.Extend, SelectionModify.Backward, SelectionModify.Character);
    }
  }

  getTerm() {
    let term = '';
    let mention = '';
    this.sel = document.getSelection();
    if (this.sel.type === 'None') {
      return;
    }
    if (this.sel && this.sel.isCollapsed && this.sel.anchorNode?.parentElement?.className !== 'mention') {
      const searchLen = this.sel.anchorOffset;
      for (let i = 0; i < searchLen; i++) {
        this.sel.modify(SelectionModify.Extend, SelectionModify.Backward, SelectionModify.Character);
        term = this.sel.toString();
        if (term[0] === this.config.trigger) {
          term = this.sel.toString();
          if (i === 0 && this.sel.toString() !== this.config.trigger) { //Prevent Chrome entering inline element
            mention = '';
            if (this.sel.anchorNode !== undefined) {
              this.sel.collapseToEnd();
            }
            return mention;
          }
          const position = this._mentionService.getCaretTopPoint(this.sel);
          this.mentionListComponent!.position = Object.assign({},
            {
              ...position,
              direction: this.config.direction
            });
          break;
        }
      }

      mention = term.toString();
      if (this.sel.anchorNode !== undefined) {
        this.sel.collapseToEnd();
      }
      return mention;
    } else {
      mention = '';
      return mention;
    }
  }

  createMention(item: Item) {
    const term = this.getTerm();
    this.setMentionListVisibility(false);

    this.extendSelection(term!.length);

    this._mentionService.pasteHtmlAtCaret(
      `<span contenteditable="false" id="${item.id}" class="mention" 
      style="color:blue">${this.config.trigger}${item.name}</span>&nbsp;`);
    this.selectedMention.emit({ id: item.id, name: item.name });
  }

  @HostListener('focusout', ['$event'])
  hideMentionList() {
    this.setMentionListVisibility(false);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === KeyPressed.Backspace && this.isChromium) { // Handling Chromium bug
      this.sel = document.getSelection();
      if (this.sel?.isCollapsed) {
        this.sel.modify(SelectionModify.Extend, SelectionModify.Backward, SelectionModify.Character);
      }
    }
    if (e.key === KeyPressed.Enter && this.mentionListComponent?.isMentionListVisible) {
      this.createMention(this.mentionListComponent.filteredItems[this.mentionListComponent.currentIndex]);
      this.mentionListComponent?.setFilteredItems(this.filteredItems);
      this.mentionListComponent?.setCurrentIndex(0);
      return false;
    }

    if (this.mentionListComponent?.isMentionListVisible) {
      if (e.key === KeyPressed.ArrowUp || e.key === KeyPressed.ArrowDown) {
        return false;
      }
    }
  }

  @HostListener('keypress', ['$event'])
  detectTrigger(e: KeyboardEvent) {
    if (e.key === this.config.trigger) {
      this.listItems(this.filteredItems);
    }
  }

  @HostListener('keyup', ['$event'])
  @HostListener('click', ['$event'])
  getCaretPosition(e: KeyboardEvent) {
    this.sel = document.getSelection();

    if (e.key === KeyPressed.Backspace &&
      this.sel?.anchorNode?.parentElement?.className !== 'mention') {
      this.listItems(this.filteredItems);
    }

    this.sel?.isCollapsed ? this.caretPosition = this.sel?.anchorOffset : this.setMentionListVisibility(false);

    this.navigateInAutocomplete(e);
    this.filterItemsByTerm(e);
  }

  navigateInAutocomplete(e: KeyboardEvent) {
    if (e.key === KeyPressed.ArrowDown) { /*Navigate downward in autocomplete*/
      this.mentionListComponent?.pressedArrowDown();
    } else if (e.key === KeyPressed.ArrowUp) {  /*Navigate upward in autocomplete*/
      this.mentionListComponent?.pressedArrowUp();
    }
  }

  filterItemsByTerm(e: KeyboardEvent) {
    const term = this.getTerm();
    if (term && term[0] === this.config.trigger) {
      if (!/\s/.test(term)) { // Check whitespace in the term
        this.searchTerm.emit(term.slice(1).toLowerCase());
      }
      this.filteredItems = this.filteredItems.filter((item: Item) => {
        return item.name.toLowerCase().includes(term.slice(1).toLowerCase());
      });
      this.mentionListComponent?.setFilteredItems(this.filteredItems);
      this.setMentionListVisibility(this.filteredItems.length !== 0);
      if (e.key !== KeyPressed.ArrowDown && e.key !== KeyPressed.ArrowUp &&
        e.key !== KeyPressed.ArrowLeft && e.key !== KeyPressed.ArrowRight) {
        this.mentionListComponent?.setCurrentIndex(0);
      }
    } else {
      this.setMentionListVisibility(false);
    }
  }

  listItems(filteredItems: Item[]) {
    this.filteredItems = [...this.mentionsList];
    if (!this.mentionListComponent) {
      let componentFactory = this._componentResolver.resolveComponentFactory(MentionListComponent);
      let componentRef = this._viewContainerRef.createComponent(componentFactory);
      this.mentionListComponent = componentRef.instance;
      this.mentionListComponent.config = this.config;
      this.mentionListComponent.itemTemplate = this.itemTemplate;
      componentRef.instance['createMention'].subscribe((item) => {
        this.createMention(item);
      });
    }
    this.mentionListComponent?.setFilteredItems(filteredItems);
    this.mentionListComponent?.setCurrentIndex(0);
  }

  setMentionListVisibility(mentionListVisibility: boolean) {
    if (this.mentionListComponent !== undefined) {
      this.mentionListComponent.isMentionListVisible = mentionListVisibility;
    }
  }
}
