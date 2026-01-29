// import { ChangeDetectionStrategy, Component, effect, signal, viewChild } from '@angular/core';
// import { By } from '@angular/platform-browser';
// import { InteractProto, ProtoInteract } from '@angular-proto/core/interact';
// import { fireEvent, render, screen } from '@testing-library/angular';
// import { ProtoButton } from './button';

// describe('ProtoButton', () => {
//   describe('disabled state', () => {
//     describe('native button', () => {
//       it('should set the disabled attribute when disabled', async () => {
//         await render(`<button protoButton [protoButtonDisabled]="true">Click me</button>`, {
//           imports: [ProtoButton],
//         });

//         expect(screen.getByRole('button')).toHaveAttribute('disabled');
//       });

//       it('should not set the disabled attribute when not disabled', async () => {
//         await render(`<button protoButton>Click me</button>`, { imports: [ProtoButton] });

//         expect(screen.getByRole('button')).not.toHaveAttribute('disabled');
//       });

//       it('should update disabled attribute when disabled changes', async () => {
//         const { rerender, fixture } = await render(
//           `<button protoButton [protoButtonDisabled]="isDisabled">Click me</button>`,
//           { imports: [ProtoButton], componentProperties: { isDisabled: false } },
//         );

//         const button = screen.getByRole('button');
//         expect(button).not.toHaveAttribute('disabled');

//         await rerender({ componentProperties: { isDisabled: true } });
//         fixture.detectChanges();
//         expect(button).toHaveAttribute('disabled');

//         await rerender({ componentProperties: { isDisabled: false } });
//         fixture.detectChanges();
//         expect(button).not.toHaveAttribute('disabled');
//       });
//     });

//     describe('non-native element', () => {
//       it('should not set the disabled attribute on non-button elements', async () => {
//         const container = await render(`<a protoButton [protoButtonDisabled]="true">Link</a>`, {
//           imports: [ProtoButton],
//         });

//         const anchor = container.debugElement.queryAll(By.css('a'));
//         expect(anchor.length).toBe(1);
//         expect(anchor[0].nativeElement).not.toHaveAttribute('disabled');
//       });

//       it('should not set the disabled attribute on div elements', async () => {
//         await render(`<div protoButton [protoButtonDisabled]="true">Custom</div>`, {
//           imports: [ProtoButton],
//         });

//         const div = screen.getByRole('button');
//         expect(div).not.toHaveAttribute('disabled');
//       });
//     });
//   });

//   describe('data-disabled attribute', () => {
//     it('should set data-disabled when disabled', async () => {
//       await render(`<button protoButton [protoButtonDisabled]="true">Click me</button>`, {
//         imports: [ProtoButton],
//       });

//       expect(screen.getByRole('button')).toHaveAttribute('data-disabled', '');
//     });

//     it('should not set data-disabled when not disabled', async () => {
//       await render(`<button protoButton>Click me</button>`, { imports: [ProtoButton] });

//       expect(screen.getByRole('button')).not.toHaveAttribute('data-disabled');
//     });

//     it('should update data-disabled when disabled changes', async () => {
//       const { rerender, fixture } = await render(
//         `<button protoButton [protoButtonDisabled]="isDisabled">Click me</button>`,
//         { imports: [ProtoButton], componentProperties: { isDisabled: false } },
//       );

//       const button = screen.getByRole('button');
//       expect(button).not.toHaveAttribute('data-disabled');

//       await rerender({ componentProperties: { isDisabled: true } });
//       fixture.detectChanges();
//       expect(button).toHaveAttribute('data-disabled', '');
//     });

//     it('should set data-disabled on non-native elements when disabled', async () => {
//       await render(`<div protoButton [protoButtonDisabled]="true">Custom</div>`, {
//         imports: [ProtoButton],
//       });

//       expect(screen.getByRole('button')).toHaveAttribute('data-disabled', '');
//     });
//   });

//   describe('focusable (focusableWhenDisabled)', () => {
//     it('should set data-disabled-focusable when disabled and focusable', async () => {
//       await render(
//         `<button protoButton [protoButtonDisabled]="true" [protoButtonFocusable]="true">Click me</button>`,
//         {
//           imports: [ProtoButton],
//         },
//       );

