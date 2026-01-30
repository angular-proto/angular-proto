import { createProto } from '@angular-proto/core';
import { injectElementRef, uniqueId } from '@angular-proto/core/utils';
import type { BooleanInput } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  computed,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  InjectionToken,
  Injector,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';

// ============================================================================
// Types & Constants
// ============================================================================

/**
 * Placement positions for the anchor target.
 * Uses logical naming consistent with CSS anchor positioning.
 */
export type AnchorPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Alignment options within the placement axis.
 */
export type AnchorAlignment = 'start' | 'center' | 'end';

/**
 * Flip behavior strategies for collision detection.
 */
export type AnchorFlipBehavior = 'none' | 'flip-block' | 'flip-inline' | 'flip-block flip-inline';

/**
 * Visibility behavior when the anchor is not visible.
 */
export type AnchorVisibility = 'always' | 'anchors-visible' | 'no-overflow';

/**
 * Offset configuration for fine-tuning position.
 */
export interface AnchorOffset {
  /** Offset along the main axis (away from anchor) */
  readonly main: number;
  /** Offset along the cross axis (perpendicular to main) */
  readonly cross: number;
}

/**
 * Maps placement to CSS position-area values.
 */
const PLACEMENT_TO_POSITION_AREA: Record<AnchorPlacement, string> = {
  top: 'top',
  'top-start': 'top left',
  'top-end': 'top right',
  bottom: 'bottom',
  'bottom-start': 'bottom left',
  'bottom-end': 'bottom right',
  left: 'left',
  'left-start': 'left top',
  'left-end': 'left bottom',
  right: 'right',
  'right-start': 'right top',
  'right-end': 'right bottom',
};

/**
 * Maps placement to the opposite placement for flipping.
 */
const OPPOSITE_PLACEMENT: Record<AnchorPlacement, AnchorPlacement> = {
  top: 'bottom',
  'top-start': 'bottom-start',
  'top-end': 'bottom-end',
  bottom: 'top',
  'bottom-start': 'top-start',
  'bottom-end': 'top-end',
  left: 'right',
  'left-start': 'right-start',
  'left-end': 'right-end',
  right: 'left',
  'right-start': 'left-start',
  'right-end': 'left-end',
};

// ============================================================================
// ProtoAnchor Configuration
// ============================================================================

export interface ProtoAnchorConfig {
  /**
   * Default placement for the anchor target.
   * @default 'bottom'
   */
  readonly defaultPlacement: AnchorPlacement;

  /**
   * Default offset from the anchor element.
   * @default { main: 0, cross: 0 }
   */
  readonly defaultOffset: AnchorOffset;

  /**
   * Default flip behavior for collision detection.
   * @default 'flip-block'
   */
  readonly defaultFlipBehavior: AnchorFlipBehavior;

  /**
   * Default visibility behavior.
   * @default 'always'
   */
  readonly defaultVisibility: AnchorVisibility;

  /**
   * Whether the anchor is disabled by default.
   * @default false
   */
  readonly defaultDisabled: boolean;
}

const defaultAnchorConfig: ProtoAnchorConfig = {
  defaultPlacement: 'bottom',
  defaultOffset: { main: 0, cross: 0 },
  defaultFlipBehavior: 'flip-block',
  defaultVisibility: 'always',
  defaultDisabled: false,
};

// ============================================================================
// Injection Tokens
// ============================================================================

/**
 * Token to link anchor targets to their anchor trigger.
 */
export const PROTO_ANCHOR_CONTEXT = new InjectionToken<ProtoAnchorContext>('ProtoAnchorContext');

export interface ProtoAnchorContext {
  readonly anchorName: string;
  readonly isOpen: () => boolean;
  readonly placement: () => AnchorPlacement;
  readonly offset: () => AnchorOffset;
  readonly flipBehavior: () => AnchorFlipBehavior;
  readonly visibility: () => AnchorVisibility;
  readonly disabled: () => boolean;
  readonly close: () => void;
}

// ============================================================================
// ProtoAnchor Directive
// ============================================================================

