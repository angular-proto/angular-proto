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

export interface ProtoFocusConfig {
  /**
   * The default value for whether focus tracking is disabled.
   * Can be overridden by the `disabled` input.
   * @default false
   */
  defaultDisabled: boolean;

  /**
   * The default value for whether to monitor the element's children for focus state.
   * Can be overridden by the `checkChildren` input.
   * @default false
   */
  defaultCheckChildren: boolean;
}

const protoFor = createProto<ProtoFocus, ProtoFocusConfig>({
  defaultDisabled: false,
  defaultCheckChildren: false,
});

/**
 * Directive that tracks focus state using Angular CDK's FocusMonitor.
 *
 * This directive tracks whether an element (or optionally its children) is focused.
 * For keyboard-only focus styling (focus-visible), use `ProtoFocusVisible` instead.
 *
 * ## Data Attributes
 * - `data-focus`: Present when the element is focused (any origin)
 *
 * @example
 * ```html
 * <button protoFocus>Focus me</button>
 *
 * <!-- Track focus within child elements -->
 * <div protoFocus [checkChildren]="true">
 *   <button>Child button</button>
 * </div>
 * ```
 *
 * @example
 * ```css
 * [protoFocus][data-focus] {
 *   box-shadow: 0 0 0 2px blue;
 * }
 * ```
 */
@Directive({
  selector: '[protoFocus]',
  exportAs: 'protoFocus',
  host: {
    '[attr.data-focus]': "isFocused() ? '' : null",
  },
  providers: [ProtoFocus.State.provide()],
})
export class ProtoFocus {
  private static readonly Proto = protoFor(ProtoFocus);
  static readonly State = ProtoFocus.Proto.state;
  static readonly Config = ProtoFocus.Proto.config;
  static readonly Hooks = ProtoFocus.Proto.hooks;

  readonly config = ProtoFocus.Config.inject();
  private readonly elementRef = injectElementRef();
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly injector = inject(Injector);

  /**
   * Whether focus tracking is disabled.
   * When disabled becomes true, the focus state is automatically reset.
   */
  readonly disabled = input<boolean, BooleanInput>(this.config.defaultDisabled, {
    transform: booleanAttribute,
    alias: 'protoFocusDisabled',
  });

  /**
   * Whether to count the element as focused when its children are focused.
   * Useful for composite components like menus, toolbars, or form groups.
   */
  readonly checkChildren = input<boolean, BooleanInput>(this.config.defaultCheckChildren, {
    transform: booleanAttribute,
    alias: 'protoFocusCheckChildren',
  });

  /**
   * Emitted when focus state changes.
   * The value is the focus origin ('keyboard', 'mouse', 'touch', 'program') or null when blurred.
   */
  readonly focusChange = output<FocusOrigin>({ alias: 'protoFocusChange' });

  private readonly _focusOrigin = signal<FocusOrigin>(null);

  /**
   * Signal containing the current focus origin.
   * null when not focused.
   */
  readonly focusOrigin = this._focusOrigin.asReadonly();

  private readonly _isFocused = signal(false);

  /**
   * Signal indicating whether the element is currently focused.
   */
  readonly isFocused = this._isFocused.asReadonly();

  readonly state = ProtoFocus.Proto(this);

  constructor() {
    afterRenderEffect(
      onCleanup => {
        if (this.disabled()) {
          this._isFocused.set(false);
          this._focusOrigin.set(null);
          return;
        }

        const checkChildren = this.checkChildren();
        untracked(() => {
          const subscription = this.focusMonitor
            .monitor(this.elementRef, checkChildren)
            .subscribe(focusOrigin => {
              // Don't show focus on disabled elements
              if (this.disabled()) {
                this._isFocused.set(false);
                this._focusOrigin.set(null);
                return;
              }

              // Update focus state
              this._focusOrigin.set(focusOrigin);
              this._isFocused.set(focusOrigin !== null);
              this.focusChange.emit(focusOrigin);
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
  focus(origin: FocusOrigin = 'program', options?: FocusOptions): void {
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