//       expect(screen.getByRole('button')).toHaveAttribute('data-disabled-focusable', '');
//     });

//     it('should not set native disabled when focusable is true', async () => {
//       await render(
//         `<button protoButton [protoButtonDisabled]="true" [protoButtonFocusable]="true">Click me</button>`,
//         {
//           imports: [ProtoButton],
//         },
//       );

//       expect(screen.getByRole('button')).not.toHaveAttribute('disabled');
//     });

//     it('should prevent click when focusable is true but disabled', async () => {
//       await render(
//         `<button protoButton [protoButtonDisabled]="true" [protoButtonFocusable]="true">Click me</button>`,
//         {
//           imports: [ProtoButton],
//         },
//       );

//       const button = screen.getByRole('button');
//       const clickEvent = new MouseEvent('click', { bubbles: true });
//       const stopSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');

//       button.dispatchEvent(clickEvent);
//       expect(stopSpy).toHaveBeenCalled();
//     });
//   });

//   describe('role attribute', () => {
//     it('should not add role="button" to native button elements', async () => {
//       await render(`<button protoButton>Click me</button>`, { imports: [ProtoButton] });

//       // Native buttons have implicit button role, no explicit attribute needed
//       const button = screen.getByRole('button');
//       expect(button.tagName).toBe('BUTTON');
//       expect(button.getAttribute('role')).toBeNull();
//     });

//     it('should add role="button" to non-native elements without explicit role', async () => {
//       await render(`<div protoButton>Custom Button</div>`, { imports: [ProtoButton] });

//       const div = screen.getByRole('button');
//       expect(div).toHaveAttribute('role', 'button');
//     });

//     it('should not override explicit role input', async () => {
//       await render(`<div protoButton [protoButtonRole]="'menuitem'">Menu Item</div>`, {
//         imports: [ProtoButton],
//       });

//       const div = screen.getByRole('menuitem');
//       expect(div).toHaveAttribute('role', 'menuitem');
//     });

//     it('should preserve link role for anchors with href', async () => {
//       const container = await render(`<a protoButton href="/test">Link</a>`, {
//         imports: [ProtoButton],
//       });

//       const link = container.debugElement.query(By.css('a'));
//       expect(link.nativeElement).not.toHaveAttribute('role', 'button');
//     });

//     it('should not add role to input[type="button"]', async () => {
//       await render(`<input protoButton type="button" value="Input Button" />`, {
//         imports: [ProtoButton],
//       });

//       const input = screen.getByRole('button');
//       expect(input.getAttribute('role')).toBeNull();
//     });

//     it('should not add role to input[type="submit"]', async () => {
//       await render(`<input protoButton type="submit" value="Submit" />`, {
//         imports: [ProtoButton],
//       });

//       const input = screen.getByRole('button');
//       expect(input.getAttribute('role')).toBeNull();
//     });

//     it('should not add role to input[type="reset"]', async () => {
//       await render(`<input protoButton type="reset" value="Reset" />`, {
//         imports: [ProtoButton],
//       });

//       const input = screen.getByRole('button');
//       expect(input.getAttribute('role')).toBeNull();
//     });
//   });

//   describe('type attribute', () => {
//     it('should set type="button" on native button elements by default', async () => {
//       await render(`<button protoButton>Click me</button>`, { imports: [ProtoButton] });

//       expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
//     });

//     it('should allow overriding type via input', async () => {
//       await render(`<button protoButton [protoButtonType]="'submit'">Submit</button>`, {
//         imports: [ProtoButton],
//       });

//       expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
//     });

//     it('should set type="button" on input[type="button"]', async () => {
//       await render(`<input protoButton type="button" value="Input Button" />`, {
//         imports: [ProtoButton],
//       });

//       expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
//     });

//     it('should not set type on non-native elements', async () => {
//       await render(`<div protoButton>Custom</div>`, { imports: [ProtoButton] });