const protoForAnchor = createProto<ProtoAnchor, ProtoAnchorConfig>(defaultAnchorConfig);

/**
 * Directive that marks an element as an anchor for positioning overlays.
 *
 * Uses native CSS anchor positioning (anchor-name property) to establish
 * the element as a positioning reference for ProtoAnchorTarget elements.
 *
 * ## Features
 * - Native CSS anchor positioning (no JavaScript positioning calculations)
 * - Signal-based open/close state management
 * - Configurable placement, offset, and flip behavior
 * - Full accessibility support with ARIA attributes
 *
 * ## Data Attributes
 * - `data-anchor-open`: Present when the anchor target is open
 *
 * @example
 * ```html
 * <button protoAnchor #anchor="protoAnchor" (click)="anchor.toggle()">
 *   Open Menu
 * </button>
 *
 * <div *protoAnchorTarget="anchor" role="menu">
 *   Menu content here
 * </div>
 * ```
 *
 * @example
 * ```html
 * <!-- With custom placement and offset -->
 * <button
 *   protoAnchor
 *   protoAnchorPlacement="top"
 *   [protoAnchorOffset]="{ main: 8, cross: 0 }"
 *   #anchor="protoAnchor"
 * >
 *   Hover for tooltip
 * </button>
 * ```
 */
@Directive({
  selector: '[protoAnchor]',
  exportAs: 'protoAnchor',
  host: {
    '[style.anchor-name]': 'anchorName()',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-haspopup]': 'hasPopup()',
    '[attr.data-anchor-open]': "isOpen() ? '' : null",
  },
  providers: [
    ProtoAnchor.State.provide(),
    {
      provide: PROTO_ANCHOR_CONTEXT,
      useFactory: () => {
        const anchor = ProtoAnchor.State.inject();
        return {
          get anchorName() {
            return anchor().anchorName();
          },
          isOpen: () => anchor().isOpen(),
          placement: () => anchor().placement(),
          offset: () => anchor().offset(),
          flipBehavior: () => anchor().flipBehavior(),
          visibility: () => anchor().visibility(),
          disabled: () => anchor().disabled(),
          close: () => anchor().close(),
        } satisfies ProtoAnchorContext;
      },
    },
  ],
})
export class ProtoAnchor {
  private static readonly Proto = protoForAnchor(ProtoAnchor);
  static readonly State = ProtoAnchor.Proto.state;
  static readonly Config = ProtoAnchor.Proto.config;
  static readonly Hooks = ProtoAnchor.Proto.hooks;

