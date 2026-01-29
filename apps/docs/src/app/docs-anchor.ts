import {
  type AnchorPlacement,
  ProtoAnchor,
  ProtoAnchorArrow,
  ProtoAnchorTarget,
} from '@angular-proto/core/anchor';
import { ProtoHover } from '@angular-proto/core/hover';
import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';

// ============================================================================
// 1. Basic Tooltip Example
// ============================================================================

@Component({
  selector: 'docs-basic-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget, ProtoHover],
  template: `
    <h3>1. Basic Tooltip (Hover)</h3>
    <button
      #anchor="protoAnchor"
      #hover="protoHover"
      class="btn"
      protoAnchor
      protoHover
      [protoAnchorOpen]="hover.isHovered()"
      [protoAnchorPopupType]="null"
    >
      Hover me for tooltip
    </button>

    <div *protoAnchorTarget="anchor" class="tooltip" role="tooltip">
      This is a helpful tooltip message!
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #2563eb;
    }

    .tooltip {
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      max-width: 200px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  `,
})
export class DocsBasicTooltip {}

// ============================================================================
// 2. Dropdown Menu Example
// ============================================================================

@Component({
  selector: 'docs-dropdown-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget, ProtoAnchorArrow],
  template: `
    <h3>2. Dropdown Menu (Click)</h3>
    <button
      #anchor="protoAnchor"
      class="btn"
      protoAnchor
      [protoAnchorOffset]="{ main: 8, cross: 0 }"
      [protoAnchorPopupType]="'menu'"
      (click)="anchor.toggle()"
    >
      Open Menu
    </button>

    <div
      *protoAnchorTarget="anchor; autoHideOnClickOutside: true"
      aria-label="Actions menu"
      class="menu"
      role="menu"
    >
      <div class="arrow" protoAnchorArrow></div>
      <button class="menu-item" role="menuitem" (click)="anchor.close()">Edit</button>
      <button class="menu-item" role="menuitem" (click)="anchor.close()">Duplicate</button>
      <button class="menu-item" role="menuitem" (click)="anchor.close()">Archive</button>
      <hr class="divider" />
      <button class="menu-item menu-item--danger" role="menuitem" (click)="anchor.close()">
        Delete
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #2563eb;
    }

    .menu {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      min-width: 160px;
      padding: 4px 0;
    }

    .arrow {
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px;
      height: 5px;
      background: white;
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
      border-top: 1px solid #e5e7eb;
    }

    .menu-item {
      display: block;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: none;
      text-align: left;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .menu-item:hover {
      background: #f3f4f6;
    }

    .menu-item--danger {
      color: #dc2626;
    }

    .menu-item--danger:hover {
      background: #fef2f2;
    }

    .divider {
      margin: 4px 0;
      border: none;
      border-top: 1px solid #e5e7eb;
    }
  `,
})
export class DocsDropdownMenu {}

// ============================================================================
// 3. Popover Example
// ============================================================================