//       expect(screen.getByRole('button')).not.toHaveAttribute('type');
//     });

//     it('should not set type on anchor elements', async () => {
//       const container = await render(`<a protoButton href="#">Link</a>`, {
//         imports: [ProtoButton],
//       });

//       const link = container.debugElement.query(By.css('a'));
//       expect(link.nativeElement).not.toHaveAttribute('type');
//     });
//   });

//   describe('click handling', () => {
//     it('should call click handler when clicked', async () => {
//       const handleClick = vi.fn();
//       await render(`<button protoButton (click)="onClick()">Click me</button>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       fireEvent.click(screen.getByRole('button'));
//       expect(handleClick).toHaveBeenCalledTimes(1);
//     });

//     it('should stop click event propagation when disabled', async () => {
//       await render(`<button protoButton [protoButtonDisabled]="true">Click me</button>`, {
//         imports: [ProtoButton],
//       });

//       const button = screen.getByRole('button');
//       const clickEvent = new MouseEvent('click', { bubbles: true });
//       const stopSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');

//       button.dispatchEvent(clickEvent);
//       expect(stopSpy).toHaveBeenCalled();
//     });
//   });

//   describe('keyboard interactions (non-native elements)', () => {
//     it('should trigger click on Enter keydown for non-native elements', async () => {
//       const handleClick = vi.fn();
//       await render(`<div protoButton (click)="onClick()">Custom Button</div>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const div = screen.getByRole('button');
//       div.focus();
//       fireEvent.keyDown(div, { key: 'Enter' });

//       expect(handleClick).toHaveBeenCalledTimes(1);
//     });

//     it('should trigger click on Space keyup for non-native elements', async () => {
//       const handleClick = vi.fn();
//       await render(`<div protoButton (click)="onClick()">Custom Button</div>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const div = screen.getByRole('button');
//       div.focus();
//       fireEvent.keyDown(div, { key: ' ' });
//       fireEvent.keyUp(div, { key: ' ' });

//       expect(handleClick).toHaveBeenCalledTimes(1);
//     });

//     it('should prevent default on Space keydown to avoid page scroll', async () => {
//       await render(`<div protoButton>Custom Button</div>`, { imports: [ProtoButton] });

//       const div = screen.getByRole('button');
//       const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
//       const preventSpy = vi.spyOn(spaceEvent, 'preventDefault');

//       div.dispatchEvent(spaceEvent);
//       expect(preventSpy).toHaveBeenCalled();
//     });

//     it('should prevent default on Enter keydown for non-native elements', async () => {
//       await render(`<div protoButton>Custom Button</div>`, { imports: [ProtoButton] });

//       const div = screen.getByRole('button');
//       const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
//       const preventSpy = vi.spyOn(enterEvent, 'preventDefault');

//       div.dispatchEvent(enterEvent);
//       expect(preventSpy).toHaveBeenCalled();
//     });

//     it('should not trigger click on keyboard for native buttons (browser handles it)', async () => {
//       const handleClick = vi.fn();
//       await render(`<button protoButton (click)="onClick()">Click me</button>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const button = screen.getByRole('button');
//       button.focus();

//       // For native buttons, the browser handles Enter/Space -> click
//       // ProtoButton should not duplicate this behavior
//       fireEvent.keyDown(button, { key: 'Enter' });
//       fireEvent.keyUp(button, { key: 'Enter' });

//       // Click count should be 0 because we're using fireEvent.keyDown, not actual key press
//       expect(handleClick).toHaveBeenCalledTimes(0);
//     });

//     it('should not trigger click on keyboard when disabled', async () => {
//       const handleClick = vi.fn();
//       await render(
//         `<div protoButton [protoButtonDisabled]="true" (click)="onClick()">Custom Button</div>`,
//         {
//           imports: [ProtoButton],
//           componentProperties: { onClick: handleClick },
//         },
//       );

//       const div = screen.getByRole('button');
//       div.focus();
//       fireEvent.keyDown(div, { key: 'Enter' });
//       fireEvent.keyDown(div, { key: ' ' });
//       fireEvent.keyUp(div, { key: ' ' });