  private readonly config = ProtoAnchor.Config.inject();
  private readonly elementRef = injectElementRef<HTMLElement>();
  private readonly _injector = inject(Injector);

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  /**
   * Whether the anchor target is currently open/visible.
   */
  readonly openInput = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'protoAnchorOpen',
  });

  /**
   * Preferred placement of the anchor target relative to the anchor.
   */
  readonly placement = input<AnchorPlacement>(this.config.defaultPlacement, {
    alias: 'protoAnchorPlacement',
  });

  /**
   * Offset from the anchor element.
   */
  readonly offset = input<AnchorOffset>(this.config.defaultOffset, {
    alias: 'protoAnchorOffset',
  });

  /**
   * Flip behavior for collision detection.
   */
  readonly flipBehavior = input<AnchorFlipBehavior>(this.config.defaultFlipBehavior, {
    alias: 'protoAnchorFlipBehavior',
  });

  /**
   * Visibility behavior when the anchor is outside the viewport.
   */
  readonly visibility = input<AnchorVisibility>(this.config.defaultVisibility, {
    alias: 'protoAnchorVisibility',
  });

  /**
   * Whether the anchor functionality is disabled.
   */
  readonly disabled = input<boolean, BooleanInput>(this.config.defaultDisabled, {
    transform: booleanAttribute,
    alias: 'protoAnchorDisabled',
  });

  /**
   * The type of popup associated with this anchor (for aria-haspopup).
   * Set to null for no popup hint.
   */
  readonly popupType = input<'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | 'true' | null>(
    'true',
    { alias: 'protoAnchorPopupType' },
  );

  // -------------------------------------------------------------------------
  // Outputs
  // -------------------------------------------------------------------------

  /**
   * Emitted when the open state changes.
   */
  readonly openChange = output<boolean>({ alias: 'protoAnchorOpenChange' });

  // -------------------------------------------------------------------------
  // Internal State
  // -------------------------------------------------------------------------

  /**
   * Unique CSS anchor name for this element.
   */
  readonly anchorName = signal(`--proto-anchor-${uniqueId('anchor')}`);

  /**
   * Linked signal for internal open state management.
   * Allows both template binding and programmatic control.
   */
  private readonly _isOpen = linkedSignal(() => this.openInput());

  /**
   * Whether the anchor target is currently open.
   */
  readonly isOpen = this._isOpen.asReadonly();

  /**
   * Computed aria-haspopup value.
   */
  readonly hasPopup = computed(() => {
    const type = this.popupType();
    return type === null ? undefined : type;
  });

  readonly state = ProtoAnchor.Proto(this);

  constructor() {
    // Sync open state changes to output
    effect(() => {
      const isOpen = this._isOpen();
      untracked(() => this.openChange.emit(isOpen));
    });
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Opens the anchor target.
   */
  open(): void {
    if (this.disabled()) {
      return;
    }
    this._isOpen.set(true);
  }

  /**
   * Closes the anchor target.
   */
  close(): void {
    this._isOpen.set(false);
  }

  /**
   * Toggles the anchor target open/closed state.
   */
  toggle(): void {
    if (this.disabled() && !this._isOpen()) {
      return;
    }
    this._isOpen.update(v => !v);
  }

  /**
   * Sets the open state programmatically.
   */
  setOpen(open: boolean): void {
    if (this.disabled() && open) {
      return;
    }
    this._isOpen.set(open);
  }

  /**
   * Gets the native element.
   */
  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}

// ============================================================================
// ProtoAnchorTarget Configuration
// ============================================================================

export interface ProtoAnchorTargetConfig {
  /**
   * Whether to use fixed positioning instead of absolute.
   * @default true
   */
  readonly useFixedPositioning: boolean;

  /**
   * Whether to auto-hide when clicking outside.
   * @default false
   */
  readonly autoHideOnClickOutside: boolean;

  /**
   * Whether to auto-hide when pressing Escape.
   * @default true
   */
  readonly autoHideOnEscape: boolean;
}

const defaultTargetConfig: ProtoAnchorTargetConfig = {
  useFixedPositioning: true,
  autoHideOnClickOutside: false,
  autoHideOnEscape: true,
};

// ============================================================================
// Template Context for Structural Directive
// ============================================================================

/**
 * Context provided to the template when using *protoAnchorTarget structural directive.
 */
export interface ProtoAnchorTargetContext {
  /** The anchor instance reference */
  $implicit: ProtoAnchor;
  /** Explicit anchor reference */
  protoAnchorTarget: ProtoAnchor;
  /** Current placement */
  placement: AnchorPlacement;
  /** Whether the target is open */
  isOpen: boolean;
}

// ============================================================================
// ProtoAnchorTarget Structural Directive
// ============================================================================

const protoForAnchorTarget = createProto<ProtoAnchorTarget, ProtoAnchorTargetConfig>(
  defaultTargetConfig,
);

