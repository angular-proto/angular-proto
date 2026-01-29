// import { computed, Directive, input } from '@angular/core';
// import { createProto } from '@angular-proto/core';
// import { InteractProto, ProtoInteract } from '@angular-proto/core/interact';
// import {
//   injectElementRef,
//   isNativeAnchorTag,
//   isNativeButtonTag,
//   isNativeInputTag,
// } from '@angular-proto/core/utils';

// export const ButtonProto = createProto({ name: 'Button', type: () => ProtoButton });

// @Directive({
//   selector: '[protoButton]',
//   exportAs: 'protoButton',
//   hostDirectives: [
//     {
//       directive: ProtoInteract,
//       inputs: [
//         'protoInteractDisabled:protoButtonDisabled',
//         'protoInteractFocusable:protoButtonFocusable',
//         'protoInteractTabIndex:protoButtonTabIndex',
//         'protoInteractAriaDisabled:protoButtonAriaDisabled',
//       ],
//     },
//   ],
//   host: {
//     '[attr.role]': 'roleAttr()',
//     '[attr.type]': 'typeAttr()',
//     '(keydown)': 'onKeydown($event)',
//     '(keyup)': 'onKeyup($event)',
//   },
//   providers: [ButtonProto.provideState()],
// })
// export class ProtoButton {
//   readonly protoInteract = InteractProto.injectState();
//   readonly elementRef = injectElementRef();

//   /**
//    * The ARIA role. Auto-assigned for non-native elements (`role="button"` on divs/spans).
//    * Set to a custom role, `null` to remove, or `undefined` for automatic assignment.
//    */
//   readonly role = input<string | null>(this.elementRef.nativeElement.getAttribute('role'), {
//     alias: 'protoButtonRole',
//   });

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

//   readonly type = input<string | null>(this.elementRef.nativeElement.getAttribute('type'), {
//     alias: 'protoButtonType',
//   });

//   readonly typeAttr = computed(() => {
//     if (this.type()) return this.type();

//     if (isNativeButtonTag(this.elementRef)) {
//       return 'button';
//     }

//     return null;
//   });

//   readonly state = ButtonProto.initState(this);

//   protected onKeydown(event: KeyboardEvent) {
//     // Only handle direct events (not bubbled from children) on non-native elements
//     const shouldClick =
//       event.target === event.currentTarget &&
//       !isNativeButtonTag(this.elementRef) &&
//       !isNativeAnchorTag(this.elementRef, { validLink: true }) && // Re-check at runtime; routerLink may have added href
//       !this.protoInteract().disabled();

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
//       !this.protoInteract().disabled() &&
//       event.key === ' '
//     ) {
//       this.elementRef.nativeElement.click();
//     }
//   }
// }
