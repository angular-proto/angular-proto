import { createProto } from '@angular-proto/core';
import { injectElementRef } from '@angular-proto/core/utils';
import type { FocusOrigin } from '@angular/cdk/a11y';
import { FocusMonitor } from '@angular/cdk/a11y';
import type { BooleanInput } from '@angular/cdk/coercion';
import {
  afterRenderEffect,
  booleanAttribute,
  Directive,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

export interface ProtoFocusVisibleConfig {
  /**
   * The default value for whether focus-visible tracking is disabled.
   * Can be overridden by the `disabled` input.
   * @default false
   */
  defaultDisabled: boolean;
}

const protoFor = createProto<ProtoFocusVisible, ProtoFocusVisibleConfig>({
  defaultDisabled: false,
});

/**
 * Determines if focus should be considered "visible" based on the focus origin.
 *
 * Focus is visible when:
 * - Focus came from keyboard navigation
 * - The element is a text input (where the cursor should be visible)
 *
 * @param origin The focus origin from CDK FocusMonitor
 * @param element The focused element
 */
function shouldShowFocusVisible(origin: FocusOrigin, element: HTMLElement): boolean {
  if (origin === null) {
    return false;
  }

  // Always show focus for keyboard navigation
  if (origin === 'keyboard') {
    return true;
  }

  // Show focus for text inputs (cursor should be visible)
  if (isFocusableTextInput(element)) {
    return true;
  }

  return false;
}

const textTypes = new Set<string>(['text', 'password', 'email', 'number', 'search', 'tel', 'url']);

/**
 * Checks if an element is a text input that should show focus.
 */
function isFocusableTextInput(element: HTMLElement): boolean {
  if (element.tagName === 'TEXTAREA') {
    return true;
  }

  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type?.toLowerCase();
    // Text-like inputs that need a visible cursor
    return textTypes.has(type);
  }

  // Content editable elements
  if (element.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Directive that tracks focus-visible state using Angular CDK's FocusMonitor.
 *
 * This directive determines if focus should be visually indicated (focus-visible).
 * Focus is considered visible when:
 * - The element was focused via keyboard
 * - The element is a text input (where the cursor should be visible)
 *
 * Unlike `ProtoFocus`, this directive does NOT support `checkChildren` because
 * focus-visible styling should only apply to the specific element being focused,
 * not to container elements.
 *
 * ## Data Attributes
 * - `data-focus-visible`: Present when the element has visible focus
 *
 * @example
 * ```html
 * <button protoFocusVisible>Keyboard focus styling</button>
 *
 * <input protoFocusVisible type="text" />
 * ```
 *
 * @example
 * ```css
 * [protoFocusVisible][data-focus-visible] {
 *   outline: 2px solid blue;
 *   outline-offset: 2px;
 * }
 * ```
 */
@Directive({
  selector: '[protoFocusVisible]',
  exportAs: 'protoFocusVisible',
  host: {
    '[attr.data-focus-visible]': "isFocusVisible() ? '' : null",
  },
  providers: [ProtoFocusVisible.State.provide()],
})
export class ProtoFocusVisible {
  private static readonly Proto = protoFor(ProtoFocusVisible);
  static readonly State = ProtoFocusVisible.Proto.state;
  static readonly Config = ProtoFocusVisible.Proto.config;
  static readonly Hooks = ProtoFocusVisible.Proto.hooks;

  readonly config = ProtoFocusVisible.Config.inject();
  private readonly elementRef = injectElementRef();
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly injector = inject(Injector);

  /**
   * Whether focus-visible tracking is disabled.
   * When disabled becomes true, the focus-visible state is automatically reset.
   */
  readonly disabled = input<boolean, BooleanInput>(this.config.defaultDisabled, {
    transform: booleanAttribute,
    alias: 'protoFocusVisibleDisabled',
  });

  /**
   * Emitted when focus-visible state changes.
   * Emits true when focus becomes visible, false when it's hidden.
   */
  readonly focusVisibleChange = output<boolean>({ alias: 'protoFocusVisibleFocusVisibleChange' });

  private readonly _focusOrigin = signal<FocusOrigin>(null);

  /**
   * Signal containing the current focus origin.
   * null when not focused.
   */
  readonly focusOrigin = this._focusOrigin.asReadonly();

  private readonly _isFocusVisible = signal(false);

  /**
   * Signal indicating whether the element currently has visible focus.
   */
  readonly isFocusVisible = this._isFocusVisible.asReadonly();

  readonly state = ProtoFocusVisible.Proto(this);

  constructor() {
    afterRenderEffect(
      onCleanup => {
        if (this.disabled()) {
          this._isFocusVisible.set(false);
          this._focusOrigin.set(null);
          return;
        }

        untracked(() => {
          // Monitor only this element (no checkChildren for focus-visible)
          const subscription = this.focusMonitor
            .monitor(this.elementRef, false)
            .subscribe(focusOrigin => {
              // Update focus origin
              this._focusOrigin.set(focusOrigin);

              // Determine if focus should be visible
              const shouldShow = shouldShowFocusVisible(focusOrigin, this.elementRef.nativeElement);
              const wasVisible = this._isFocusVisible();

              this._isFocusVisible.set(shouldShow);

              // Emit change if state actually changed
              if (wasVisible !== shouldShow) {
                this.focusVisibleChange.emit(shouldShow);
              }
            });

          onCleanup(() => {
            subscription.unsubscribe();
            this.focusMonitor.stopMonitoring(this.elementRef);
          });
        });
      },
      { injector: this.injector },
    );
  }

  /**
   * Programmatically focuses the element.
   *
   * @param origin The focus origin to use.
   * @param options Standard FocusOptions (preventScroll, etc.)
   */
  focus(origin: FocusOrigin = 'keyboard', options?: FocusOptions): void {
    if (origin) {
      this.focusMonitor.focusVia(this.elementRef.nativeElement, origin, options);
    } else {
      this.elementRef.nativeElement.focus(options);
    }
  }

  /**
   * Programmatically blurs the element.
   */
  blur(): void {
    this.elementRef.nativeElement.blur();
  }
}