/**
 * Structural directive that creates and positions an element relative to a ProtoAnchor
 * using CSS anchor positioning.
 *
 * This directive uses the `*protoAnchorTarget` structural syntax, internally handling
 * the show/hide logic based on the anchor's `isOpen` state.
 *
 * CSS properties applied to the rendered element:
 * - `position-anchor`: Links to the anchor element
 * - `position-area`: Defines placement relative to anchor
 * - `position-try-fallbacks`: Handles collision detection
 * - `position-visibility`: Controls visibility based on anchor visibility
 *
 * ## Features
 * - Pure CSS positioning (no JavaScript calculations)
 * - Automatic show/hide based on anchor state
 * - Automatic fallback positioning on viewport collision
 * - Full accessibility support
 * - Data attributes for styling hooks
 *
 * ## Data Attributes (on rendered element)
 * - `data-placement`: Current placement value
 * - `data-anchor-target`: Always present, identifies the element
 *
 * @example
 * ```html
 * <button protoAnchor #anchor="protoAnchor" (click)="anchor.toggle()">Trigger</button>
 *
 * <div *protoAnchorTarget="anchor" role="menu">
 *   <div protoAnchorArrow></div>
 *   Menu content
 * </div>
 * ```
 *
 * @example
 * ```html
 * <!-- With placement override -->
 * <div *protoAnchorTarget="anchor; placement: 'top'" role="tooltip">
 *   Tooltip content
 * </div>
 * ```
 */
@Directive({
  selector: '[protoAnchorTarget]',
  providers: [ProtoAnchorTarget.State.provide()],
})
export class ProtoAnchorTarget {
  private static readonly Proto = protoForAnchorTarget(ProtoAnchorTarget);
  static readonly State = ProtoAnchorTarget.Proto.state;
  static readonly Config = ProtoAnchorTarget.Proto.config;
  static readonly Hooks = ProtoAnchorTarget.Proto.hooks;

