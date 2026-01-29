import { listener } from '@angular-proto/core/utils';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'docs-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #anchor id="anchor">⚓️</div>

    <div id="tooltip">🔗 Drag the anchor and I should follow...</div>

    <label>
      <input type="checkbox" />
      debug mode
    </label>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: `
    body {
      position: relative;
    }
    #anchor {
      position: absolute;
      anchor-name: --anchor;
    }
    #tooltip {
      --d: 1em;
      --s: 1.2em; /* tail size */

      position: absolute;
      z-index: 0;
      position-anchor: --anchor;
      bottom: var(--d);
      position-area: top;
      margin-top: var(--d); /* the margin is need for the pseudo element, it does nothing here */
      position-try: flip-block; /* this will flip the position and the margin ! */
      anchor-name: --tooltip;
    }

    #tooltip:before {
      content: '';
      position: fixed;
      z-index: -1;
      width: var(--s);
      background: inherit;
      /* vertical position from tootlip  */
      top: calc(anchor(--tooltip top) - var(--d));
      bottom: calc(anchor(--tooltip bottom) - var(--d));
      /* horizontal position from anchor but we clamp it to the tooltip area */
      left: calc(anchor(--anchor center) - var(--s) / 2);
      margin: inherit; /* this will do the magic, it will hide either the top or the bottom of the shape */
      /* the arrow shape */
      clip-path: polygon(
        50% 0.2em,
        100% var(--d),
        100% calc(100% - var(--d)),
        50% calc(100% - 0.2em),
        0 calc(100% - var(--d)),
        0 var(--d)
      );
    }

    /* Extra Styling */
    body {
      min-height: 100vh;
      margin: 0;
      font-family: system-ui, sans-serif;
    }
    #anchor {
      left: 50%;
      top: 50%;
      background: #ddd;
      border-radius: 1rem;
      padding: 1rem;
      user-select: none;
    }
    #tooltip {
      max-width: 15em;
      text-align: center;
      border-radius: 1rem;
      padding: 1rem;
      background: #0088ff;
      color: #fff;
    }

    label {
      font-size: 25px;
      padding: 10px;
      cursor: pointer;
    }
    label input {
      width: 1lh;
      height: 1lh;
    }

    body:has(input:checked) #tooltip:before {
      background: red;
    }
  `,
})
export class Test {
  injector = inject(Injector);
  constructor() {
    afterNextRender(() => {
      console.log('afterNextRender');
      const anchor = document.getElementById('anchor') as HTMLElement;
      let isDragging = false;
      let offsetX: number;
      let offsetY: number;

      listener(
        anchor,
        'pointerdown',
        e => {
          console.log('pointerdown');
          isDragging = true;

          // Calculate offset between cursor and element's top-left corner
          const rect = anchor.getBoundingClientRect();
          offsetX = e.clientX - rect.left;
          offsetY = e.clientY - rect.top;

          anchor.style.cursor = 'grabbing';
        },
        { injector: this.injector },
      );

      listener(
        anchor,
        'mousemove',
        e => {
          if (!isDragging) {
            return;
          }

          anchor.style.left = e.clientX - offsetX + 'px';
          anchor.style.top = e.clientY - offsetY + 'px';
        },
        { injector: this.injector },
      );

      listener(
        anchor,
        'mouseup',
        () => {
          isDragging = false;
          anchor.style.cursor = 'move';
        },
        { injector: this.injector },
      );
    });
  }
}
