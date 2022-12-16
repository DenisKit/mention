import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MentionListComponent } from './components/mention-list/mention-list.component';
import { MentionDirective } from './mention.directive';



@NgModule({
  declarations: [
    MentionDirective,
    MentionListComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MentionDirective
  ]
})
export class MentionModule { }