  private readonly config = ProtoAnchorTarget.Config.inject();
  private readonly templateRef = inject(TemplateRef<ProtoAnchorTargetContext>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  private embeddedView: EmbeddedViewRef<ProtoAnchorTargetContext> | null = null;

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  /**
   * The anchor instance to position relative to.
   * This is the main input for the structural directive.
   */
  readonly anchor = input.required<ProtoAnchor>({ alias: 'protoAnchorTarget' });

  /**
   * Override the placement from the anchor.
   */
  readonly placement = input<AnchorPlacement | undefined>(undefined, {
    alias: 'protoAnchorTargetPlacement',
  });

  /**
   * Override the offset from the anchor.
   */
  readonly offset = input<AnchorOffset | undefined>(undefined, {
    alias: 'protoAnchorTargetOffset',
  });

  /**
   * Override the flip behavior from the anchor.
   */
  readonly flipBehavior = input<AnchorFlipBehavior | undefined>(undefined, {
    alias: 'protoAnchorTargetFlipBehavior',
  });

  /**
   * Override the visibility behavior from the anchor.
   */
  readonly visibility = input<AnchorVisibility | undefined>(undefined, {
    alias: 'protoAnchorTargetVisibility',
  });

  /**
   * Z-index for the positioned element.
   */
  readonly zIndex = input<number, string | number>(1000, {
    transform: numberAttribute,
    alias: 'protoAnchorTargetZIndex',
  });

  /**
   * Whether to use fixed positioning.
   */
  readonly useFixed = input<boolean, BooleanInput>(this.config.useFixedPositioning, {
    transform: booleanAttribute,
    alias: 'protoAnchorTargetUseFixed',
  });

  /**
   * Whether to auto-hide when clicking outside.
   */
  readonly autoHideOnClickOutside = input<boolean, BooleanInput>(
    this.config.autoHideOnClickOutside,
    {
      transform: booleanAttribute,
      alias: 'protoAnchorTargetAutoHideOnClickOutside',
    },
  );

  /**
   * Whether to auto-hide when pressing Escape.
   */
  readonly autoHideOnEscape = input<boolean, BooleanInput>(this.config.autoHideOnEscape, {
    transform: booleanAttribute,
    alias: 'protoAnchorTargetAutoHideOnEscape',
  });

  // -------------------------------------------------------------------------
  // Computed Styles
  // -------------------------------------------------------------------------

  /**
   * Resolved placement (from input or anchor context).
   */
  private readonly resolvedPlacement = computed((): AnchorPlacement => {
    const inputPlacement = this.placement();
    if (inputPlacement !== undefined) {
      return inputPlacement;
    }
    return this.anchor().placement();
  });

  /**
   * Resolved offset (from input or anchor context).
   */
  private readonly resolvedOffset = computed((): AnchorOffset => {
    const inputOffset = this.offset();
    if (inputOffset !== undefined) {
      return inputOffset;
    }
    return this.anchor().offset();
  });

  /**
   * Resolved flip behavior.
   */
  private readonly resolvedFlipBehavior = computed((): AnchorFlipBehavior => {
    const inputFlip = this.flipBehavior();
    if (inputFlip !== undefined) {
      return inputFlip;
    }
    return this.anchor().flipBehavior();
  });

  /**
   * Resolved visibility.
   */
  private readonly resolvedVisibility = computed((): AnchorVisibility => {
    const inputVisibility = this.visibility();
    if (inputVisibility !== undefined) {
      return inputVisibility;
    }
    return this.anchor().visibility();
  });

  readonly state = ProtoAnchorTarget.Proto(this);

  constructor() {
    // Effect to manage the view based on anchor's isOpen state
    effect(() => {
      const anchor = this.anchor();
      const isOpen = anchor.isOpen();

      untracked(() => {
        if (isOpen && !this.embeddedView) {
          this.createView(anchor);
        } else if (!isOpen && this.embeddedView) {
          this.destroyView();
        } else if (isOpen && this.embeddedView) {
          this.updateViewContext(anchor);
        }
      });
    });

    // Effect to update styles when placement/offset changes
    effect(() => {
      const placement = this.resolvedPlacement();
      const offset = this.resolvedOffset();
      const flipBehavior = this.resolvedFlipBehavior();
      const visibility = this.resolvedVisibility();
      const zIndex = this.zIndex();
      const useFixed = this.useFixed();
      const anchor = this.anchor();

      untracked(() => {
        if (this.embeddedView) {
          this.applyStyles(anchor, placement, offset, flipBehavior, visibility, zIndex, useFixed);
        }
      });
    });

    // Handle click outside
    afterRenderEffect(
      onCleanup => {
        if (!this.autoHideOnClickOutside() || !this.embeddedView) {
          return;
        }

        const anchor = this.anchor();

        const handler = (event: MouseEvent) => {
          const target = event.target as Node;
          const rootNode = this.embeddedView?.rootNodes[0] as HTMLElement | undefined;

          if (rootNode && !rootNode.contains(target) && !anchor.nativeElement.contains(target)) {
            anchor.close();
          }
        };

        this.document.addEventListener('click', handler, { capture: true });
        onCleanup(() => this.document.removeEventListener('click', handler, { capture: true }));
      },
      { injector: this.injector },
    );

    // Handle escape key
    afterRenderEffect(
      onCleanup => {
        if (!this.autoHideOnEscape() || !this.embeddedView) {
          return;
        }

        const anchor = this.anchor();

        const handler = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            anchor.close();
          }
        };

        this.document.addEventListener('keydown', handler, { capture: true });
        onCleanup(() => this.document.removeEventListener('keydown', handler, { capture: true }));
      },
      { injector: this.injector },
    );
  }

  private createView(anchor: ProtoAnchor): void {
    const context: ProtoAnchorTargetContext = {
      $implicit: anchor,
      protoAnchorTarget: anchor,
      placement: this.resolvedPlacement(),
      isOpen: true,
    };

    this.embeddedView = this.viewContainerRef.createEmbeddedView(this.templateRef, context);

    // Apply styles to the root element
    this.applyStyles(
      anchor,
      this.resolvedPlacement(),
      this.resolvedOffset(),
      this.resolvedFlipBehavior(),
      this.resolvedVisibility(),
      this.zIndex(),
      this.useFixed(),
    );

    this.embeddedView.markForCheck();
  }

  private destroyView(): void {
    if (this.embeddedView) {
      this.embeddedView.destroy();
      this.embeddedView = null;
    }
  }

  private updateViewContext(anchor: ProtoAnchor): void {
    if (!this.embeddedView) {
      return;
    }

    this.embeddedView.context.$implicit = anchor;
    this.embeddedView.context.protoAnchorTarget = anchor;
    this.embeddedView.context.placement = this.resolvedPlacement();
    this.embeddedView.context.isOpen = true;
    this.embeddedView.markForCheck();
  }

  private applyStyles(
    anchor: ProtoAnchor,
    placement: AnchorPlacement,
    offset: AnchorOffset,
    flipBehavior: AnchorFlipBehavior,
    visibility: AnchorVisibility,
    zIndex: number,
    useFixed: boolean,
  ): void {
    const rootElement = this.embeddedView?.rootNodes[0] as HTMLElement | undefined;
    if (!rootElement || rootElement.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const style = rootElement.style;

    // Position type
    style.position = useFixed ? 'fixed' : 'absolute';

    // Link to anchor
    style.setProperty('position-anchor', anchor.anchorName());

    // Position area based on placement
    style.setProperty('position-area', PLACEMENT_TO_POSITION_AREA[placement]);

    // Flip fallbacks
    if (flipBehavior !== 'none') {
      style.setProperty('position-try-fallbacks', flipBehavior);
    } else {
      style.removeProperty('position-try-fallbacks');
    }

    // Visibility
    style.setProperty('position-visibility', visibility);

    // Z-index
    style.zIndex = String(zIndex);

    // Offset via margin
    if (offset.main !== 0 || offset.cross !== 0) {
      const marginStyle = this.computeMargin(placement, offset);
      style.margin = marginStyle;
    } else {
      style.removeProperty('margin');
    }

    // Data attributes
    rootElement.setAttribute('data-placement', placement);
    rootElement.setAttribute('data-anchor-target', '');
  }

  private computeMargin(placement: AnchorPlacement, offset: AnchorOffset): string {
    const mainPx = `${offset.main}px`;
    const crossPx = `${offset.cross}px`;

    const isTop = placement.startsWith('top');
    const isBottom = placement.startsWith('bottom');
    const isLeft = placement.startsWith('left');
    const isRight = placement.startsWith('right');

    if (isTop) {
      return `0 0 ${mainPx} ${crossPx}`;
    } else if (isBottom) {
      return `${mainPx} 0 0 ${crossPx}`;
    } else if (isLeft) {
      return `${crossPx} ${mainPx} 0 0`;
    } else if (isRight) {
      return `${crossPx} 0 0 ${mainPx}`;
    }

    return '0';
  }

  /**
   * Static method for Angular's structural directive type checking.
   */
  static ngTemplateContextGuard(
    _dir: ProtoAnchorTarget,
    _ctx: unknown,
  ): _ctx is ProtoAnchorTargetContext {
    return true;
  }
}