//       expect(handleClick).not.toHaveBeenCalled();
//     });

//     it('should not trigger click for keys other than Enter/Space', async () => {
//       const handleClick = vi.fn();
//       await render(`<div protoButton (click)="onClick()">Custom Button</div>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const div = screen.getByRole('button');
//       div.focus();
//       fireEvent.keyDown(div, { key: 'a' });
//       fireEvent.keyDown(div, { key: 'Escape' });
//       fireEvent.keyDown(div, { key: 'Tab' });

//       expect(handleClick).not.toHaveBeenCalled();
//     });

//     it('should only trigger click when target is the button itself', async () => {
//       const handleClick = vi.fn();
//       await render(`<div protoButton (click)="onClick()"><span>Nested content</span></div>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const span = screen.getByText('Nested content');
//       fireEvent.keyDown(span, { key: 'Enter' });

//       // Click should not be triggered because target is not the button
//       expect(handleClick).not.toHaveBeenCalled();
//     });
//   });

//   describe('with different element types', () => {
//     it('should work with button elements', async () => {
//       await render(`<button protoButton>Button</button>`, { imports: [ProtoButton] });

//       const button = screen.getByRole('button');
//       expect(button.tagName).toBe('BUTTON');
//     });

//     it('should work with anchor elements', async () => {
//       const container = await render(`<a protoButton href="#">Link</a>`, {
//         imports: [ProtoButton],
//       });

//       const link = container.debugElement.query(By.css('a'));
//       expect(link.nativeElement.tagName).toBe('A');
//     });

//     it('should work with div elements and add role', async () => {
//       await render(`<div protoButton>Custom</div>`, { imports: [ProtoButton] });

//       const div = screen.getByRole('button');
//       expect(div.tagName).toBe('DIV');
//       expect(div).toHaveAttribute('role', 'button');
//     });

//     it('should work with span elements and add role', async () => {
//       await render(`<span protoButton>Custom</span>`, { imports: [ProtoButton] });

//       const span = screen.getByRole('button');
//       expect(span.tagName).toBe('SPAN');
//       expect(span).toHaveAttribute('role', 'button');
//     });

//     it('should work with input[type="button"] elements', async () => {
//       await render(`<input protoButton type="button" value="Input Button" />`, {
//         imports: [ProtoButton],
//       });

//       const input = screen.getByRole('button');
//       expect(input.tagName).toBe('INPUT');
//     });

//     it('should work with input[type="submit"] elements', async () => {
//       await render(`<input protoButton type="submit" value="Submit" />`, {
//         imports: [ProtoButton],
//       });

//       const input = screen.getByRole('button');
//       expect(input.tagName).toBe('INPUT');
//     });
//   });

//   describe('anchor button behavior', () => {
//     it('should not trigger keyboard click on anchors with href (browser handles navigation)', async () => {
//       const handleClick = vi.fn();
//       await render(`<a protoButton href="/test" (click)="onClick()">Link</a>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const link = screen.getByRole('link');
//       link.focus();
//       fireEvent.keyDown(link, { key: 'Enter' });

//       // Anchors with href should be handled by browser, not our code
//       expect(handleClick).not.toHaveBeenCalled();
//     });

//     it('should trigger keyboard click on anchors without href', async () => {
//       const handleClick = vi.fn();
//       await render(`<a protoButton (click)="onClick()">Custom Action</a>`, {
//         imports: [ProtoButton],
//         componentProperties: { onClick: handleClick },
//       });

//       const button = screen.getByRole('button');
//       button.focus();
//       fireEvent.keyDown(button, { key: 'Enter' });

//       expect(handleClick).toHaveBeenCalledTimes(1);
//     });
//   });

//   describe('role attribute handling', () => {
//     it('should preserve custom role via input through disabled state changes', async () => {
//       const { rerender, fixture } = await render(
//         `<div protoButton [protoButtonRole]="'tab'" [protoButtonDisabled]="isDisabled">Tab</div>`,
//         { imports: [ProtoButton], componentProperties: { isDisabled: false } },
//       );

