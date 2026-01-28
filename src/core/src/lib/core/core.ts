import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'proto',
  imports: [],
  template: `<p>Core works!</p>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Core {}
