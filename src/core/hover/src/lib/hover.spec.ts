import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { ProtoHover } from './hover';

describe('ProtoHover', () => {
  @Component({
    selector: 'test-hover',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ProtoHover],
    template: `
      <div data-testid="hover-element" protoHover [protoHoverDisabled]="disabled">Hover me</div>
    `,
  })
  class TestHoverComponent {
    disabled = false;
  }

  it('should set data-hover when hovered with mouse pointer', async () => {
    const { fixture } = await render(TestHoverComponent);
    const element = screen.getByTestId('hover-element');

    expect(element).not.toHaveAttribute('data-hover');

    element.dispatchEvent(
      new PointerEvent('pointerenter', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
      }),
    );
    fixture.detectChanges();
    expect(element).toHaveAttribute('data-hover');

    element.dispatchEvent(
      new PointerEvent('pointerleave', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
      }),
    );
    fixture.detectChanges();
    expect(element).not.toHaveAttribute('data-hover');
  });

  it('should track hover state with mouse events', async () => {
    const { fixture } = await render(TestHoverComponent);
    const element = screen.getByTestId('hover-element');

    expect(element).not.toHaveAttribute('data-hover');

    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element).toHaveAttribute('data-hover');

    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element).not.toHaveAttribute('data-hover');
  });

  it('should ignore touch pointer events', async () => {
    const { fixture } = await render(TestHoverComponent);
    const element = screen.getByTestId('hover-element');

    expect(element).not.toHaveAttribute('data-hover');

    // Touch pointers should not trigger hover
    element.dispatchEvent(
      new PointerEvent('pointerenter', {
        bubbles: true,
        cancelable: true,
        pointerType: 'touch',
      }),
    );
    fixture.detectChanges();
    expect(element).not.toHaveAttribute('data-hover');
  });

  it('should not trigger hover when disabled', async () => {
    const { fixture, rerender } = await render(TestHoverComponent, {
      componentProperties: { disabled: true },
    });
    const element = screen.getByTestId('hover-element');

    await rerender({ componentProperties: { disabled: true } });
    fixture.detectChanges();

    element.dispatchEvent(
      new PointerEvent('pointerenter', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
      }),
    );
    fixture.detectChanges();
    expect(element).not.toHaveAttribute('data-hover');
  });

  it('should not trigger hover when disabled by config', async () => {
    const { fixture, rerender } = await render(TestHoverComponent, {
      providers: [ProtoHover.Config.provide({ disabled: true })],
    });
    const element = screen.getByTestId('hover-element');

    await rerender({ componentProperties: { disabled: true } });
    fixture.detectChanges();

    element.dispatchEvent(
      new PointerEvent('pointerenter', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
      }),
    );
    fixture.detectChanges();
    expect(element).not.toHaveAttribute('data-hover');
  });

  it('should reset hover when becoming disabled while hovered', async () => {
    const { fixture, rerender } = await render(TestHoverComponent);
    const element = screen.getByTestId('hover-element');

    element.dispatchEvent(
      new PointerEvent('pointerenter', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse',
      }),
    );
    fixture.detectChanges();
    expect(element).toHaveAttribute('data-hover');

    await rerender({ componentProperties: { disabled: true } });
    fixture.detectChanges();

    expect(element).not.toHaveAttribute('data-hover');
  });

  describe('outputs', () => {
    @Component({
      selector: 'test-hover-callbacks',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [ProtoHover],
      template: `
        <div
          data-testid="hover-element"
          protoHover
          (protoHoverEnd)="hoverEndCount = hoverEndCount + 1"
          (protoHoverStart)="hoverStartCount = hoverStartCount + 1"
        >
          Hover me
        </div>
      `,
    })
    class TestHoverCallbacksComponent {
      hoverStartCount = 0;
      hoverEndCount = 0;
    }

    it('should emit hoverStart and hoverEnd events', async () => {
      const { fixture } = await render(TestHoverCallbacksComponent);
      const component = fixture.componentInstance;
      const element = screen.getByTestId('hover-element');

      expect(component.hoverStartCount).toBe(0);
      expect(component.hoverEndCount).toBe(0);

      element.dispatchEvent(
        new PointerEvent('pointerenter', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
        }),
      );
      expect(component.hoverStartCount).toBe(1);
      expect(component.hoverEndCount).toBe(0);

      element.dispatchEvent(
        new PointerEvent('pointerleave', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
        }),
      );
      expect(component.hoverStartCount).toBe(1);
      expect(component.hoverEndCount).toBe(1);
    });
  });
});