//       const div = screen.getByRole('tab');
//       expect(div).toHaveAttribute('role', 'tab');

//       await rerender({ componentProperties: { isDisabled: true } });
//       fixture.detectChanges();
//       expect(div).toHaveAttribute('role', 'tab');
//       expect(div).toHaveAttribute('data-disabled', '');

//       await rerender({ componentProperties: { isDisabled: false } });
//       fixture.detectChanges();
//       expect(div).toHaveAttribute('role', 'tab');
//       expect(div).not.toHaveAttribute('data-disabled');
//     });

//     it('should fall back to auto-assignment when role is null on non-native elements', async () => {
//       await render(`<div protoButton [protoButtonRole]="null">Custom</div>`, {
//         imports: [ProtoButton],
//       });

//       // When role is null (default), auto-assignment kicks in for non-native elements
//       expect(screen.getByRole('button')).toHaveAttribute('role', 'button');
//     });

//     it('should properly handle role state transition', async () => {
//       const { rerender, fixture } = await render(
//         `<div protoButton [protoButtonRole]="role">Item</div>`,
//         {
//           imports: [ProtoButton],
//           componentProperties: { role: 'tab' },
//         },
//       );

//       const el = screen.getByRole('tab');
//       expect(el).toHaveAttribute('role', 'tab');

//       await rerender({ componentProperties: { role: 'option' } });
//       fixture.detectChanges();
//       expect(el).toHaveAttribute('role', 'option');

//       // When role becomes null, falls back to auto-assignment (button for non-native)
//       await rerender({ componentProperties: { role: null } });
//       fixture.detectChanges();
//       expect(el).toHaveAttribute('role', 'button');
//     });
//   });

//   describe('tabindex', () => {
//     it('should have tabindex="0" by default', async () => {
//       await render(`<button protoButton>Click me</button>`, { imports: [ProtoButton] });

//       expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
//     });

//     it('should have tabindex="0" on non-native elements', async () => {
//       await render(`<div protoButton>Custom</div>`, { imports: [ProtoButton] });

//       expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
//     });
//   });

//   describe('aria-disabled', () => {
//     it('should set aria-disabled on non-native elements when disabled', async () => {
//       await render(`<div protoButton [protoButtonDisabled]="true">Custom</div>`, {
//         imports: [ProtoButton],
//       });

//       expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
//     });

//     it('should not set aria-disabled on native button when disabled', async () => {
//       await render(`<button protoButton [protoButtonDisabled]="true">Click me</button>`, {
//         imports: [ProtoButton],
//       });

//       // Native buttons use the disabled attribute, not aria-disabled
//       expect(screen.getByRole('button')).not.toHaveAttribute('aria-disabled');
//     });
//   });

//   describe('nested', () => {
//     @Component({
//       selector: 'nest-test',
//       changeDetection: ChangeDetectionStrategy.OnPush,
//       imports: [ProtoInteract, ProtoButton],
//       host: { class: 'contents' },
//       providers: [
//         InteractProto.provideHooks(state => {
//           effect(() => {
//             const value = state();
//             const parentEntry = state.ancestry.parent;
//             if (!parentEntry) return;
//             const parent = parentEntry.state();

//             // If the parent is disabled, sync the disabled state to the child
//             // and ensure the tab index is <= to -1 to prevent focus
//             value.disabled.control(parent.disabled() ? true : value.disabled.templateValue());

//             value.tabIndex.control(
//               parent.disabled()
//                 ? Math.min(-1, value.tabIndex.templateValue())
//                 : value.tabIndex.templateValue(),
//             );
//           });
//         }),
//       ],
//       template: `
//         <div #b1="protoButton" focusable id="1" protoButton [protoButtonDisabled]="disabled()">
//           Button
//           <div #b2="protoButton" id="2" protoButton>
//             Button
//             <div #b3="protoButton" id="3" protoButton>
//               Button
//               <div #b4="protoButton" id="4" protoButton>Button</div>
//             </div>
//           </div>
//         </div>
//       `,
//     })
//     class NestTest {
//       readonly disabled = signal(false);
//       readonly b1 = viewChild.required('b1', { read: ProtoButton });
//       readonly b2 = viewChild.required('b2', { read: ProtoButton });
//       readonly b3 = viewChild.required('b3', { read: ProtoButton });
//       readonly b4 = viewChild.required('b4', { read: ProtoButton });
//     }

