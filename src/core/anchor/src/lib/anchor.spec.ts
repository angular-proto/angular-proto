import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  type AnchorPlacement,
  getOppositePlacement,
  getPositionArea,
  parsePlacement,
  ProtoAnchor,
  ProtoAnchorArrow,
  ProtoAnchorTarget,
  ProtoAnchorTargetElement,
} from './anchor';

// ============================================================================
// Test Host Components
// ============================================================================

@Component({
  selector: 'test-anchor-basic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <button
      #anchor="protoAnchor"
      data-testid="anchor-trigger"
      protoAnchor
      (click)="anchor.toggle()"
    >
      Toggle
    </button>

    <div *protoAnchorTarget="anchor" data-testid="anchor-target">Overlay content</div>
  `,
})
class TestAnchorBasic {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
}

@Component({
  selector: 'test-anchor-with-placement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <button
      #anchor="protoAnchor"
      data-testid="anchor-trigger"
      protoAnchor
      [protoAnchorOffset]="offset()"
      [protoAnchorOpen]="isOpen()"
      [protoAnchorPlacement]="placement()"
    >
      Trigger
    </button>

    <div *protoAnchorTarget="anchor" data-testid="anchor-target">Content</div>
  `,
})
class TestAnchorWithPlacement {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
  readonly placement = signal<AnchorPlacement>('bottom');
  readonly offset = signal({ main: 8, cross: 0 });
  readonly isOpen = signal(false);
}

@Component({
  selector: 'test-anchor-with-arrow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget, ProtoAnchorArrow],
  template: `
    <button #anchor="protoAnchor" data-testid="anchor-trigger" protoAnchor>Trigger</button>

    <div *protoAnchorTarget="anchor" data-testid="anchor-target">
      <div
        data-testid="anchor-arrow"
        protoAnchorArrow
        [protoAnchorArrowHeight]="6"
        [protoAnchorArrowWidth]="12"
      ></div>
      Content with arrow
    </div>
  `,
})
class TestAnchorWithArrow {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
}

@Component({
  selector: 'test-anchor-disabled',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <button
      #anchor="protoAnchor"
      data-testid="anchor-trigger"
      protoAnchor
      [protoAnchorDisabled]="isDisabled()"
      (click)="anchor.toggle()"
    >
      Toggle
    </button>

    <div *protoAnchorTarget="anchor" data-testid="anchor-target">Content</div>
  `,
})
class TestAnchorDisabled {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
  readonly isDisabled = signal(false);
}

@Component({
  selector: 'test-anchor-attribute-directive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTargetElement],
  template: `
    <button #anchor="protoAnchor" data-testid="anchor-trigger" protoAnchor>Trigger</button>

    <!-- Using attribute directive with @if for manual control -->
    @if (showTarget()) {
      <div
        data-testid="anchor-target"
        protoAnchorTargetElement
        [protoAnchorTargetElementAnchorName]="anchor.anchorName()"
        [protoAnchorTargetElementPlacement]="'top'"
      >
        Explicit connection
      </div>
    }
  `,
})
class TestAnchorAttributeDirective {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
  readonly showTarget = signal(false);
}

@Component({
  selector: 'test-anchor-accessibility',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <button
      #anchor="protoAnchor"
      data-testid="anchor-trigger"
      protoAnchor
      [protoAnchorPopupType]="popupType()"
      (click)="anchor.toggle()"
    >
      Trigger
    </button>

    <div *protoAnchorTarget="anchor" data-testid="anchor-target" role="menu">Menu content</div>
  `,
})
class TestAnchorAccessibility {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
  readonly popupType = signal<'menu' | 'listbox' | 'dialog' | 'true' | null>('menu');
}