// ============================================================================
// ProtoAnchorTarget Attribute Directive (for non-structural use cases)
// ============================================================================

/**
 * Attribute directive version of ProtoAnchorTarget for use with @if or when
 * you need more control over rendering.
 *
 * @example
 * ```html
 * @if (anchor.isOpen()) {
 *   <div protoAnchorTargetElement role="menu">
 *     Menu content
 *   </div>
 * }
 * ```
 */
@Directive({
  selector: '[protoAnchorTargetElement]',
  exportAs: 'protoAnchorTargetElement',
  host: {
    '[style.position]': 'positionStyle()',
    '[style.position-anchor]': 'anchorNameStyle()',
    '[style.position-area]': 'positionAreaStyle()',
    '[style.position-try-fallbacks]': 'flipStyle()',
    '[style.position-visibility]': 'visibilityStyle()',
    '[style.margin]': 'marginStyle()',
    '[style.z-index]': 'zIndex()',
    '[attr.data-placement]': 'resolvedPlacement()',
    '[attr.data-anchor-target]': "''",
    '(keydown)': 'onEscape($event)',
  },
})
export class ProtoAnchorTargetElement {
  private readonly elementRef = injectElementRef<HTMLElement>();
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly anchorContext = inject(PROTO_ANCHOR_CONTEXT, { optional: true });

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  /**
   * Override the placement from the anchor.
   */
  readonly placement = input<AnchorPlacement | undefined>(undefined, {
    alias: 'protoAnchorTargetElementPlacement',
  });

