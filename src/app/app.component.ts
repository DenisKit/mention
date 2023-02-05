import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  mentions = [
    { id: 'denis', name: 'Denis' },
    { id: 'john', name: 'John' },
    { id: 'maria', name: 'Maria' },
    { id: 'michelle', name: 'Michelle' },
    { id: 'sophia', name: 'Sophia' },
    { id: 'james', name: 'James' },
    { id: 'emma', name: 'Emma' },
    { id: 'dave', name: 'Dave' }];

  constructor() { }

  selectedMention(item: any) {
    console.log(item);
  }

  searchTerm(term: string) {
    console.log(term);
  }
}
