import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, Renderer2, TemplateRef } from '@angular/core';
import { Config } from '../../interfaces/config';
import { Item } from '../../interfaces/item';
import { Position } from '../../interfaces/position';
import { Direction } from '../../interfaces/direction';

@Component({
  selector: 'app-mention-list',
  styleUrls: ['./mention-list.component.scss'],
  template: `
  <ng-template #defaultItemTemplate let-item="item">
    <div class="item-name">{{item.name}}</div>
  </ng-template>
  <div class="mention-list" *ngIf="isMentionListVisible">
    <div class="item" id="{{currentIndex === i ? 'selected' : ''}}"
    *ngFor="let item of filteredItems; let i = index"
    [ngClass]="currentIndex === i ? 'selected' : 'autocomplete'"
    (mouseover)="currentIndex=i"
    (mousedown)="createMention.emit(item); $event.preventDefault()"
    >
      <ng-container [ngTemplateOutlet]="itemTemplate ? itemTemplate : defaultItemTemplate" 
      [ngTemplateOutletContext]="{item:item}">
      </ng-container>
    </div>
  </div>
  `
})
export class MentionListComponent implements AfterViewChecked {
  @Input() config?: Config;
  @Input() itemTemplate?: TemplateRef<Item>;
  @Output() createMention = new EventEmitter();
  public filteredItems: Item[] = [];
  public currentIndex = 0;
  public isMentionListVisible = false;
  public position = new Position();
  constructor(private element: ElementRef, private cdRef: ChangeDetectorRef, private renderer: Renderer2) { }

  ngAfterViewChecked() {
    this.setPosition();
    this.setFocusItemVisible();
  }

  setFocusItemVisible() {
    const element = document.getElementById('selected');
    if (!element) return false;
    if (1 !== element.nodeType) return false;

    const html = this.element.nativeElement;
    const rect = element.getBoundingClientRect();
    const isVisible = !!rect && rect.top - (rect.height * 2) >= 0
      && rect.top <= html.clientHeight;

    if (!isVisible) {
      element?.scrollIntoView({ block: 'nearest' });
    }

  }

  setPosition() {
    this.renderer.setStyle(this.element.nativeElement, 'position', 'absolute');
    this.renderer.setStyle(this.element.nativeElement, 'left', `${this.position.left ? this.position.left : 0}px`);
    if (this.position.direction === Direction.Top) {
      this.renderer.setStyle(this.element.nativeElement, 'top',
        `${this.position.top - this.element.nativeElement.offsetHeight}px`);
    } else {
      this.renderer.setStyle(this.element.nativeElement, 'top',
        `${this.position.top ? this.position.top + this.position.height : 0}px`);
    }
  }

  setCurrentIndex(currentIndex: number) {
    this.currentIndex = currentIndex;
  }

  setFilteredItems(filteredItems: Item[]) {
    this.filteredItems = [...filteredItems];
    this.cdRef.detectChanges();
  }

  pressedArrowUp() {
    this.currentIndex <= 0 ? this.currentIndex = this.filteredItems.length - 1 :
      this.currentIndex -= 1;
  }

  pressedArrowDown() {
    this.filteredItems.length - 1 <= this.currentIndex ?
      this.currentIndex = 0 : this.currentIndex += 1;
  }
}
