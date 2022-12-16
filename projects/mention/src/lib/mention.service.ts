import { Injectable } from '@angular/core';
import { Position } from './interfaces/position';

@Injectable({
  providedIn: 'root'
})
export class MentionService {

  constructor() { }

  pasteHtmlAtCaret(html: string) {
    let sel: any, range;
    if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        // Range.createContextualFragment() would be useful here but is
        // only relatively recently standardized and is not supported in
        // some browsers (IE9, for one)
        const el = document.createElement('div');
        el.innerHTML = html;
        let frag = document.createDocumentFragment(), node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        const firstNode = frag.firstChild;
        range.insertNode(frag);

        // Preserve the selection
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          range.collapse(true);

          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if ((sel = window.getSelection) && sel.type !== 'Control') {
      // IE < 9
      const originalRange = sel.createRange();
      const range = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);
      range.setEndPoint('StartToStart', originalRange);
      range.select();
    }
  }

  getCaretTopPoint(sel: any): Position {
    const r = sel.getRangeAt(0);
    let rect, r2;
    // supposed to be textNode in most cases
    // but div[contenteditable] when empty
    const node = r.startContainer;
    const offset = r.startOffset;
    if (offset > 0) {
      // new range, don't influence DOM state
      r2 = document.createRange();
      r2.setStart(node, (offset - 1));
      r2.setEnd(node, offset);
      rect = r2.getBoundingClientRect();
      return this.formatListPosition(rect);
    } else if (offset < node.length) {
      r2 = document.createRange();
      // similar but select next on letter
      r2.setStart(node, offset);
      r2.setEnd(node, (offset + 1));
      rect = r2.getBoundingClientRect();
      return this.formatListPosition(rect);
    } else if (offset === node.length) {
      r2 = document.createRange();
      // similar but select next on letter
      r2.setStart(node, offset);
      rect = r2.getBoundingClientRect();
      return this.formatListPosition(rect);
    } else { // textNode has length
      rect = node.getBoundingClientRect();
      const styles = getComputedStyle(node);
      const lineHeight = parseInt(styles.lineHeight);
      const fontSize = parseInt(styles.fontSize);
      // roughly half the whitespace... but not exactly
      const delta = (lineHeight - fontSize) / 2;
      rect.top += delta;
      return this.formatListPosition(rect);
    }
  }
  formatListPosition(rect: any) {
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      height: rect.height
    }
  }
}