@Component({
  selector: 'docs-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <h3>3. Rich Content Popover</h3>
    <button
      #anchor="protoAnchor"
      class="btn"
      protoAnchor
      protoAnchorPlacement="right"
      [protoAnchorOffset]="{ main: 12, cross: 0 }"
      [protoAnchorPopupType]="'dialog'"
      (click)="anchor.toggle()"
    >
      Show Popover
    </button>

    <div
      *protoAnchorTarget="anchor; autoHideOnClickOutside: true"
      aria-label="User profile"
      class="popover"
      role="dialog"
    >
      <div class="popover-header">
        <div class="avatar">JD</div>
        <div>
          <div class="name">Jane Doe</div>
          <div class="email">jane.doe&#64;example.com</div>
        </div>
      </div>
      <div class="popover-content">
        <p>Senior Software Engineer at Acme Corp. Working on frontend infrastructure.</p>
      </div>
      <div class="popover-footer">
        <button class="btn-secondary" (click)="anchor.close()">View Profile</button>
        <button class="btn-primary" (click)="anchor.close()">Message</button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #2563eb;
    }

    .popover {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      width: 280px;
      overflow: hidden;
    }

    .popover-header {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #6366f1;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
    }

    .name {
      font-weight: 600;
      font-size: 15px;
    }

    .email {
      font-size: 13px;
      color: #6b7280;
    }

    .popover-content {
      padding: 16px;
    }

    .popover-content p {
      margin: 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
    }

    .popover-footer {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .btn-secondary {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
    }

    .btn-primary {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-primary:hover {
      background: #2563eb;
    }
  `,
})
export class DocsPopover {}

// ============================================================================
// 4. All Placements Example
// ============================================================================

@Component({
  selector: 'docs-all-placements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <h3>4. All 12 Placements</h3>
    <p class="description">Click a button to see that placement in action.</p>
    <div class="placements-grid">
      @for (placement of placements; track placement) {
        <button
          #anchor="protoAnchor"
          class="placement-btn"
          protoAnchor
          [protoAnchorOffset]="{ main: 8, cross: 0 }"
          [protoAnchorPlacement]="placement"
          (click)="anchor.toggle()"
        >
          {{ placement }}
        </button>

        <div *protoAnchorTarget="anchor" class="placement-tooltip">
          {{ placement }}
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .description {
      color: #6b7280;
      margin-bottom: 16px;
    }

    .placements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      max-width: 600px;
    }

    .placement-btn {
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      transition: all 0.15s;
    }

    .placement-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .placement-btn[data-anchor-open] {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
    }

    .placement-tooltip {
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }
  `,
})
export class DocsAllPlacements {
  readonly placements: AnchorPlacement[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end',
  ];
}

// ============================================================================
// 5. With Arrow Example
// ============================================================================

@Component({
  selector: 'docs-with-arrow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget, ProtoAnchorArrow],
  template: `
    <h3>5. Tooltip with Arrow</h3>
    <div class="demo-row">
      @for (placement of ['top', 'bottom', 'left', 'right']; track placement) {
        <button
          #anchor="protoAnchor"
          class="btn"
          protoAnchor
          [protoAnchorOffset]="{ main: 10, cross: 0 }"
          [protoAnchorPlacement]="$any(placement)"
          (click)="anchor.toggle()"
        >
          {{ placement }}
        </button>

        <div *protoAnchorTarget="anchor" class="tooltip-with-arrow" [attr.data-side]="placement">
          <div protoAnchorArrow [protoAnchorArrowHeight]="6" [protoAnchorArrowWidth]="12"></div>
          Arrow points {{ placement }}
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .demo-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #8b5cf6;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #7c3aed;
    }

    .tooltip-with-arrow {
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      position: relative;
    }

    [data-anchor-arrow] {
      position: absolute;
      background: #1f2937;
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    }

    [data-side='top'] [data-anchor-arrow] {
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(180deg);
    }

    [data-side='bottom'] [data-anchor-arrow] {
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
    }

    [data-side='left'] [data-anchor-arrow] {
      right: -6px;
      top: 50%;
      transform: translateY(-50%) rotate(90deg);
    }

    [data-side='right'] [data-anchor-arrow] {
      left: -6px;
      top: 50%;
      transform: translateY(-50%) rotate(-90deg);
    }
  `,
})
export class DocsWithArrow {}

// ============================================================================
// 6. Custom Offset Example
// ============================================================================

@Component({
  selector: 'docs-custom-offset',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <h3>6. Custom Offset Values</h3>
    <div class="demo-row">
      <div class="demo-item">
        <span class="label">No offset (0, 0)</span>
        <button
          #anchor1="protoAnchor"
          class="btn"
          protoAnchor
          [protoAnchorOffset]="{ main: 0, cross: 0 }"
          (click)="anchor1.toggle()"
        >
          Click me
        </button>
        <div *protoAnchorTarget="anchor1" class="offset-box">offset: 0</div>
      </div>

      <div class="demo-item">
        <span class="label">Main offset (16, 0)</span>
        <button
          #anchor2="protoAnchor"
          class="btn"
          protoAnchor
          [protoAnchorOffset]="{ main: 16, cross: 0 }"
          (click)="anchor2.toggle()"
        >
          Click me
        </button>
        <div *protoAnchorTarget="anchor2" class="offset-box">main: 16</div>
      </div>

      <div class="demo-item">
        <span class="label">Cross offset (8, 24)</span>
        <button
          #anchor3="protoAnchor"
          class="btn"
          protoAnchor
          [protoAnchorOffset]="{ main: 8, cross: 24 }"
          (click)="anchor3.toggle()"
        >
          Click me
        </button>
        <div *protoAnchorTarget="anchor3" class="offset-box">cross: 24</div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .demo-row {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .demo-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .label {
      font-size: 12px;
      color: #6b7280;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #10b981;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #059669;
    }

    .offset-box {
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-family: monospace;
    }
  `,
})
export class DocsCustomOffset {}

// ============================================================================
// 7. Flip Behavior Example
// ============================================================================

@Component({
  selector: 'docs-flip-behavior',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <h3>7. Auto-Flip on Viewport Edge</h3>
    <p class="description">
      The tooltip prefers 'top' placement but will automatically flip to 'bottom' when there's not
      enough space above.
    </p>
    <div class="flip-demo">
      <button
        #anchor="protoAnchor"
        class="btn"
        protoAnchor
        protoAnchorPlacement="top"
        [protoAnchorFlipBehavior]="'flip-block'"
        [protoAnchorOffset]="{ main: 8, cross: 0 }"
        (click)="anchor.toggle()"
      >
        Click to toggle (prefers top)
      </button>

      <div *protoAnchorTarget="anchor" class="flip-tooltip">I flip automatically when needed!</div>
    </div>
    <p class="hint">Try scrolling this button to the top of the viewport to see the flip.</p>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .description {
      color: #6b7280;
      margin-bottom: 16px;
    }

    .hint {
      color: #9ca3af;
      font-size: 13px;
      margin-top: 12px;
    }

    .flip-demo {
      padding: 20px 0;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #f59e0b;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #d97706;
    }

    .flip-tooltip {
      background: #1f2937;
      color: white;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
    }
  `,
})
export class DocsFlipBehavior {}

// ============================================================================
// 8. Nested Menus Example
// ============================================================================

@Component({
  selector: 'docs-nested-menus',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget, ProtoHover],
  template: `
    <h3>8. Nested Submenus</h3>
    <button
      #mainAnchor="protoAnchor"
      class="btn"
      protoAnchor
      [protoAnchorOffset]="{ main: 8, cross: 0 }"
      [protoAnchorPopupType]="'menu'"
      (click)="mainAnchor.toggle()"
    >
      File Menu
    </button>

    <div *protoAnchorTarget="mainAnchor; autoHideOnClickOutside: true" class="menu" role="menu">
      <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">New File</button>
      <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">Open...</button>

      <!-- Submenu trigger -->
      <button
        #subAnchor="protoAnchor"
        #subHover="protoHover"
        aria-haspopup="true"
        class="menu-item menu-item--submenu"
        protoAnchor
        protoAnchorPlacement="right-start"
        protoHover
        role="menuitem"
        [protoAnchorOffset]="{ main: 4, cross: 0 }"
        [protoAnchorOpen]="subHover.isHovered()"
        [protoAnchorPopupType]="'menu'"
      >
        Open Recent
        <span class="chevron">></span>
      </button>

      <!-- Submenu -->
      <div
        *protoAnchorTarget="subAnchor"
        class="menu submenu"
        role="menu"
        (mouseenter)="subAnchor.open()"
        (mouseleave)="subAnchor.close()"
      >
        <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">project.ts</button>
        <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">config.json</button>
        <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">README.md</button>
      </div>

      <hr class="divider" />
      <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">Save</button>
      <button class="menu-item" role="menuitem" (click)="mainAnchor.close()">Save As...</button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #2563eb;
    }

    .menu {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      min-width: 180px;
      padding: 4px 0;
    }

    .submenu {
      min-width: 160px;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: none;
      text-align: left;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .menu-item:hover {
      background: #f3f4f6;
    }

    .menu-item--submenu:hover {
      background: #eff6ff;
    }

    .chevron {
      color: #9ca3af;
      font-size: 12px;
    }

    .divider {
      margin: 4px 0;
      border: none;
      border-top: 1px solid #e5e7eb;
    }
  `,
})
export class DocsNestedMenus {}

// ============================================================================
// 9. Programmatic Control Example
// ============================================================================

@Component({
  selector: 'docs-programmatic-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget],
  template: `
    <h3>9. Programmatic Control</h3>
    <p class="description">Control the anchor state with signals and methods.</p>

    <div class="control-panel">
      <button class="control-btn" (click)="anchor().open()">Open</button>
      <button class="control-btn" (click)="anchor().close()">Close</button>
      <button class="control-btn" (click)="anchor().toggle()">Toggle</button>
      <span class="status">Status: {{ anchor().isOpen() ? 'Open' : 'Closed' }}</span>
    </div>

    <div class="demo-area">
      <button
        #anchorRef="protoAnchor"
        class="target-btn"
        protoAnchor
        [protoAnchorOffset]="{ main: 8, cross: 0 }"
      >
        Anchor Element
      </button>

      <div *protoAnchorTarget="anchorRef" class="controlled-popup">
        This popup is controlled programmatically!
        <br />
        <small>Use the buttons above to open/close.</small>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .description {
      color: #6b7280;
      margin-bottom: 16px;
    }

    .control-panel {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 20px;
      padding: 12px;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .control-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      transition: all 0.15s;
    }

    .control-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .status {
      margin-left: auto;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .demo-area {
      padding: 20px 0;
    }

    .target-btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      background: #fafafa;
      color: #6b7280;
      cursor: default;
    }

    .target-btn[data-anchor-open] {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
    }

    .controlled-popup {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      line-height: 1.5;
    }

    .controlled-popup small {
      color: #6b7280;
    }
  `,
})
export class DocsProgrammaticControl {
  readonly anchor = viewChild.required<ProtoAnchor>('anchorRef');
}

// ============================================================================
// 10. Accessibility Example
// ============================================================================

@Component({
  selector: 'docs-accessibility',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProtoAnchor, ProtoAnchorTarget, ProtoHover],
  template: `
    <h3>10. Accessibility Patterns</h3>
    <p class="description">Different ARIA patterns for tooltips, menus, and dialogs.</p>

    <div class="demo-row">
      <!-- Tooltip pattern (no role on trigger, role=tooltip on content) -->
      <div class="demo-item">
        <span class="label">Tooltip (hover)</span>
        <button
          #tooltipAnchor="protoAnchor"
          #tooltipHover="protoHover"
          aria-describedby="tooltip-content"
          class="btn"
          protoAnchor
          protoHover
          [protoAnchorOffset]="{ main: 8, cross: 0 }"
          [protoAnchorOpen]="tooltipHover.isHovered()"
          [protoAnchorPopupType]="null"
        >
          Hover me
        </button>

        <div *protoAnchorTarget="tooltipAnchor" class="tooltip" id="tooltip-content" role="tooltip">
          This is a helpful tooltip
        </div>
      </div>

      <!-- Menu pattern (aria-haspopup=menu, role=menu) -->
      <div class="demo-item">
        <span class="label">Menu (click)</span>
        <button
          #menuAnchor="protoAnchor"
          class="btn"
          protoAnchor
          [protoAnchorOffset]="{ main: 8, cross: 0 }"
          [protoAnchorPopupType]="'menu'"
          (click)="menuAnchor.toggle()"
        >
          Options
        </button>

        <div
          *protoAnchorTarget="menuAnchor; autoHideOnClickOutside: true"
          aria-label="Options menu"
          class="menu"
          role="menu"
        >
          <button class="menu-item" role="menuitem" (click)="menuAnchor.close()">Edit</button>
          <button class="menu-item" role="menuitem" (click)="menuAnchor.close()">Delete</button>
        </div>
      </div>

      <!-- Dialog pattern (aria-haspopup=dialog, role=dialog) -->
      <div class="demo-item">
        <span class="label">Dialog (click)</span>
        <button
          #dialogAnchor="protoAnchor"
          class="btn"
          protoAnchor
          protoAnchorPlacement="right"
          [protoAnchorOffset]="{ main: 8, cross: 0 }"
          [protoAnchorPopupType]="'dialog'"
          (click)="dialogAnchor.toggle()"
        >
          More Info
        </button>

        <div
          *protoAnchorTarget="dialogAnchor; autoHideOnClickOutside: true"
          aria-label="Additional information"
          aria-modal="false"
          class="dialog"
          role="dialog"
        >
          <h4 class="dialog-title">Information</h4>
          <p class="dialog-content">This is a non-modal dialog pattern.</p>
          <button class="dialog-close" (click)="dialogAnchor.close()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 32px;
    }

    .description {
      color: #6b7280;
      margin-bottom: 16px;
    }

    .demo-row {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .demo-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .label {
      font-size: 12px;
      color: #6b7280;
    }

    .btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      background: #6366f1;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #4f46e5;
    }

    .tooltip {
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
    }

    .menu {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      min-width: 120px;
      padding: 4px 0;
    }

    .menu-item {
      display: block;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: none;
      text-align: left;
      font-size: 14px;
      cursor: pointer;
    }

    .menu-item:hover {
      background: #f3f4f6;
    }

    .dialog {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      padding: 16px;
      width: 200px;
    }

    .dialog-title {
      margin: 0 0 8px;
      font-size: 15px;
      font-weight: 600;
    }

    .dialog-content {
      margin: 0 0 12px;
      font-size: 13px;
      color: #6b7280;
    }

    .dialog-close {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      font-size: 12px;
      cursor: pointer;
    }

    .dialog-close:hover {
      background: #f3f4f6;
    }
  `,
})
export class DocsAccessibility {}