@Component({
  selector: 'test-anchor-with-placement-override',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <button
      #anchor="protoAnchor"
      data-testid="anchor-trigger"
      protoAnchor
      protoAnchorPlacement="bottom"
      (click)="anchor.toggle()"
    >
      Trigger
    </button>

    <div *protoAnchorTarget="anchor; placement: 'top'" data-testid="anchor-target">
      Content with placement override
    </div>
  `,
})
class TestAnchorWithPlacementOverride {
  readonly anchor = viewChild.required<ProtoAnchor>('anchor');
}

// ============================================================================
// ProtoAnchor Tests
// ============================================================================

describe('ProtoAnchor', () => {
  describe('basic functionality', () => {
    it('should render the anchor trigger', async () => {
      await render(TestAnchorBasic);

      const trigger = screen.getByTestId('anchor-trigger');
      expect(trigger).toBeInTheDocument();
    });

    it('should toggle the anchor target on click', async () => {
      const { fixture } = await render(TestAnchorBasic);

      const trigger = screen.getByTestId('anchor-trigger');

      // Initially closed
      expect(screen.queryByTestId('anchor-target')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(trigger);
      fixture.detectChanges();
      expect(screen.getByTestId('anchor-target')).toBeInTheDocument();

      // Click to close
      fireEvent.click(trigger);
      fixture.detectChanges();
      expect(screen.queryByTestId('anchor-target')).not.toBeInTheDocument();
    });

    it('should have a unique anchor name', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      const anchorName = anchor().anchorName();
      expect(anchorName).toMatch(/^--proto-anchor-/);
    });

    it('should apply anchor-name style to the element', async () => {
      await render(TestAnchorBasic);

      const trigger = screen.getByTestId('anchor-trigger');
      const style = trigger.getAttribute('style');
      expect(style).toContain('anchor-name');
    });
  });

  describe('open state management', () => {
    it('should support programmatic open/close', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      expect(anchor().isOpen()).toBe(false);

      anchor().open();
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(true);
      expect(screen.getByTestId('anchor-target')).toBeInTheDocument();

      anchor().close();
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(false);
      expect(screen.queryByTestId('anchor-target')).not.toBeInTheDocument();
    });

    it('should support programmatic setOpen', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().setOpen(true);
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(true);

      anchor().setOpen(false);
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(false);
    });

    it('should sync with input binding', async () => {
      const { fixture } = await render(TestAnchorWithPlacement);
      const { anchor, isOpen } = fixture.componentInstance;

      expect(anchor().isOpen()).toBe(false);

      isOpen.set(true);
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(true);
      expect(screen.getByTestId('anchor-target')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should prevent opening when disabled', async () => {
      const { fixture } = await render(TestAnchorDisabled);
      const { anchor, isDisabled } = fixture.componentInstance;

      isDisabled.set(true);
      fixture.detectChanges();

      const trigger = screen.getByTestId('anchor-trigger');
      fireEvent.click(trigger);
      fixture.detectChanges();

      expect(anchor().isOpen()).toBe(false);
      expect(screen.queryByTestId('anchor-target')).not.toBeInTheDocument();
    });

    it('should allow closing when disabled', async () => {
      const { fixture } = await render(TestAnchorDisabled);
      const { anchor, isDisabled } = fixture.componentInstance;

      // Open first
      const trigger = screen.getByTestId('anchor-trigger');
      fireEvent.click(trigger);
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(true);

      // Disable
      isDisabled.set(true);
      fixture.detectChanges();

      // Should still be able to close
      fireEvent.click(trigger);
      fixture.detectChanges();
      expect(anchor().isOpen()).toBe(false);
    });

    it('should prevent open() when disabled', async () => {
      const { fixture } = await render(TestAnchorDisabled);
      const { anchor, isDisabled } = fixture.componentInstance;

      isDisabled.set(true);
      fixture.detectChanges();

      anchor().open();
      fixture.detectChanges();

      expect(anchor().isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should set aria-expanded based on open state', async () => {
      const { fixture } = await render(TestAnchorBasic);

      const trigger = screen.getByTestId('anchor-trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      fixture.detectChanges();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should set aria-haspopup based on popup type', async () => {
      const { fixture } = await render(TestAnchorAccessibility);
      const { popupType } = fixture.componentInstance;

      const trigger = screen.getByTestId('anchor-trigger');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

      popupType.set('dialog');
      fixture.detectChanges();
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

      popupType.set(null);
      fixture.detectChanges();
      expect(trigger).not.toHaveAttribute('aria-haspopup');
    });

    it('should set data-anchor-open attribute when open', async () => {
      const { fixture } = await render(TestAnchorBasic);

      const trigger = screen.getByTestId('anchor-trigger');
      expect(trigger).not.toHaveAttribute('data-anchor-open');

      fireEvent.click(trigger);
      fixture.detectChanges();
      expect(trigger).toHaveAttribute('data-anchor-open', '');
    });
  });

  describe('configuration', () => {
    it('should use default placement from config', async () => {
      const { fixture } = await render(TestAnchorWithPlacement);
      const { anchor } = fixture.componentInstance;

      expect(anchor().placement()).toBe('bottom');
    });

    it('should accept custom placement', async () => {
      const { fixture } = await render(TestAnchorWithPlacement);
      const { anchor, placement, isOpen } = fixture.componentInstance;

      placement.set('top-start');
      isOpen.set(true);
      fixture.detectChanges();

      expect(anchor().placement()).toBe('top-start');
    });

    it('should accept custom offset', async () => {
      const { fixture } = await render(TestAnchorWithPlacement);
      const { anchor, offset } = fixture.componentInstance;

      expect(anchor().offset()).toEqual({ main: 8, cross: 0 });

      offset.set({ main: 16, cross: 4 });
      fixture.detectChanges();

      expect(anchor().offset()).toEqual({ main: 16, cross: 4 });
    });
  });
});

// ============================================================================
// ProtoAnchorTarget (Structural Directive) Tests
// ============================================================================

describe('ProtoAnchorTarget (structural directive)', () => {
  describe('auto show/hide', () => {
    it('should show when anchor opens', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      expect(screen.queryByTestId('anchor-target')).not.toBeInTheDocument();

      anchor().open();
      fixture.detectChanges();

      expect(screen.getByTestId('anchor-target')).toBeInTheDocument();
    });

    it('should hide when anchor closes', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();
      expect(screen.getByTestId('anchor-target')).toBeInTheDocument();

      anchor().close();
      fixture.detectChanges();
      expect(screen.queryByTestId('anchor-target')).not.toBeInTheDocument();
    });
  });

  describe('positioning styles', () => {
    it('should apply fixed positioning by default', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveStyle({ position: 'fixed' });
    });

    it('should apply position-anchor style', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      const style = target.getAttribute('style');
      expect(style).toContain('position-anchor');
    });

    it('should apply position-area based on placement', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      const style = target.getAttribute('style');
      expect(style).toContain('position-area');
      expect(style).toContain('bottom');
    });

    it('should apply z-index', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveStyle({ zIndex: '1000' });
    });
  });

  describe('data attributes', () => {
    it('should set data-anchor-target attribute', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveAttribute('data-anchor-target', '');
    });

    it('should set data-placement attribute', async () => {
      const { fixture } = await render(TestAnchorBasic);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveAttribute('data-placement', 'bottom');
    });
  });

  describe('placement override', () => {
    it('should allow overriding placement on the structural directive', async () => {
      const { fixture } = await render(TestAnchorWithPlacementOverride);
      const { anchor } = fixture.componentInstance;

      anchor().open();
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveAttribute('data-placement', 'top');
    });
  });
});

// ============================================================================
// ProtoAnchorTargetElement (Attribute Directive) Tests
// ============================================================================

describe('ProtoAnchorTargetElement (attribute directive)', () => {
  describe('positioning styles', () => {
    it('should apply fixed positioning by default', async () => {
      const { fixture } = await render(TestAnchorAttributeDirective);
      const { showTarget } = fixture.componentInstance;

      showTarget.set(true);
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveStyle({ position: 'fixed' });
    });

    it('should apply position-anchor style when explicitly set', async () => {
      const { fixture } = await render(TestAnchorAttributeDirective);
      const { showTarget } = fixture.componentInstance;

      showTarget.set(true);
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      const style = target.getAttribute('style');
      expect(style).toContain('position-anchor');
    });

    it('should allow overriding placement', async () => {
      const { fixture } = await render(TestAnchorAttributeDirective);
      const { showTarget } = fixture.componentInstance;

      showTarget.set(true);
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      expect(target).toHaveAttribute('data-placement', 'top');
    });
  });

  describe('explicit anchor connection', () => {
    it('should connect using explicit anchor name', async () => {
      const { fixture } = await render(TestAnchorAttributeDirective);
      const { showTarget, anchor } = fixture.componentInstance;

      showTarget.set(true);
      fixture.detectChanges();

      const target = screen.getByTestId('anchor-target');
      const style = target.getAttribute('style');

      // Should contain the anchor name from the anchor directive
      expect(style).toContain(anchor().anchorName());
    });
  });
});

// ============================================================================
// ProtoAnchorArrow Tests
// ============================================================================

describe('ProtoAnchorArrow', () => {
  it('should render arrow with custom dimensions', async () => {
    const { fixture } = await render(TestAnchorWithArrow);
    const { anchor } = fixture.componentInstance;

    anchor().open();
    fixture.detectChanges();

    const arrow = screen.getByTestId('anchor-arrow');
    expect(arrow).toBeInTheDocument();
  });

  it('should apply custom width and height', async () => {
    const { fixture } = await render(TestAnchorWithArrow);
    const { anchor } = fixture.componentInstance;

    anchor().open();
    fixture.detectChanges();

    const arrow = screen.getByTestId('anchor-arrow');
    expect(arrow).toHaveStyle({ width: '12px', height: '6px' });
  });

  it('should set data-anchor-arrow attribute', async () => {
    const { fixture } = await render(TestAnchorWithArrow);
    const { anchor } = fixture.componentInstance;

    anchor().open();
    fixture.detectChanges();

    const arrow = screen.getByTestId('anchor-arrow');
    expect(arrow).toHaveAttribute('data-anchor-arrow', '');
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('utility functions', () => {
  describe('getOppositePlacement', () => {
    it('should return opposite placement for basic positions', () => {
      expect(getOppositePlacement('top')).toBe('bottom');
      expect(getOppositePlacement('bottom')).toBe('top');
      expect(getOppositePlacement('left')).toBe('right');
      expect(getOppositePlacement('right')).toBe('left');
    });

    it('should preserve alignment when flipping', () => {
      expect(getOppositePlacement('top-start')).toBe('bottom-start');
      expect(getOppositePlacement('top-end')).toBe('bottom-end');
      expect(getOppositePlacement('left-start')).toBe('right-start');
      expect(getOppositePlacement('right-end')).toBe('left-end');
    });
  });

  describe('getPositionArea', () => {
    it('should return correct CSS position-area values', () => {
      expect(getPositionArea('top')).toBe('top');
      expect(getPositionArea('bottom')).toBe('bottom');
      expect(getPositionArea('left')).toBe('left');
      expect(getPositionArea('right')).toBe('right');
    });

    it('should handle alignment variations', () => {
      expect(getPositionArea('top-start')).toBe('top left');
      expect(getPositionArea('top-end')).toBe('top right');
      expect(getPositionArea('bottom-start')).toBe('bottom left');
      expect(getPositionArea('bottom-end')).toBe('bottom right');
      expect(getPositionArea('left-start')).toBe('left top');
      expect(getPositionArea('left-end')).toBe('left bottom');
      expect(getPositionArea('right-start')).toBe('right top');
      expect(getPositionArea('right-end')).toBe('right bottom');
    });
  });

  describe('parsePlacement', () => {
    it('should parse basic placements with center alignment', () => {
      expect(parsePlacement('top')).toEqual({ direction: 'top', alignment: 'center' });
      expect(parsePlacement('bottom')).toEqual({ direction: 'bottom', alignment: 'center' });
      expect(parsePlacement('left')).toEqual({ direction: 'left', alignment: 'center' });
      expect(parsePlacement('right')).toEqual({ direction: 'right', alignment: 'center' });
    });

    it('should parse placements with alignment', () => {
      expect(parsePlacement('top-start')).toEqual({ direction: 'top', alignment: 'start' });
      expect(parsePlacement('top-end')).toEqual({ direction: 'top', alignment: 'end' });
      expect(parsePlacement('bottom-start')).toEqual({ direction: 'bottom', alignment: 'start' });
      expect(parsePlacement('right-end')).toEqual({ direction: 'right', alignment: 'end' });
    });
  });
});

// ============================================================================
// Proto State Tests
// ============================================================================

describe('Proto integration', () => {
  it('should create ProtoAnchor state', async () => {
    const { fixture } = await render(TestAnchorBasic);
    const { anchor } = fixture.componentInstance;

    const state = anchor().state;
    expect(state).toBeDefined();
    // Class names may have numeric suffixes in test environments due to JIT compilation
    expect(state.protoName).toMatch(/^ProtoAnchor\d*$/);
  });

  it('should render target when anchor opens', async () => {
    const { fixture } = await render(TestAnchorBasic);
    const { anchor } = fixture.componentInstance;

    anchor().open();
    fixture.detectChanges();

    // Access target via the rendered element
    const target = screen.getByTestId('anchor-target');
    expect(target).toBeInTheDocument();
  });

  it('should create AnchorArrowProto state', async () => {
    const { fixture } = await render(TestAnchorWithArrow);
    const { anchor } = fixture.componentInstance;

    anchor().open();
    fixture.detectChanges();

    const arrow = screen.getByTestId('anchor-arrow');
    expect(arrow).toBeInTheDocument();
  });
});
