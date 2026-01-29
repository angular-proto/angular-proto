# @angular-proto/core/anchor

CSS Anchor Positioning primitives for Angular. This module provides unstyled, accessible overlay positioning using native CSS anchor positioning APIs.

## Features

- **Native CSS Anchor Positioning** - Uses modern CSS properties (`anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`) for positioning
- **No JavaScript Calculations** - All positioning is handled by the browser's CSS engine
- **Automatic Collision Detection** - Built-in fallback positioning via `position-try-fallbacks`
- **Structural Directive** - Uses `*protoAnchorTarget` syntax for clean templates (no manual `@if` needed)
- **Signal-Based State** - Full integration with Angular signals for reactive state management
- **Accessible by Default** - Proper ARIA attributes (`aria-expanded`, `aria-haspopup`)
- **Styling Hooks** - Data attributes for CSS-based styling (`data-placement`, `data-anchor-open`)

## Installation

```typescript
import { ProtoAnchor, ProtoAnchorTarget, ProtoAnchorArrow } from '@angular-proto/core/anchor';
```

## Basic Usage

The primary pattern uses the structural directive syntax:

```html
<button protoAnchor #anchor="protoAnchor" (click)="anchor.toggle()">Open Menu</button>

<div *protoAnchorTarget="anchor" role="menu">
  <div protoAnchorArrow></div>
  Menu content here
</div>
```

The structural directive automatically handles showing and hiding the content based on the anchor's `isOpen` state.

## API Reference

### ProtoAnchor

The anchor trigger directive that establishes the positioning reference.

#### Inputs

| Input                     | Type                 | Default                 | Description                       |
| ------------------------- | -------------------- | ----------------------- | --------------------------------- |
| `protoAnchorOpen`         | `boolean`            | `false`                 | Whether the anchor target is open |
| `protoAnchorPlacement`    | `AnchorPlacement`    | `'bottom'`              | Preferred placement position      |
| `protoAnchorOffset`       | `AnchorOffset`       | `{ main: 0, cross: 0 }` | Offset from anchor                |
| `protoAnchorFlipBehavior` | `AnchorFlipBehavior` | `'flip-block'`          | Collision handling                |
| `protoAnchorVisibility`   | `AnchorVisibility`   | `'always'`              | Visibility behavior               |
| `protoAnchorDisabled`     | `boolean`            | `false`                 | Disable anchor functionality      |
| `protoAnchorPopupType`    | `string \| null`     | `'true'`                | ARIA haspopup value               |

#### Outputs

| Output                  | Type      | Description                     |
| ----------------------- | --------- | ------------------------------- |
| `protoAnchorOpenChange` | `boolean` | Emitted when open state changes |

#### Methods

| Method                   | Description                      |
| ------------------------ | -------------------------------- |
| `open()`                 | Opens the anchor target          |
| `close()`                | Closes the anchor target         |
| `toggle()`               | Toggles open/closed state        |
| `setOpen(open: boolean)` | Sets open state programmatically |

#### Signals

| Signal       | Type              | Description            |
| ------------ | ----------------- | ---------------------- |
| `isOpen`     | `Signal<boolean>` | Current open state     |
| `anchorName` | `Signal<string>`  | Unique CSS anchor name |

### ProtoAnchorTarget (Structural Directive)

The positioned overlay element using structural directive syntax.

#### Usage

```html
<!-- Basic usage -->
<div *protoAnchorTarget="anchor">Content</div>

<!-- With additional options -->
<div *protoAnchorTarget="anchor; placement: 'top'; offset: { main: 8, cross: 0 }">Content</div>
```

#### Inputs

| Input                                     | Type                 | Default   | Description            |
| ----------------------------------------- | -------------------- | --------- | ---------------------- |
| `protoAnchorTarget`                       | `ProtoAnchor`        | required  | The anchor instance    |
| `protoAnchorTargetPlacement`              | `AnchorPlacement`    | inherited | Override placement     |
| `protoAnchorTargetOffset`                 | `AnchorOffset`       | inherited | Override offset        |
| `protoAnchorTargetFlipBehavior`           | `AnchorFlipBehavior` | inherited | Override flip behavior |
| `protoAnchorTargetVisibility`             | `AnchorVisibility`   | inherited | Override visibility    |
| `protoAnchorTargetZIndex`                 | `number`             | `1000`    | Z-index value          |
| `protoAnchorTargetUseFixed`               | `boolean`            | `true`    | Use fixed positioning  |
| `protoAnchorTargetAutoHideOnEscape`       | `boolean`            | `true`    | Hide on Escape key     |
| `protoAnchorTargetAutoHideOnClickOutside` | `boolean`            | `false`   | Hide on outside click  |

### ProtoAnchorTargetElement (Attribute Directive)

For cases where you need manual control over rendering (with `@if`), use the attribute directive:

