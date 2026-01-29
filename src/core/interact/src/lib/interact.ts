import { createProto } from '@angular-proto/core';
import {
  injectElementRef,
  listener,
  Obj,
  supportsDisabledAttribute,
} from '@angular-proto/core/utils';
import type { BooleanInput, NumberInput } from '@angular/cdk/coercion';
import { booleanAttribute, computed, Directive, input, numberAttribute } from '@angular/core';

export const ProtoInteractEvents = new Set([
  'click',
  'keydown',
  'keyup',
  'pointerdown',
  'mousedown',
] as const);

export type ProtoInteractEventTypes = typeof ProtoInteractEvents extends Set<infer T> ? T : never;

export interface ProtoInteractEventConfig {
  /**
   * Whether to capture the event.
   * @default true
   */
  capture: boolean;

  /**
   * Whether to only handle the event on the current element.
   * If true, the event will be handled only if the target is the current element.
   * If false, bubbled events from children will be handled as well.
   * @default true
   */
  selfOnly: boolean;

  /**
   * Whether to prevent the default action of the event.
   * @default true
   */
  preventDefault: boolean;

  /**
   * Whether to stop the immediate propagation of the event.
   * @default true
   */
  stopImmediatePropagation: boolean;
}

export interface ProtoInteractConfig {
  /**
   * The fallback tab index to use when the element's `tabindex` attribute is absent.
   * @default 0
   */
  fallbackTabIndex: number;

  /**
   * The event configuration to handle.
   * @default
   * ```ts
   * {
   *   capture: true,
   *   selfOnly: true,
   *   preventDefault: true,
   *   stopImmediatePropagation: true,
   * }
   * ```
   * -for all events.
   */
  events: Record<ProtoInteractEventTypes, ProtoInteractEventConfig>;
}

export function createProtoInteractDefaultConfig(
  opts: { fallbackTabIndex?: number; allEvents?: Partial<ProtoInteractEventConfig> } = {},
): ProtoInteractConfig {
  return {
    fallbackTabIndex: opts.fallbackTabIndex ?? 0,
    events: Obj.fromEntries(
      Array.from(ProtoInteractEvents).map(event => [
        event,
        {
          capture: true,
          selfOnly: true,
          preventDefault: true,
          stopImmediatePropagation: true,
          ...opts.allEvents,
        } satisfies ProtoInteractEventConfig,
      ]),
    ),
  };
}

export const InteractProto = createProto<ProtoInteract, ProtoInteractConfig>(
  'Interact',
  createProtoInteractDefaultConfig,
);

/**
 * Base interactive directive providing common states and accessibility features.
 *
 * ## Features
 * - **Disabled state**: Proper handling for both native and non-native elements
 * - **Tab index management**: Automatic adjustment based on disabled/focusable state
 * - **ARIA attributes**: Automatic aria-disabled for non-native elements
 *
 * ## Data Attributes
 * The directive sets these data attributes for CSS styling:
 * - `data-disabled`: Present when disabled
 * - `data-disabled-focusable`: Present when both disabled and focusable
 *
 * @example
 * ```html
 * <button protoInteract>Click me</button>
 *
 * <div protoInteract [disabled]="isDisabled" [focusable]="true">
 *   Disabled but still focusable for tooltip
 * </div>
 * ```
 *
 * @example
 * ```css
 * [protoInteract][data-disabled] {
 *   opacity: 0.5;
 * }
 * [protoInteract] .loading-indicator {
 *   display: none;
 * }
 * [protoInteract][data-disabled-focusable] .loading-indicator {
 *   display: inline-block;
 * }
 * ```
 */
@Directive({
  selector: '[protoInteract]',
  exportAs: 'protoInteract',
  host: {
    // Native attributes
    '[attr.disabled]': 'disabledAttr()',
    '[attr.tabindex]': 'tabIndexAttr()',
    '[aria-disabled]': 'ariaDisabledAttr()',

    // Data attributes for CSS styling
    '[attr.data-disabled]': 'dataDisabledAttr()',
    '[attr.data-disabled-focusable]': 'dataDisabledFocusableAttr()',
  },
  providers: [InteractProto.provideState()],
})
export class ProtoInteract {
  readonly config = InteractProto.injectConfig();
  readonly elementRef = injectElementRef();

  /**
   * Whether the host element natively supports the `disabled` attribute.
   * This is true for elements like `<button>`, `<input>`, `<select>`, etc.
   */
  readonly hasNativeDisable = supportsDisabledAttribute(this.elementRef);

