import { createProto } from '@angular-proto/core';
import { injectElementRef } from '@angular-proto/core/utils';
import type { BooleanInput } from '@angular/cdk/coercion';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export interface PressConfig {
  /**
   * The default value for whether press tracking is disabled.
   * Can be overridden by the `disabled` input.
   * @default false
   */
  defaultDisabled: boolean;
}

export const PressProto = createProto<ProtoPress, PressConfig>('Press', {
  defaultDisabled: false,
});

/**
 * Directive that tracks press/active state during pointer interactions.
 *
 * The press state is active from pointer down until pointer up, even if the pointer
 * moves outside the element (unlike hover). This matches native button behavior.
 *
 * This directive properly handles:
 * - Pointer events (mouse, touch, pen)
 * - Pointer moving outside element while pressed
 * - Pointer cancel events
 * - iOS Safari's inconsistent pointerleave behavior
 * - Disabled state (automatically resets press when disabled)
 *
 * ## Data Attributes
 * - `data-press`: Present when the element is pressed
 *
 * @example
 * ```html
 * <button protoPress>Press me</button>
 *
 * <div protoPress [disabled]="isDisabled" (pressStart)="onPress()">
 *   Pressable element
 * </div>
 * ```
 *
 * @example
 * ```css
 * [protoPress][data-press] {
 *   transform: scale(0.98);
 * }
 * ```
 */
@Directive({
  selector: '[protoPress]',
  exportAs: 'protoPress',
  host: {
    '[attr.data-press]': "isPressed() ? '' : null",
    '(pointerdown)': 'onPointerDown($event)',
  },
  providers: [PressProto.provideState()],
})
export class ProtoPress {
  private readonly config = PressProto.injectConfig();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = injectElementRef();
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Whether press tracking is disabled.
   * When disabled becomes true, the press state is automatically reset.
   */
  readonly disabled = input<boolean, BooleanInput>(this.config.defaultDisabled, {
    transform: booleanAttribute,
    alias: 'protoPressDisabled',
  });

  /**
   * Emitted when press starts.
   */
  readonly pressStart = output<void>({ alias: 'protoPressStart' });

  /**
   * Emitted when press ends.
   */
  readonly pressEnd = output<void>({ alias: 'protoPressEnd' });

  private readonly _isPressed = signal(false);

  /**
   * Signal indicating whether the element is currently pressed.
   */
  readonly isPressed = this._isPressed.asReadonly();

  /**
   * Store cleanup functions for global event listeners.
   */
  private cleanupListeners: (() => void)[] = [];

  /**
   * The state of the press directive.
   */
  readonly state = PressProto.initState(this);

  constructor() {
    // Watch for disabled state changes and reset press when disabled becomes true
    effect(() => {
      if (this.disabled() && this._isPressed()) {
        this.reset();
      }
    });

    // Cleanup global listeners on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanupListeners.forEach(cleanup => cleanup());
    });
  }

  /**
   * Resets the press state and cleans up global listeners.
   */
  private reset(): void {
    if (!this._isPressed()) {
      return;
    }

    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    this._isPressed.set(false);
    this.pressEnd.emit();
  }

  /** @internal */
  protected onPointerDown(_event: PointerEvent): void {
    if (this.disabled() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Clean up any existing listeners (shouldn't happen but safety first)
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];

    // Set pressed state
    this._isPressed.set(true);
    this.pressStart.emit();

    // Get the owner document (handles iframes correctly)
    const element = this.elementRef.nativeElement;
    const ownerDocument = element.ownerDocument ?? this.document;

    // Set up global listeners to track pointer state even when outside element
    const onPointerUp = () => this.reset();

    // Use pointermove instead of pointerleave because iOS Safari doesn't
    // consistently fire pointerleave events.
    const onPointerMove = (moveEvent: PointerEvent) => {
      // Check if pointer is still over the element
      const target = moveEvent.target as Node | null;
      if (target && !element.contains(target) && element !== target) {
        this.reset();
      }
    };

    const onPointerCancel = () => this.reset();

    ownerDocument.addEventListener('pointerup', onPointerUp);
    ownerDocument.addEventListener('pointermove', onPointerMove);
    ownerDocument.addEventListener('pointercancel', onPointerCancel);

    this.cleanupListeners = [
      () => ownerDocument.removeEventListener('pointerup', onPointerUp),
      () => ownerDocument.removeEventListener('pointermove', onPointerMove),
      () => ownerDocument.removeEventListener('pointercancel', onPointerCancel),
    ];
  }
}