// ============================================================================
// Main Documentation Page
// ============================================================================

@Component({
  selector: 'docs-anchor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsBasicTooltip,
    DocsDropdownMenu,
    DocsPopover,
    DocsAllPlacements,
    DocsWithArrow,
    DocsCustomOffset,
    DocsFlipBehavior,
    DocsNestedMenus,
    DocsProgrammaticControl,
    DocsAccessibility,
  ],
  template: `
    <div class="container">
      <h1>CSS Anchor Positioning Examples</h1>
      <p class="intro">
        These examples demonstrate the ProtoAnchor system using native CSS anchor positioning. All
        positioning is handled by the browser's CSS engine - no JavaScript calculations required.
      </p>

      <docs-basic-tooltip />
      <docs-dropdown-menu />
      <docs-popover />
      <docs-all-placements />
      <docs-with-arrow />
      <docs-custom-offset />
      <docs-flip-behavior />
      <docs-nested-menus />
      <docs-programmatic-control />
      <docs-accessibility />
    </div>
  `,
  styles: `
    :host {
      display: block;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      line-height: 1.5;
      color: #1f2937;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px;
    }

    .intro {
      font-size: 16px;
      color: #6b7280;
      margin: 0 0 40px;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    :host > :first-child h3 {
      border-top: none;
      padding-top: 0;
    }
  `,
})
export class DocsAnchor {}