```html
@if (anchor.isOpen()) {
<div protoAnchorTargetElement [protoAnchorTargetElementAnchorName]="anchor.anchorName()">
  Content
</div>
}
```

### ProtoAnchorArrow

Optional arrow element for the overlay.

#### Inputs

| Input                    | Type     | Default | Description            |
| ------------------------ | -------- | ------- | ---------------------- |
| `protoAnchorArrowWidth`  | `number` | `10`    | Arrow width in pixels  |
| `protoAnchorArrowHeight` | `number` | `5`     | Arrow height in pixels |

## Types

### AnchorPlacement

```typescript
type AnchorPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';
```

### AnchorOffset

```typescript
interface AnchorOffset {
  main: number; // Distance from anchor (perpendicular)
  cross: number; // Offset along the edge (parallel)
}
```

### AnchorFlipBehavior

```typescript
type AnchorFlipBehavior =
  | 'none'
  | 'flip-block' // Flip vertically (top <-> bottom)
  | 'flip-inline' // Flip horizontally (left <-> right)
  | 'flip-block flip-inline'; // Flip both axes
```

### AnchorVisibility

```typescript
type AnchorVisibility =
  | 'always' // Always visible
  | 'anchors-visible' // Hide when anchor is not visible
  | 'no-overflow'; // Hide when it would overflow
```

## Styling

Use data attributes for placement-aware styling:

```css
/* Base styles */
[data-anchor-target] {
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Placement-specific animations */
[data-placement^='top'] {
  transform-origin: bottom center;
}

[data-placement^='bottom'] {
  transform-origin: top center;
}

[data-placement^='left'] {
  transform-origin: right center;
}

[data-placement^='right'] {
  transform-origin: left center;
}

/* Arrow styling */
[data-anchor-arrow] {
  position: absolute;
  background: inherit;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

[data-placement^='top'] [data-anchor-arrow] {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
}

[data-placement^='bottom'] [data-anchor-arrow] {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
}
```

## Configuration

Configure defaults using `provideConfig`:

```typescript
import { AnchorProto, AnchorTargetProto } from '@angular-proto/core/anchor';

// In your component or route providers
providers: [
  AnchorProto.provideConfig({
    defaultPlacement: 'top',
    defaultOffset: { main: 8, cross: 0 },
    defaultFlipBehavior: 'flip-block flip-inline',
  }),
  AnchorTargetProto.provideConfig({
    useFixedPositioning: true,
    autoHideOnEscape: true,
  }),
];
```

## Advanced Usage

### With Arrow

```html
<button protoAnchor #anchor="protoAnchor" (click)="anchor.toggle()">Trigger</button>

<div *protoAnchorTarget="anchor" class="tooltip">
  <div protoAnchorArrow></div>
  Tooltip with arrow
</div>
```

### Custom Offset

```html
<button protoAnchor #anchor="protoAnchor" [protoAnchorOffset]="{ main: 12, cross: 0 }">
  Trigger
</button>

<div *protoAnchorTarget="anchor">Content with offset</div>
```

### Placement Override on Target

```html
<button protoAnchor #anchor="protoAnchor" protoAnchorPlacement="bottom">Trigger</button>

<div *protoAnchorTarget="anchor; placement: 'top'">
  This will appear on top, overriding the anchor's default
</div>
```

### Programmatic Control

```typescript
@Component({
  template: `
    <button protoAnchor #anchor="protoAnchor">Trigger</button>
    <div *protoAnchorTarget="anchor">Content</div>
  `,
})
class MyComponent {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');

  openMenu() {
    this.anchor().open();
  }

  closeMenu() {
    this.anchor().close();
  }

  toggleMenu() {
    this.anchor().toggle();
  }
}
```

## Utility Functions

```typescript
import { getOppositePlacement, getPositionArea, parsePlacement } from '@angular-proto/core/anchor';

// Get the opposite placement (for flip logic)
getOppositePlacement('top'); // 'bottom'
getOppositePlacement('left-start'); // 'right-start'

// Get CSS position-area value
getPositionArea('top-end'); // 'top right'

// Parse placement into components
parsePlacement('bottom-start');
// { direction: 'bottom', alignment: 'start' }
```

## Browser Support

CSS Anchor Positioning is supported in:

- Chrome 125+
- Edge 125+
- Firefox (behind flag, full support expected 2026)
- Safari (in development)

For browsers without support, consider using a polyfill or fallback positioning library.

## Accessibility

The anchor directives automatically handle:

- `aria-expanded` - Set on trigger based on open state
- `aria-haspopup` - Configurable popup type hint
- Keyboard navigation - Escape key to close (configurable)

Ensure your overlay content includes appropriate ARIA roles:

```html
<button protoAnchor #anchor="protoAnchor" [protoAnchorPopupType]="'menu'">Options</button>

<div *protoAnchorTarget="anchor" role="menu" aria-label="Options menu">
  <button role="menuitem">Option 1</button>
  <button role="menuitem">Option 2</button>
</div>
```