//     // TODO: Ancestry with host directives needs further investigation
//     // The parent-child relationship isn't established correctly when ProtoDisable is a host directive
//     it.skip('should sync the disabled state to the child', async () => {
//       const { fixture } = await render(NestTest);

//       const b1 = fixture.componentInstance.b1();
//       const b2 = fixture.componentInstance.b2();
//       const b3 = fixture.componentInstance.b3();
//       const b4 = fixture.componentInstance.b4();

//       expect(b1.protoInteract().disabled()).toBe(false);
//       expect(b1.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b1.protoInteract().tabIndex()).toBe(0);
//       expect(b1.protoInteract().tabIndex.templateValue()).toBe(0);

//       expect(b2.protoInteract().disabled()).toBe(false);
//       expect(b2.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b2.protoInteract().tabIndex()).toBe(0);
//       expect(b2.protoInteract().tabIndex.templateValue()).toBe(0);

//       expect(b3.protoInteract().disabled()).toBe(false);
//       expect(b3.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b3.protoInteract().tabIndex()).toBe(0);
//       expect(b3.protoInteract().tabIndex.templateValue()).toBe(0);

//       expect(b4.protoInteract().disabled()).toBe(false);
//       expect(b4.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b4.protoInteract().tabIndex()).toBe(0);
//       expect(b4.protoInteract().tabIndex.templateValue()).toBe(0);

//       b1.protoInteract().disabled.control(true);
//       fixture.detectChanges();

//       expect(b4.protoInteract().tabIndex()).toBe(-1);
//       expect(b4.protoInteract().tabIndex.templateValue()).toBe(0);
//     });

//     // TODO: Ancestry with host directives needs further investigation
//     it.skip('should sync the disabled state to the child vis inputs', async () => {
//       const { fixture } = await render(NestTest);

//       const b1 = fixture.componentInstance.b1();
//       const b2 = fixture.componentInstance.b2();
//       const b3 = fixture.componentInstance.b3();
//       const b4 = fixture.componentInstance.b4();

//       expect(b1.protoInteract().disabled()).toBe(false);
//       expect(b1.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b1.protoInteract().tabIndex()).toBe(0);
//       expect(b1.protoInteract().tabIndex.templateValue()).toBe(0);
//       expect(b1.elementRef.nativeElement.tabIndex).toBe(0);

//       expect(b2.protoInteract().disabled()).toBe(false);
//       expect(b2.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b2.protoInteract().tabIndex()).toBe(0);
//       expect(b2.protoInteract().tabIndex.templateValue()).toBe(0);
//       expect(b2.elementRef.nativeElement.tabIndex).toBe(0);

//       expect(b3.protoInteract().disabled()).toBe(false);
//       expect(b3.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b3.protoInteract().tabIndex()).toBe(0);
//       expect(b3.protoInteract().tabIndex.templateValue()).toBe(0);
//       expect(b3.elementRef.nativeElement.tabIndex).toBe(0);

//       expect(b4.protoInteract().disabled()).toBe(false);
//       expect(b4.protoInteract().disabled.templateValue()).toBe(false);
//       expect(b4.protoInteract().tabIndex()).toBe(0);
//       expect(b4.protoInteract().tabIndex.templateValue()).toBe(0);
//       expect(b4.elementRef.nativeElement.tabIndex).toBe(0);

//       fixture.componentInstance.disabled.set(true);
//       fixture.detectChanges();

//       expect(b4.protoInteract().tabIndex()).toBe(-1);
//       expect(b4.protoInteract().tabIndex.templateValue()).toBe(0);
//       expect(b4.elementRef.nativeElement.tabIndex).toBe(-1);
//     });
//   });
// });
