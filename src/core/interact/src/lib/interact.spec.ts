import type { BooleanInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  effect,
  input,
  runInInjectionContext,
  viewChild,
} from '@angular/core';
import { By } from '@angular/platform-browser';
import { fireEvent, render, screen } from '@testing-library/angular';
import { ProtoInteract } from './interact';

describe('ProtoDisable', () => {
  describe('disabled state', () => {
    describe('native button', () => {
      it('should set the disabled attribute when disabled', async () => {
        await render(`<button protoInteract [protoInteractDisabled]="true">Click me</button>`, {
          imports: [ProtoInteract],
        });

        expect(screen.getByRole('button')).toHaveAttribute('disabled');
      });

      it('should not set the disabled attribute when not disabled', async () => {
        await render(`<button protoInteract>Click me</button>`, { imports: [ProtoInteract] });

        expect(screen.getByRole('button')).not.toHaveAttribute('disabled');
      });

      it('should update disabled attribute when disabled changes', async () => {
        const { rerender, fixture } = await render(
          `<button protoInteract [protoInteractDisabled]="isDisabled">Click me</button>`,
          { imports: [ProtoInteract], componentProperties: { isDisabled: false } },
        );

        const button = screen.getByRole('button');
        expect(button).not.toHaveAttribute('disabled');

        await rerender({ componentProperties: { isDisabled: true } });
        fixture.detectChanges();
        expect(button).toHaveAttribute('disabled');

        await rerender({ componentProperties: { isDisabled: false } });
        fixture.detectChanges();
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    describe('non-native element', () => {
      it('should not set the disabled attribute on non-button elements', async () => {
        const container = await render(`<a protoInteract [protoInteractDisabled]="true">Link</a>`, {
          imports: [ProtoInteract],
        });

        const anchor = container.debugElement.queryAll(By.css('a'));
        expect(anchor.length).toBe(1);
        expect(anchor[0].nativeElement).not.toHaveAttribute('disabled');
      });

      it('should not set the disabled attribute on div elements', async () => {
        const container = await render(
          `<div protoInteract [protoInteractDisabled]="true">Custom</div>`,
          { imports: [ProtoInteract] },
        );

        const div = container.debugElement.query(By.css('div'));
        expect(div.nativeElement).not.toHaveAttribute('disabled');
      });
    });
  });

  describe('data-disabled attribute', () => {
    it('should set data-disabled when disabled', async () => {
      await render(`<button protoInteract [protoInteractDisabled]="true">Click me</button>`, {
        imports: [ProtoInteract],
      });

      expect(screen.getByRole('button')).toHaveAttribute('data-disabled', '');
    });

    it('should not set data-disabled when not disabled', async () => {
      await render(`<button protoInteract>Click me</button>`, { imports: [ProtoInteract] });

      expect(screen.getByRole('button')).not.toHaveAttribute('data-disabled');
    });

    it('should set data-disabled on non-native elements when disabled', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true">Custom</div>`,
        { imports: [ProtoInteract] },
      );

      const div = container.debugElement.query(By.css('div'));
      expect(div.nativeElement).toHaveAttribute('data-disabled', '');
    });
  });

  describe('focusable (focusableWhenDisabled)', () => {
    it('should set data-disabled-focusable when disabled and focusable', async () => {
      await render(
        `<button protoInteract [protoInteractDisabled]="true" [protoInteractFocusable]="true">Click me</button>`,
        { imports: [ProtoInteract] },
      );

      expect(screen.getByRole('button')).toHaveAttribute('data-disabled-focusable', '');
    });

    it('should not set native disabled when focusable is true', async () => {
      await render(
        `<button protoInteract [protoInteractDisabled]="true" [protoInteractFocusable]="true">Click me</button>`,
        { imports: [ProtoInteract] },
      );

      expect(screen.getByRole('button')).not.toHaveAttribute('disabled');
    });

    it('should stop click propagation when disabled and focusable', async () => {
      await render(
        `<button protoInteract [protoInteractDisabled]="true" [protoInteractFocusable]="true">Click me</button>`,
        { imports: [ProtoInteract] },
      );

      const button = screen.getByRole('button');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');

      button.dispatchEvent(clickEvent);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('tabIndex behavior', () => {
    describe('non-native elements', () => {
      it('should adjust tabIndex to -1 when disabled and not focusable', async () => {
        const container = await render(
          `<div protoInteract [protoInteractDisabled]="true" tabindex="0">Custom</div>`,
          { imports: [ProtoInteract] },
        );

        const div = container.debugElement.query(By.css('div'));
        expect(div.nativeElement.tabIndex).toBe(-1);
      });

      it('should keep tabIndex at 0 when disabled and focusable', async () => {
        const container = await render(
          `<div protoInteract [protoInteractDisabled]="true" [protoInteractFocusable]="true" tabindex="0">Custom</div>`,
          { imports: [ProtoInteract] },
        );

        const div = container.debugElement.query(By.css('div'));
        expect(div.nativeElement.tabIndex).toBe(0);
      });
    });
  });

  describe('aria-disabled', () => {
    it('should set aria-disabled on non-native elements when disabled', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true">Custom</div>`,
        { imports: [ProtoInteract] },
      );

      const div = container.debugElement.query(By.css('div'));
      expect(div.nativeElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not set aria-disabled on native buttons (native disabled is sufficient)', async () => {
      await render(`<button protoInteract [protoInteractDisabled]="true">Click me</button>`, {
        imports: [ProtoInteract],
      });

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-disabled');
    });

    it('should set aria-disabled on native buttons when focusable', async () => {
      await render(
        `<button protoInteract [protoInteractDisabled]="true" [protoInteractFocusable]="true">Click me</button>`,
        { imports: [ProtoInteract] },
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('click event blocking', () => {
    it('should stop click propagation on non-native disabled elements', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true" tabindex="0">Click me</div>`,
        { imports: [ProtoInteract] },
      );

      const div = container.debugElement.query(By.css('div'));
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');

      div.nativeElement.dispatchEvent(clickEvent);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should allow click when not disabled', async () => {
      const handleClick = vi.fn();
      await render(`<button protoInteract (click)="onClick()">Click me</button>`, {
        imports: [ProtoInteract],
        componentProperties: { onClick: handleClick },
      });

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should stop click event propagation when disabled', async () => {
      await render(`<button protoInteract [protoInteractDisabled]="true">Click me</button>`, {
        imports: [ProtoInteract],
      });

      const button = screen.getByRole('button');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');

      button.dispatchEvent(clickEvent);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('keydown event blocking', () => {
    it('should block Enter key when disabled', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true">Custom</div>`,
        { imports: [ProtoInteract] },
      );

      const div = container.debugElement.query(By.css('div'));
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      div.nativeElement.dispatchEvent(event);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should allow Tab key when disabled (prevent focus trap)', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true">Custom</div>`,
        { imports: [ProtoInteract] },
      );

      const div = container.debugElement.query(By.css('div'));
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopImmediatePropagation');

      div.nativeElement.dispatchEvent(event);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should only block events from the element itself, not bubbled events', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true"><span>Nested</span></div>`,
        { imports: [ProtoInteract] },
      );

      const span = container.debugElement.query(By.css('span'));
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopImmediatePropagation');

      span.nativeElement.dispatchEvent(event);
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('tab navigation', () => {
    it('should set tabIndex to -1 for disabled non-native element', async () => {
      const container = await render(
        `<div protoInteract [protoInteractDisabled]="true" tabindex="0">Disabled</div>`,
        { imports: [ProtoInteract] },
      );

      const div = container.debugElement.query(By.css('div'));
      expect(div.nativeElement.tabIndex).toBe(-1);
    });

    it('should keep initial tabIndex for focusable disabled element', async () => {
      const container = await render(`<div protoInteract tabindex="1">Disabled Focusable</div>`, {
        imports: [ProtoInteract],
      });

      const div = container.debugElement.query(By.css('div'));
      expect(div.nativeElement.tabIndex).toBe(1);
    });
  });

  describe('state control', () => {
    @Directive({
      selector: '[testElement]',
      hostDirectives: [
        {
          directive: ProtoInteract,
          inputs: ['protoInteractDisabled', 'protoInteractFocusable'],
        },
      ],
    })
    class TestElement {}

    @Component({
      selector: 'test-host-1',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [TestElement],
      template: `
        <div #div1 testElement>
          <div #div2 testElement></div>
        </div>
      `,
    })
    class TestHost {
      readonly div1 = viewChild.required('div1', { read: ProtoInteract });
      readonly div2 = viewChild.required('div2', { read: ProtoInteract });
    }

    it('should allow programmatic state control via controlled signals', async () => {
      const { fixture } = await render(TestHost);
      const div1 = fixture.componentInstance.div1().state();
      const div2 = fixture.componentInstance.div2().state();

      expect(div1.disabled()).toBe(false);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);

      div1.disabled.control(true);

      expect(div1.disabled()).toBe(true);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);

      div1.disabled.control(false);

      expect(div1.disabled()).toBe(false);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);
    });
  });

  describe('state control custom onInit (parent-child sync)', () => {
    @Directive({
      selector: '[testElement]',
      hostDirectives: [
        {
          directive: ProtoInteract,
          inputs: ['protoInteractDisabled', 'protoInteractFocusable'],
        },
      ],
    })
    class TestElement {}

    @Component({
      selector: 'test-host-2',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [TestElement],
      providers: [
        ProtoInteract.Hooks.provide(state => {
          effect(() => {
            const value = state();
            const parent = state.ancestry.parent?.state();
            if (!parent) {
              return;
            }

            // If the parent is disabled, sync the disabled state to the child
            // and ensure the tab index is <= to -1 to prevent focus
            value.disabled.control(parent.disabled() ? true : value.disabled.templateValue());

            value.tabIndex.control(
              parent.disabled()
                ? Math.min(-1, value.tabIndex.templateValue())
                : value.tabIndex.templateValue(),
            );
          });
        }),
      ],
      template: `
        <div #div1 testElement [protoInteractDisabled]="disableDiv1()">
          <div #div2 testElement [protoInteractDisabled]="disableDiv2()"></div>
        </div>
      `,
    })
    class TestHost {
      readonly div1 = viewChild.required('div1', { read: ProtoInteract });
      readonly div2 = viewChild.required('div2', { read: ProtoInteract });

      readonly disableDiv1 = input<boolean, BooleanInput>(false, {
        transform: booleanAttribute,
      });

      readonly disableDiv2 = input<boolean, BooleanInput>(false, {
        transform: booleanAttribute,
      });
    }

    it('should sync the disabled state to the child', async () => {
      const { fixture } = await render(TestHost);
      const div1 = fixture.componentInstance.div1().state();
      const div2 = fixture.componentInstance.div2().state();

      expect(div1.disabled()).toBe(false);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);

      div1.disabled.control(true);
      fixture.detectChanges();

      expect(div1.disabled()).toBe(true);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(true); // This should be true because the parent is disabled
      expect(div2.disabled.templateValue()).toBe(false);

      div1.disabled.control(false);
      fixture.detectChanges();

      expect(div1.disabled()).toBe(false);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);
    });

    it('should sync the disabled state to the child using inputs', async () => {
      const { fixture, rerender } = await render(TestHost, {
        componentInputs: { disableDiv1: false, disableDiv2: false },
      });
      const div1 = fixture.componentInstance.div1().state();
      const div2 = fixture.componentInstance.div2().state();

      expect(div1.disabled()).toBe(false);
      expect(div1.disabled.templateValue()).toBe(false);

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);

      await rerender({ componentInputs: { disableDiv1: true, disableDiv2: false } });

      expect(div1.disabled()).toBe(true);
      expect(div1.disabled.templateValue()).toBe(true); // Raw value is actual input

      expect(div2.disabled()).toBe(true); // This should be true because the parent is disabled
      expect(div2.disabled.templateValue()).toBe(false);

      div1.disabled.control(false);
      fixture.detectChanges();

      expect(div1.disabled()).toBe(false);
      expect(div1.disabled.templateValue()).toBe(true); // Raw value is actual input

      expect(div2.disabled()).toBe(false);
      expect(div2.disabled.templateValue()).toBe(false);
    });
  });

  describe('with different element types', () => {
    it('should work with button elements', async () => {
      await render(`<button protoInteract>Button</button>`, { imports: [ProtoInteract] });

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should work with anchor elements', async () => {
      const container = await render(`<a protoInteract href="#">Link</a>`, {
        imports: [ProtoInteract],
      });

      const link = container.debugElement.query(By.css('a'));
      expect(link.nativeElement.tagName).toBe('A');
    });

    it('should work with div elements', async () => {
      const container = await render(`<div protoInteract>Custom</div>`, {
        imports: [ProtoInteract],
      });

      const div = container.debugElement.query(By.css('div'));
      expect(div.nativeElement.tagName).toBe('DIV');
    });

    it('should work with input elements', async () => {
      await render(`<input protoInteract type="text" />`, { imports: [ProtoInteract] });

      const inp = screen.getByRole('textbox');
      expect(inp.tagName).toBe('INPUT');
    });
  });

  describe('config', () => {
    it('should use the fallback tab index when the element has no tabindex attribute', async () => {
      const { fixture } = await render(`<div protoInteract>Custom</div>`, {
        imports: [ProtoInteract],
      });

      const { fallbackTabIndex } = runInInjectionContext(fixture.componentRef.injector, () =>
        ProtoInteract.Config.inject(),
      );
      expect(fallbackTabIndex).toBe(0);

      const div = screen.getByText('Custom');
      expect(div.tabIndex).toBe(0);
    });

    it('should use not use the fallback tab index when the element has a tabindex attribute', async () => {
      const { fixture } = await render(`<div protoInteract tabindex="1">Custom</div>`, {
        imports: [ProtoInteract],
      });

      const { fallbackTabIndex } = runInInjectionContext(fixture.componentRef.injector, () =>
        ProtoInteract.Config.inject(),
      );
      expect(fallbackTabIndex).toBe(0);

      const div = screen.getByText('Custom');
      expect(div.tabIndex).toBe(1);
    });

    it('should use the fallback tab index when the element has no tabindex attribute and the fallback tab index is set', async () => {
      const { fixture } = await render(`<div protoInteract>Custom</div>`, {
        imports: [ProtoInteract],
        providers: [ProtoInteract.Config.provide({ fallbackTabIndex: 2 })],
      });

      const { fallbackTabIndex } = fixture.componentRef.injector.get(ProtoInteract.Config.token);
      expect(fallbackTabIndex).toBe(2);

      expect(
        runInInjectionContext(fixture.componentRef.injector, () => ProtoInteract.Config.inject())
          .fallbackTabIndex,
      ).toBe(2);

      const div = screen.getByText('Custom');
      expect(div.tabIndex).toBe(2);
    });

    it('should not use the fallback tab index when the element has a tabindex attribute and the fallback tab index is set', async () => {
      const { fixture } = await render(`<div protoInteract tabindex="1">Custom</div>`, {
        imports: [ProtoInteract],
        providers: [ProtoInteract.Config.provide({ fallbackTabIndex: -1 })],
      });
      const { fallbackTabIndex } = fixture.componentRef.injector.get(ProtoInteract.Config.token);
      expect(fallbackTabIndex).toBe(-1);

      expect(
        runInInjectionContext(fixture.componentRef.injector, () => ProtoInteract.Config.inject())
          .fallbackTabIndex,
      ).toBe(-1);

      const div = screen.getByText('Custom');
      expect(div.tabIndex).toBe(1);
    });
  });
});