  /**
   * Whether the element is disabled.
   *
   * When disabled:
   * - Click, keyboard, and pointer events are blocked
   * - `data-disabled` attribute is added for styling
   * - Native buttons receive the `disabled` attribute
   * - Non-native elements receive `aria-disabled="true"`
   */
  readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'protoInteractDisabled',
  });

  /**
   * Whether the button remains focusable when disabled.
   *
   * Enable this for:
   * - Loading states: Prevents keyboard users from losing focus when a button
   *   temporarily disables during an async operation
   * - Tooltips: Allows showing explanatory tooltips on disabled buttons
   * - Discoverability: Lets screen reader users discover and understand
   *   why an action is unavailable
   *
   * When enabled, uses `aria-disabled` instead of the native `disabled` attribute
   * to keep the button in the tab order while still blocking activation.
   *
   * @see {@link https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols APG: Focusability of Disabled Controls}
   */
  readonly focusable = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'protoInteractFocusable',
  });

  /**
   * The tab index for the element.
   * This is automatically adjusted based on the disabled and focusable states.
   */
  readonly tabIndex = input<number, NumberInput>(
    numberAttribute(
      this.elementRef.nativeElement.getAttribute('tabindex'),
      this.config.fallbackTabIndex,
    ),
    {
      transform: value => numberAttribute(value, this.config.fallbackTabIndex),
      alias: 'protoInteractTabIndex',
    },
  );

  /**
   * Optionally set the fallback aria-disabled attribute when not in a disabled state.
   */
  readonly ariaDisabled = input<boolean, BooleanInput>(
    booleanAttribute(this.elementRef.nativeElement.getAttribute('aria-disabled')),
    { transform: booleanAttribute, alias: 'protoInteractAriaDisabled' },
  );

  /**
   * Computed tab index attribute value.
   * - For native disabled elements: uses the input value directly (browser handles it)
   * - When focusable: ensures at least 0 (so element is tabbable)
   * - When disabled (not focusable): ensures at most -1 (removes from tab order)
   *
   * This is a computed to allow programmatic override via the controlled signal pattern.
   */
  readonly tabIndexAttr = computed(() => {
    let value = this.tabIndex();

    // Only adjust for non-native elements (native disabled already handles tab order)
    if (!this.hasNativeDisable && this.disabled()) {
      value = this.focusable() ? value : -1;
    }

    return value;
  });

  /**
   * Computed aria-disabled attribute value.
   * - Returns 'true' when the element is disabled but uses aria-disabled
   *   (either non-native elements, or native elements with focusable=true)
   * - Returns null otherwise (to not render the attribute)
   *
   * Note: Native disabled attribute already communicates state to AT,
   * so we only add aria-disabled when the native attribute isn't being used.
   */
  readonly ariaDisabledAttr = computed(() => {
    let value = this.ariaDisabled();

    if (
      (this.hasNativeDisable && this.focusable()) ||
      (!this.hasNativeDisable && this.disabled())
    ) {
      value = this.disabled();
    }

    return value ? 'true' : null;
  });

  /**
   * Computed native disabled attribute value.
   * Only applies to elements that support the native disabled attribute.
   * When focusable=true, we use aria-disabled instead to keep the element focusable.
   */
  readonly disabledAttr = computed(() =>
    this.hasNativeDisable ? (this.disabled() && !this.focusable() ? '' : null) : null,
  );

  /**
   * Computes the raw data-disabled attribute value.
   */
  readonly dataDisabledAttr = computed(() => (this.disabled() ? '' : null));

  /**
   * Computes the raw data-disabled-focusable attribute value.
   */
  readonly dataDisabledFocusableAttr = computed(() =>
    this.disabled() && this.focusable() ? '' : null,
  );

  /**
   * The elemental state object for this element.
   * Provides controlled signals that can be programmatically overridden.
   */
  readonly state = InteractProto.initState(this);

  /**
   * Handles click events when disabled.
   * Prevents the click from propagating to parent elements or triggering actions.
   */
  constructor() {
    const { click, keydown, keyup, pointerdown, mousedown } = this.config.events;

    /**
     * Handles click events when disabled.
     * Prevents the click from propagating to parent elements or triggering actions.
     */
    listener(
      this.elementRef,
      'click' satisfies ProtoInteractEventTypes,
      event => {
        if (this.disabled() && (!click.selfOnly || event.target === event.currentTarget)) {
          if (click.preventDefault) {
            event.preventDefault();
          }
          if (click.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }
      },
      { config: { capture: click.capture } },
    );

    /**
     * Handles keydown events when disabled.
     * Blocks most key events but always allows Tab to prevent focus traps.
     */
    listener(
      this.elementRef,
      'keydown' satisfies ProtoInteractEventTypes,
      event => {
        if (
          this.disabled() &&
          event.key !== 'Tab' &&
          (!keydown.selfOnly || event.target === event.currentTarget)
        ) {
          if (keydown.preventDefault) {
            event.preventDefault();
          }
          if (keydown.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }
      },
      { config: { capture: keydown.capture } },
    );

    /**
     * Handles keyup events when disabled.
     */
    listener(
      this.elementRef,
      'keyup' satisfies ProtoInteractEventTypes,
      event => {
        if (this.disabled() && (!keyup.selfOnly || event.target === event.currentTarget)) {
          if (keyup.preventDefault) {
            event.preventDefault();
          }
          if (keyup.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }
      },
      { config: { capture: keyup.capture } },
    );

    /**
     * Handles pointerdown events when disabled.
     */
    listener(
      this.elementRef,
      'pointerdown' satisfies ProtoInteractEventTypes,
      event => {
        if (this.disabled() && (!pointerdown.selfOnly || event.target === event.currentTarget)) {
          if (pointerdown.preventDefault) {
            event.preventDefault();
          }
          if (pointerdown.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }
      },
      { config: { capture: pointerdown.capture } },
    );

    /**
     * Handles mousedown events when disabled.
     * This is a fallback for browsers that don't support pointer events.
     */
    listener(
      this.elementRef,
      'mousedown' satisfies ProtoInteractEventTypes,
      event => {
        if (this.disabled() && (!mousedown.selfOnly || event.target === event.currentTarget)) {
          if (mousedown.preventDefault) {
            event.preventDefault();
          }
          if (mousedown.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }
      },
      { config: { capture: mousedown.capture } },
    );
  }
}
