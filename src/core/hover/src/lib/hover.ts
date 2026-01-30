import { createProto } from '@angular-proto/core';
import type { BooleanInput } from '@angular/cdk/coercion';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  Directive,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';

/**
 * Time in milliseconds to ignore emulated mouse events after a touch interaction.
 *
 * On iOS devices, after a touch event (pointerup/touchend), the browser fires
 * emulated mouse events with `pointerType="mouse"`. These fake events happen
 * immediately after onPointerUp and before onFocus, causing unwanted hover states.
 *
 * The 50ms window is short enough to catch iOS's emulated events while being
 * long enough to account for event timing variations. This value is based on
 * React Spectrum's implementation which has been battle-tested across devices.
 *
 * @see https://github.com/adobe/react-spectrum/blob/main/packages/@react-aria/interactions/src/useHover.ts
 */
const TOUCH_EMULATION_DEBOUNCE_MS = 50;

/**
 * Global service to track touch/pointer state across all hover interactions.
 * This is necessary because iOS and some touch devices emit fake mouse events
 * after touch events, which can cause "sticky hover" states.
 *
 * Instead of using an Injectable service, we use module-level state since
 * this needs to be shared across all ProtoHover instances globally.
 *
 * @see https://github.com/adobe/react-spectrum/blob/main/packages/@react-aria/interactions/src/useHover.ts
 */
let ignoreEmulatedMouseEvents = false;
let globalListenersSetup = false;

function setupGlobalTouchListeners(document: Document): void {
  if (globalListenersSetup) {
    return;
  }
  globalListenersSetup = true;

  const setIgnoreEmulatedMouseEvents = () => {
    ignoreEmulatedMouseEvents = true;
    // Clear the flag after the debounce period
    setTimeout(() => (ignoreEmulatedMouseEvents = false), TOUCH_EMULATION_DEBOUNCE_MS);
  };

  const handleGlobalPointerEvent = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      setIgnoreEmulatedMouseEvents();
    }
  };

  document.addEventListener('pointerup', handleGlobalPointerEvent);
  document.addEventListener('touchend', setIgnoreEmulatedMouseEvents);
}

export interface ProtoHoverConfig {
  /**
   * Whether hover tracking is globally disabled.
   */
  disabled: boolean;
}

const protoFor = createProto<ProtoHover, ProtoHoverConfig>({
  disabled: false,
});

/**
 * Directive that tracks hover state with proper touch device handling.
 *
 * This directive properly handles:
 * - Touch devices (no "sticky hover" on iOS)
 * - Emulated mouse events after touch interactions
 * - Disabled state (automatically resets hover when disabled)
 *
 * ## Data Attributes
 * - `data-hover`: Present when the element is hovered
 *
 * @example
 * ```html
 * <button protoHover>Hover me</button>
 *
 * <div protoHover [disabled]="isDisabled" (hoverStart)="onHover()">
 *   Hoverable element
 * </div>
 * ```
 *
 * @example
 * ```css
 * [protoHover][data-hover] {
 *   background: lightblue;
 * }
 * ```
 */
@Directive({
  selector: '[protoHover]',
  exportAs: 'protoHover',
  host: {
    '[attr.data-hover]': "isHovered() ? '' : null",
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(touchstart)': 'onTouchStart()',
    '(mouseenter)': 'onMouseEnter($event)',
    '(mouseleave)': 'onMouseLeave($event)',
  },
  providers: [ProtoHover.State.provide()],
})
export class ProtoHover {
  private static readonly Proto = protoFor(ProtoHover);
  static readonly State = ProtoHover.Proto.state;
  static readonly Config = ProtoHover.Proto.config;
  static readonly Hooks = ProtoHover.Proto.hooks;

  readonly config = ProtoHover.Config.inject();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  /**
   * Whether hover tracking is disabled.
   * When disabled becomes true, the hover state is automatically reset.
   */
  readonly disabled = input<boolean, BooleanInput>(this.config.disabled, {
    transform: booleanAttribute,
    alias: 'protoHoverDisabled',
  });

  /**
   * Emitted when hover starts.
   */
  readonly hoverStart = output<void>({ alias: 'protoHoverStart' });

  /**
   * Emitted when hover ends.
   */
  readonly hoverEnd = output<void>({ alias: 'protoHoverEnd' });

  private readonly _isHovered = signal(false);

  /**
   * Signal indicating whether the element is currently hovered.
   */
  readonly isHovered = this._isHovered.asReadonly();

  /**
   * Track whether this specific element should ignore emulated mouse events.
   * This is separate from the global flag because touch events are element-specific.
   */
  private ignoreEmulatedMouseEvents = false;

  readonly state = ProtoHover.Proto(this);

  constructor() {
    // Setup global touch listeners for emulated mouse event detection
    if (isPlatformBrowser(this.platformId)) {
      setupGlobalTouchListeners(this.document);
    }

    // Watch for disabled state changes and reset hover when disabled becomes true
    effect(() => {
      if (this.disabled() && this._isHovered()) {
        this.triggerHoverEnd('mouse');
      }
    });
  }

  /**
   * Triggers the hover start state if conditions are met.
   */
  private triggerHoverStart(event: Event, pointerType: string): void {
    // Don't trigger hover for touch events, when disabled, when already hovered,
    // or if the event doesn't contain the current element
    if (
      this.disabled() ||
      pointerType === 'touch' ||
      this._isHovered() ||
      !(event.currentTarget as Element)?.contains(event.target as Element)
    ) {
      return;
    }

    this._isHovered.set(true);
    this.hoverStart.emit();
  }

  /**
   * Triggers the hover end state.
   */
  private triggerHoverEnd(pointerType: string): void {
    // Don't end hover for touch events or if not currently hovered
    if (pointerType === 'touch' || !this._isHovered()) {
      return;
    }

    this._isHovered.set(false);
    this.hoverEnd.emit();
  }

  protected onPointerEnter(event: PointerEvent): void {
    // Ignore emulated mouse events from touch interactions
    if (ignoreEmulatedMouseEvents && event.pointerType === 'mouse') {
      return;
    }

    this.triggerHoverStart(event, event.pointerType);
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (!this.disabled() && (event.currentTarget as Element)?.contains(event.target as Element)) {
      this.triggerHoverEnd(event.pointerType);
    }
  }

  protected onTouchStart(): void {
    // Mark that we should ignore the next mouse enter event
    this.ignoreEmulatedMouseEvents = true;
  }

  protected onMouseEnter(event: MouseEvent): void {
    // Only trigger if we're not ignoring emulated mouse events
    if (!this.ignoreEmulatedMouseEvents && !ignoreEmulatedMouseEvents) {
      this.triggerHoverStart(event, 'mouse');
    }

    // Reset the local flag after handling
    this.ignoreEmulatedMouseEvents = false;
  }

  protected onMouseLeave(event: MouseEvent): void {
    if (!this.disabled() && (event.currentTarget as Element)?.contains(event.target as Element)) {
      this.triggerHoverEnd('mouse');
    }
  }
}
