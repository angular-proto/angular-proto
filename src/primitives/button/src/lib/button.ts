// import { computed, Directive, effect, input } from '@angular/core';
// import { createProto } from '@angular-proto/core';
// import { ProtoButton } from '@angular-proto/core/button';
// import { ProtoFocusVisible } from '@angular-proto/core/focus-visible';
// import { ProtoHover } from '@angular-proto/core/hover';
// import { ProtoPress } from '@angular-proto/core/press';
// import {
//   injectElementRef,
//   isNativeAnchorTag,
//   isNativeButtonTag,
//   isNativeInputTag,
// } from '@angular-proto/core/utils';

// export const ButtonPrimitive = createProto({ name: 'Button', type: () => PrimitiveButton });

// @Directive({
//   selector: '[primitiveButton]',
//   exportAs: 'primitiveButton',
//   host: {
//     tabindex: '0',
//     '[attr.role]': 'roleAttr()',
//     '[attr.type]': 'typeAttr()',
//     '(keydown)': 'onKeydown($event)',
//     '(keyup)': 'onKeyup($event)',
//   },
//   hostDirectives: [
//     ProtoHover,
//     ProtoPress,
//     ProtoFocusVisible,
//     {
//       directive: ProtoButton,
//       inputs: [
//         'protoButtonDisabled:disable',
//         'protoButtonFocusable:focusable',
//         'protoButtonTabIndex:tabIndex',
//         'protoButtonAriaDisabled:ariaDisabled',
//       ],
//     },
//   ],
//   providers: [
//     ButtonPrimitive.provideState(),
//     DisablePrimitive.hooks(state => {
//       const ngpHover = HoverPrimitive.inject({ self: true });
//       const ngpPress = PressPrimitive.inject({ self: true });
//       const ngpFocusVisible = FocusVisiblePrimitive.inject({ self: true });

//       effect(() => {
//         const disabled = state().disabled();
//         const focusable = state().focusable();
//         ngpHover().disabled.override(disabled);
//         ngpPress().disabled.override(disabled);
//         ngpFocusVisible().disabled.override(disabled && !focusable);
//       });
//     }),
//   ],
// })
// export class PrimitiveButton {
//   readonly ngpDisable = DisablePrimitive.inject();
//   readonly elementRef = injectElementRef();

//   /**
//    * The ARIA role. Auto-assigned for non-native elements (`role="button"` on divs/spans).
//    * Set to a custom role, `null` to remove, or `undefined` for automatic assignment.
//    */
//   readonly role = input<string | null>(this.elementRef.nativeElement.getAttribute('role'));

//   // Assign role="button" to non-native elements for screen reader announcements.
//   // Native <button>, <input type="button|submit|reset">, and <a href> elements
//   // have implicit roles and don't need explicit assignment.
//   readonly roleAttr = computed(() => {
//     if (this.role()) return this.role();

//     if (
//       isNativeButtonTag(this.elementRef) ||
//       isNativeInputTag(this.elementRef, { types: ['button', 'submit', 'reset', 'image'] }) ||
//       isNativeAnchorTag(this.elementRef, { validLink: true })
//     ) {
//       return null;
//     }

//     return 'button';
//   });

//   readonly type = input<string | null>(this.elementRef.nativeElement.getAttribute('type'));

//   readonly typeAttr = computed(() => {
//     if (this.type()) return this.type();

//     if (isNativeButtonTag(this.elementRef)) {
//       return 'button';
//     }

//     return null;
//   });

//   readonly state = ButtonPrimitive.set(this);

//   protected onKeydown(event: KeyboardEvent) {
//     // Only handle direct events (not bubbled from children) on non-native elements
//     const shouldClick =
//       event.target === event.currentTarget &&
//       !isNativeButtonTag(this.elementRef) &&
//       !isNativeAnchorTag(this.elementRef, { validLink: true }) && // Re-check at runtime; routerLink may have added href
//       !this.ngpDisable().disabled();

//     const isSpaceKey = event.key === ' ';
//     const isEnterKey = event.key === 'Enter';

//     if (shouldClick) {
//       // Prevent default to stop Space from scrolling the page
//       if (isSpaceKey || isEnterKey) {
//         event.preventDefault();
//       }

//       // Native button behavior: Enter fires immediately, Space waits for keyup
//       // (allowing users to cancel by moving focus before releasing)
//       if (isEnterKey) {
//         this.elementRef.nativeElement.click();
//       }
//     }
//   }

//   protected onKeyup(event: KeyboardEvent) {
//     if (
//       event.target === event.currentTarget &&
//       !isNativeButtonTag(this.elementRef) &&
//       !isNativeAnchorTag(this.elementRef, { validLink: true }) &&
//       !this.ngpDisable().disabled() &&
//       event.key === ' '
//     ) {
//       this.elementRef.nativeElement.click();
//     }
//   }
// }