  /**
   * Override the offset from the anchor.
   */
  readonly offset = input<AnchorOffset | undefined>(undefined, {
    alias: 'protoAnchorTargetElementOffset',
  });

  /**
   * Override the flip behavior from the anchor.
   */
  readonly flipBehavior = input<AnchorFlipBehavior | undefined>(undefined, {
    alias: 'protoAnchorTargetElementFlipBehavior',
  });

  /**
   * Override the visibility behavior from the anchor.
   */
  readonly visibility = input<AnchorVisibility | undefined>(undefined, {
    alias: 'protoAnchorTargetElementVisibility',
  });

  /**
   * Explicit anchor name to connect to (for manual linking).
   */
  readonly anchorName = input<string | undefined>(undefined, {
    alias: 'protoAnchorTargetElementAnchorName',
  });

  /**
   * Z-index for the positioned element.
   */
  readonly zIndex = input<number, string | number>(1000, {
    transform: numberAttribute,
    alias: 'protoAnchorTargetElementZIndex',
  });

  /**
   * Whether to use fixed positioning.
   */
  readonly useFixed = input<boolean, BooleanInput>(true, {
    transform: booleanAttribute,
    alias: 'protoAnchorTargetElementUseFixed',
  });

  /**
   * Whether to auto-hide when pressing Escape.
   */
  readonly autoHideOnEscape = input<boolean, BooleanInput>(true, {
    transform: booleanAttribute,
    alias: 'protoAnchorTargetElementAutoHideOnEscape',
  });

  // -------------------------------------------------------------------------
  // Computed Styles
  // -------------------------------------------------------------------------

  protected readonly positionStyle = computed(() => (this.useFixed() ? 'fixed' : 'absolute'));

  protected readonly anchorNameStyle = computed(() => {
    const explicitName = this.anchorName();
    if (explicitName) {
      return explicitName;
    }
    return this.anchorContext?.anchorName ?? null;
  });

  protected readonly positionAreaStyle = computed(() => {
    const placement = this.resolvedPlacement();
    return PLACEMENT_TO_POSITION_AREA[placement];
  });

  protected readonly resolvedPlacement = computed((): AnchorPlacement => {
    const inputPlacement = this.placement();
    if (inputPlacement !== undefined) {
      return inputPlacement;
    }
    return this.anchorContext?.placement() ?? 'bottom';
  });

  private readonly resolvedOffset = computed((): AnchorOffset => {
    const inputOffset = this.offset();
    if (inputOffset !== undefined) {
      return inputOffset;
    }
    return this.anchorContext?.offset() ?? { main: 0, cross: 0 };
  });

  protected readonly flipStyle = computed(() => {
    const inputFlip = this.flipBehavior();
    const flip = inputFlip ?? this.anchorContext?.flipBehavior() ?? 'flip-block';
    if (flip === 'none') {
      return null;
    }
    return flip;
  });

  protected readonly visibilityStyle = computed(() => {
    const inputVisibility = this.visibility();
    return inputVisibility ?? this.anchorContext?.visibility() ?? 'always';
  });

  protected readonly marginStyle = computed(() => {
    const offset = this.resolvedOffset();
    const placement = this.resolvedPlacement();

    if (offset.main === 0 && offset.cross === 0) {
      return null;
    }

    const mainPx = `${offset.main}px`;
    const crossPx = `${offset.cross}px`;

    const isTop = placement.startsWith('top');
    const isBottom = placement.startsWith('bottom');
    const isLeft = placement.startsWith('left');
    const isRight = placement.startsWith('right');

    if (isTop) {
      return `0 0 ${mainPx} ${crossPx}`;
    } else if (isBottom) {
      return `${mainPx} 0 0 ${crossPx}`;
    } else if (isLeft) {
      return `${crossPx} ${mainPx} 0 0`;
    } else if (isRight) {
      return `${crossPx} 0 0 ${mainPx}`;
    }

    return null;
  });

