import { createProto } from '@angular-proto/core';
import {
  injectElementRef,
  isNativeAnchorTag,
  isNativeButtonTag,
  isNativeInputTag,
} from '@angular-proto/core/utils';
import { computed, Directive, input } from '@angular/core';
import { createProtoInteractDefaultConfig, InteractProto } from './interact';

export interface ProtoInteractButtonConfig {
  /**
   * Whether to fallback to `role="button"` when the element's `role` attribute is absent and the element is
   * - not a native button,
   * - an input with `type="button|submit|reset|image"`,
   * - or an anchor with a valid link.
   * @default true
   */
  roleFallback: boolean;

  /**
   * Whether to fallback to `type="button"` when the element's `type` attribute is absent
   * and the element is a native button.
   * @default true
   */
  typeFallback: boolean;

  /**
   * Whether to activate the button on the Space keydown event.
   * @default true
   */
  activateOnKeyupSpace: boolean;

  /**
   * Whether to activate the button on the Enter keydown event.
   * @default true
   */
  activateOnKeydownEnter: boolean;
}

export const ProtoInteractButtonProto = createProto<ProtoInteractButton, ProtoInteractButtonConfig>(
  'InteractButton',
  {
    roleFallback: true,
    typeFallback: true,
    activateOnKeyupSpace: true,
    activateOnKeydownEnter: true,
  },
);

/**
 * An extension of the `ProtoInteract` directive that provides button-specific behavior.
 */
@Directive({
  selector: '[protoInteract][protoInteractButton]',
  exportAs: 'protoInteractButton',
  host: {
    '[attr.role]': 'roleAttr()',
    '[attr.type]': 'typeAttr()',
    '(keydown)': 'onKeydown($event)',
    '(keyup)': 'onKeyup($event)',
  },
  providers: [
    ProtoInteractButtonProto.provideState(),
    InteractProto.provideConfig(
      createProtoInteractDefaultConfig({
        fallbackTabIndex: 0,
        allEvents: {
          // Prevent bubbling of events from children
          selfOnly: false,
        },
      }),
    ),
  ],
})
export class ProtoInteractButton {
  readonly config = ProtoInteractButtonProto.injectConfig();
  readonly protoInteract = InteractProto.injectState();
  readonly elementRef = injectElementRef();

  /**
   * The ARIA role. Auto-assigned for non-native elements (`role="button"` on divs/spans).
   * Set to a custom role, `null` to remove, or `undefined` for automatic assignment.
   */
  readonly role = input<string | null>(this.elementRef.nativeElement.getAttribute('role'), {
    alias: 'protoInteractButtonRole',
  });

  // Assign role="button" to non-native elements for screen reader announcements.
  // Native <button>, <input type="button|submit|reset">, and <a href> elements
  // have implicit roles and don't need explicit assignment.
  readonly roleAttr = computed(() => {
    const value = this.role();

    if (value !== null) {
      return value;
    }

    if (!this.config.roleFallback) {
      return null;
    }

    if (
      isNativeButtonTag(this.elementRef) ||
      isNativeInputTag(this.elementRef, { types: ['button', 'submit', 'reset', 'image'] }) ||
      isNativeAnchorTag(this.elementRef, { validLink: true })
    ) {
      return null;
    }

    return 'button';
  });

  readonly type = input<string | null>(this.elementRef.nativeElement.getAttribute('type'), {
    alias: 'protoInteractButtonType',
  });

  readonly typeAttr = computed(() => {
    const value = this.type();

    if (value !== null) {
      return value;
    }

    if (!this.config.typeFallback) {
      return null;
    }

    return isNativeButtonTag(this.elementRef) ? 'button' : null;
  });

  protected onKeydown(event: KeyboardEvent) {
    // Only handle direct events (not bubbled from children) on non-native elements
    const shouldClick =
      event.target === event.currentTarget &&
      !isNativeButtonTag(this.elementRef) &&
      !isNativeAnchorTag(this.elementRef, { validLink: true }) && // Re-check at runtime; routerLink may have added href
      !this.protoInteract().disabled();

    const isSpaceKey = event.key === ' ';
    const isEnterKey = event.key === 'Enter';

    if (shouldClick) {
      // Prevent default to stop Space from scrolling the page
      if (isSpaceKey || isEnterKey) {
        event.preventDefault();
      }

      // Native button behavior: Enter fires immediately, Space waits for keyup
      // (allowing users to cancel by moving focus before releasing)
      if (isEnterKey) {
        this.elementRef.nativeElement.click();
      }
    }
  }

  protected onKeyup(event: KeyboardEvent) {
    if (
      event.target === event.currentTarget &&
      !isNativeButtonTag(this.elementRef) &&
      !isNativeAnchorTag(this.elementRef, { validLink: true }) &&
      !this.protoInteract().disabled() &&
      event.key === ' '
    ) {
      this.elementRef.nativeElement.click();
    }
  }
}
