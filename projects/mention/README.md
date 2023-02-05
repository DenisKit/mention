# Mention

Angular directive for mentioning users. It works with contenteditable elements. This is an open source project from 
[Lampoint](https://lampoint.com/).

[DEMO](https://lampoint.com/mention)

## Installation
```
npm install @lampoint/mention
```

## Usage
Add MentionModule in app.module
```typescript
import { MentionModule } from '@lampoint/mention';

@NgModule({
    imports: [ MentionModule ],
    ...
})
```
## Basic example
```typescript
  mentions = [
    { id: 'denis', name: 'Denis' },
    { id: 'john', name: 'John' },
    { id: 'maria', name: 'Maria' },
    { id: 'michelle', name: 'Michelle' },
    { id: 'sophia', name: 'Sophia' },
    { id: 'james', name: 'James' },
    { id: 'emma', name: 'Emma' },
    { id: 'dave', name: 'Dave' }];
```

```html
<div contenteditable="true" [mention]="mentions"></div>
```

## Config options and events example
```html
<div contenteditable="true" [mention]="mentions" 
[mentionConfig]="{trigger: '#', direction: 'top'}"
(selectedMention)="selectedMention($event)"
(searchTerm)="searchTerm($event)"></div>
```

## Custom item template example
```html
<ng-template #itemTemplate let-item="item"> {{item.id}} {{item.name}}</ng-template>
```

```html
<div contenteditable="true" [mention]="mentions" [itemTemplate]="itemTemplate"></div>
```

## Config options
| Option | Default| Description|
| :---:   | :---: | :---: |
| trigger | @   | Trigger char for displaying items list   |
| direction | bottom|  Set items list direction (bottom/top)|

## Output events
| Output | Description|
| :---:   | :---: |
| @Output() selectedMention EventEmitter | Get selected mention { id: string, name: string } |
| @Output() searchTerm EventEmitter | Get term for async search { term: string } |

## License
[MIT](https://choosealicense.com/licenses/mit/)