  protected onEscape(event: KeyboardEvent): void {
    if (!this.autoHideOnEscape() || event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.anchorContext?.close();
  }

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}

// ============================================================================
// ProtoAnchorArrow Directive
// ============================================================================

export interface ProtoAnchorArrowConfig {
  /**
   * Default width of the arrow.
   * @default 10
   */
  readonly defaultWidth: number;

  /**
   * Default height of the arrow.
   * @default 5
   */
  readonly defaultHeight: number;
}

const defaultArrowConfig: ProtoAnchorArrowConfig = {
  defaultWidth: 10,
  defaultHeight: 5,
};

const protoForAnchorArrow = createProto<ProtoAnchorArrow, ProtoAnchorArrowConfig>(
  defaultArrowConfig,
);

/**
 * Directive for rendering a pointing arrow on an anchor target.
 *
 * The arrow is positioned using CSS to point toward the anchor element.
 * It automatically adjusts its rotation based on the current placement.
 *
 * ## Data Attributes
 * - `data-anchor-arrow`: Always present
 * - `data-placement`: Current placement (inherited from parent)
 *
 * @example
 * ```html
 * <div *protoAnchorTarget="anchor">
 *   <div protoAnchorArrow></div>
 *   Content here
 * </div>
 * ```
 *
 * @example
 * ```css
 * [protoAnchorArrow] {
 *   position: absolute;
 *   width: 10px;
 *   height: 5px;
 *   background: white;
 *   clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
 * }
 *
 * [data-placement^="top"] [protoAnchorArrow] {
 *   bottom: -5px;
 *   transform: rotate(180deg);
 * }
 *
 * [data-placement^="bottom"] [protoAnchorArrow] {
 *   top: -5px;
 * }
 * ```
 */
@Directive({
  selector: '[protoAnchorArrow]',
  exportAs: 'protoAnchorArrow',
  host: {
    '[style.width.px]': 'width()',
    '[style.height.px]': 'height()',
    '[attr.data-anchor-arrow]': "''",
  },
  providers: [ProtoAnchorArrow.State.provide()],
})
export class ProtoAnchorArrow {
  private static readonly Proto = protoForAnchorArrow(ProtoAnchorArrow);
  static readonly State = ProtoAnchorArrow.Proto.state;
  static readonly Config = ProtoAnchorArrow.Proto.config;
  static readonly Hooks = ProtoAnchorArrow.Proto.hooks;

  private readonly config = ProtoAnchorArrow.Config.inject();

  /**
   * Width of the arrow in pixels.
   */
  readonly width = input<number, string | number>(this.config.defaultWidth, {
    transform: numberAttribute,
    alias: 'protoAnchorArrowWidth',
  });

  /**
   * Height of the arrow in pixels.
   */
  readonly height = input<number, string | number>(this.config.defaultHeight, {
    transform: numberAttribute,
    alias: 'protoAnchorArrowHeight',
  });

  readonly state = ProtoAnchorArrow.Proto(this);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets the opposite placement for a given placement.
 * Useful for implementing flip behavior.
 */
export function getOppositePlacement(placement: AnchorPlacement): AnchorPlacement {
  return OPPOSITE_PLACEMENT[placement];
}

/**
 * Gets the CSS position-area value for a placement.
 */
export function getPositionArea(placement: AnchorPlacement): string {
  return PLACEMENT_TO_POSITION_AREA[placement];
}

/**
 * Parses a placement string into its base direction and alignment.
 */
export function parsePlacement(placement: AnchorPlacement): {
  direction: 'top' | 'bottom' | 'left' | 'right';
  alignment: AnchorAlignment;
} {
  const parts = placement.split('-') as [string, string?];
  const direction = parts[0] as 'top' | 'bottom' | 'left' | 'right';
  const alignment = (parts[1] as AnchorAlignment) ?? 'center';
  return { direction, alignment };
}
