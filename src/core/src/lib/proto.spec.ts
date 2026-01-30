/**
 * Proto System Tests
 *
 * This file tests the core proto system functionality. Tests are organized into sections:
 *
 * 1. Basic State Management - ProtoState, controlled signals, immutability
 * 2. Ancestry - Parent/ancestor lookup, ancestry chains, type-safe lookups
 * 3. Inject Helpers - injectProtoAncestor, injectProtoParent
 * 4. Hooks - Hook registration, execution timing, afterNextRender support
 * 5. Config - Default config, custom config, config injection
 * 6. Config Hierarchy - Multi-level config inheritance via hostDirectives
 * 7. State Inheritance - Parent-child state propagation via hooks
 *
 * Each section has its own test fixtures (directives/components) to isolate concerns.
 * The file is intentionally kept as a single file because:
 * - Tests are well-organized with describe blocks
 * - Fixtures are section-specific and would need duplication if split
 * - The file size (~730 lines) is manageable
 */
import type { BooleanInput } from '@angular/cdk/coercion';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { render } from '@testing-library/angular';
import { createProto } from './proto';
import { injectProtoAncestor, injectProtoParent } from './proto-ancestry';

describe('createProto', () => {
  describe('basic state management', () => {
    const protoForDir = createProto<Dir>();

    @Directive({
      selector: '[dir]',
      exportAs: 'dir',
      providers: [Dir.State.provide()],
    })
    class Dir {
      private static readonly Proto = protoForDir(Dir);
      static readonly State = Dir.Proto.state;
      static readonly Hooks = Dir.Proto.hooks;

      readonly disabled = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
      readonly enabled = computed(() => !this.disabled());
      readonly state = Dir.Proto(this);
    }

    const protoForComp = createProto<Comp>();

    @Component({
      selector: 'test-comp',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [Dir],
      providers: [Comp.State.provide()],
      template: `
        <div #dir1="dir" dir [disabled]="dir1Disabled()">
          <div #dir2="dir" dir [disabled]="dir2Disabled()"></div>
        </div>
      `,
    })
    class Comp {
      private static readonly Proto = protoForComp(Comp);
      static readonly State = Comp.Proto.state;
      static readonly Hooks = Comp.Proto.hooks;

      readonly dir1 = viewChild.required('dir1', { read: Dir });
      readonly dir1State = computed(() => this.dir1().state());
      readonly dir1Disabled = signal(false);

      readonly dir2 = viewChild.required('dir2', { read: Dir });
      readonly dir2State = computed(() => this.dir2().state());
      readonly dir2Disabled = signal(false);

      readonly compState = Comp.Proto(this);
    }

    it('should have correct controlled signal values', async () => {
      const { fixture } = await render(Comp);
      const { dir1, dir1State, dir1Disabled, dir2, dir2State, dir2Disabled, compState } =
        fixture.componentInstance;

      expect(dir1().disabled()).toBe(false);
      expect(dir1State().disabled()).toBe(false);
      expect(dir1State().disabled.isControlled()).toBe(false);
      expect(dir1State().disabled.controlValue()).toBe(false);
      expect(dir1State().disabled.templateValue()).toBe(false);
      expect(dir2().disabled()).toBe(false);
      expect(dir2State().disabled()).toBe(false);
      expect(dir2State().disabled.isControlled()).toBe(false);
      expect(dir2State().disabled.controlValue()).toBe(false);
      expect(dir2State().disabled.templateValue()).toBe(false);
      expect(dir2Disabled()).toBe(false);
      expect(compState().dir1Disabled()).toBe(false);

      dir1Disabled.set(true);
      fixture.detectChanges();

      expect(dir1().disabled()).toBe(true);
      expect(dir1State().disabled()).toBe(true);
      expect(dir1State().disabled.isControlled()).toBe(false);
      expect(dir1State().disabled.controlValue()).toBe(false);
      expect(dir1State().disabled.templateValue()).toBe(true);
      expect(dir2().disabled()).toBe(false);
      expect(dir2State().disabled()).toBe(false);
      expect(dir2State().disabled.isControlled()).toBe(false);
      expect(dir2State().disabled.controlValue()).toBe(false);
      expect(dir2State().disabled.templateValue()).toBe(false);
      expect(dir2Disabled()).toBe(false);
      expect(compState().dir1Disabled()).toBe(true);

      dir1State().disabled.control(false);
      fixture.detectChanges();

      expect(dir1().disabled()).toBe(false);
      expect(dir1State().disabled()).toBe(false);
      expect(dir1State().disabled.isControlled()).toBe(true);
      expect(dir1State().disabled.controlValue()).toBe(false);
      expect(dir1State().disabled.templateValue()).toBe(true);
      expect(dir2().disabled()).toBe(false);
      expect(dir2State().disabled()).toBe(false);
      expect(dir2State().disabled.isControlled()).toBe(false);
      expect(dir2State().disabled.controlValue()).toBe(false);
      expect(dir2State().disabled.templateValue()).toBe(false);
      expect(dir2Disabled()).toBe(false);
      expect(compState().dir1Disabled()).toBe(true);

      compState().dir1Disabled.set(false);
      fixture.detectChanges();

      expect(dir1().disabled()).toBe(false);
      expect(dir1State().disabled()).toBe(false);
      expect(dir1State().disabled.isControlled()).toBe(false);
      expect(dir1State().disabled.controlValue()).toBe(false);
      expect(dir1State().disabled.templateValue()).toBe(false);
      expect(dir2().disabled()).toBe(false);
      expect(dir2State().disabled()).toBe(false);
      expect(dir2State().disabled.isControlled()).toBe(false);
      expect(dir2State().disabled.controlValue()).toBe(false);
      expect(dir2State().disabled.templateValue()).toBe(false);
      expect(dir2Disabled()).toBe(false);
      expect(compState().dir1Disabled()).toBe(false);

      compState().dir1Disabled.set(true);
      fixture.detectChanges();

      expect(dir1().disabled()).toBe(true);
      expect(dir1State().disabled()).toBe(true);
      expect(dir1State().disabled.isControlled()).toBe(false);
      expect(dir1State().disabled.controlValue()).toBe(false);
      expect(dir1State().disabled.templateValue()).toBe(true);
      expect(dir2().disabled()).toBe(false);
      expect(dir2State().disabled()).toBe(false);
      expect(dir2State().disabled.isControlled()).toBe(false);
      expect(dir2State().disabled.controlValue()).toBe(false);
      expect(dir2State().disabled.templateValue()).toBe(false);
      expect(dir2Disabled()).toBe(false);
      expect(compState().dir1Disabled()).toBe(true);
    });

    it('should expose protoName on the state', async () => {
      const { fixture } = await render(Comp);
      const { dir1 } = fixture.componentInstance;

      expect(dir1().state.protoName).toBe('Dir');
    });

    it('should not be able to mutate state after initState', async () => {
      const { fixture } = await render(Comp);
      const { dir1 } = fixture.componentInstance;

      expect(dir1().state).not.toHaveProperty('set');
      expect(dir1().state).not.toHaveProperty('update');
    });
  });

  describe('ancestry', () => {
    const protoForParent = createProto<ParentDir>();

    @Directive({
      selector: '[parent]',
      exportAs: 'parent',
      providers: [ParentDir.State.provide()],
    })
    class ParentDir {
      private static readonly Proto = protoForParent(ParentDir);
      static readonly State = ParentDir.Proto.state;
      static readonly Hooks = ParentDir.Proto.hooks;

      readonly value = input<string>('parent');
      readonly state = ParentDir.Proto(this);
    }

    const protoForChild = createProto<ChildDir>();

    @Directive({
      selector: '[child]',
      exportAs: 'child',
      providers: [ChildDir.State.provide()],
    })
    class ChildDir {
      private static readonly Proto = protoForChild(ChildDir);
      static readonly State = ChildDir.Proto.state;
      static readonly Hooks = ChildDir.Proto.hooks;

      readonly value = input<string>('child');
      readonly state = ChildDir.Proto(this);
    }

    @Component({
      selector: 'test-ancestry',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [ParentDir, ChildDir],
      template: `
        <div #p1="parent" parent value="p1">
          <div #p2="parent" parent value="p2">
            <div #c1="child" child value="c1">
              <div #p3="parent" parent value="p3">
                <div #c2="child" child value="c2"></div>
              </div>
            </div>
          </div>
        </div>
      `,
    })
    class TestAncestryComp {
      readonly p1 = viewChild.required('p1', { read: ParentDir });
      readonly p2 = viewChild.required('p2', { read: ParentDir });
      readonly p3 = viewChild.required('p3', { read: ParentDir });
      readonly c1 = viewChild.required('c1', { read: ChildDir });
      readonly c2 = viewChild.required('c2', { read: ChildDir });
    }

    it('ancestry.all() should return all ancestors (nearest first)', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { p1, p2, p3, c1, c2 } = fixture.componentInstance;

      // p1 has no ancestors
      expect(p1().state.ancestry.allAncestors()).toEqual([]);

      // p2's ancestors are [p1]
      const p2All = p2().state.ancestry.allAncestors();
      expect(p2All.length).toBe(1);
      expect(p2All[0].state).toBe(p1().state);

      // c1's ancestors are [p2, p1] (nearest first)
      const c1All = c1().state.ancestry.allAncestors();
      expect(c1All.length).toBe(2);
      expect(c1All[0].state).toBe(p2().state);
      expect(c1All[1].state).toBe(p1().state);

      // p3's ancestors are [c1, p2, p1]
      const p3All = p3().state.ancestry.allAncestors();
      expect(p3All.length).toBe(3);
      expect(p3All[0].state).toBe(c1().state);
      expect(p3All[1].state).toBe(p2().state);
      expect(p3All[2].state).toBe(p1().state);

      // c2's ancestors are [p3, c1, p2, p1]
      const c2All = c2().state.ancestry.allAncestors();
      expect(c2All.length).toBe(4);
      expect(c2All[0].state).toBe(p3().state);
      expect(c2All[1].state).toBe(c1().state);
      expect(c2All[2].state).toBe(p2().state);
      expect(c2All[3].state).toBe(p1().state);
    });

    it('ancestry.parent should return immediate parent of same type', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { p1, p2, p3, c1, c2 } = fixture.componentInstance;

      // p1 has no parent of same type
      expect(p1().state.ancestry.parent).toBeNull();

      // p2's parent of same type is p1
      expect(p2().state.ancestry.parent?.state).toBe(p1().state);

      // p3's parent of same type is p2 (not c1, which is a different type)
      expect(p3().state.ancestry.parent?.state).toBe(p2().state);

      // c1 has no parent of same type (Child)
      expect(c1().state.ancestry.parent).toBeNull();

      // c2's parent of same type is c1
      expect(c2().state.ancestry.parent?.state).toBe(c1().state);
    });

    it('ancestry.parentOfType(token) should find immediate parent of given type with type safety', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { p1, p2, c2 } = fixture.componentInstance;

      // c2 can find p3 by ParentDir.State.token (gets nearest)
      const foundParent = c2().state.ancestry.parentOfType(ParentDir.State.token);
      expect(foundParent).not.toBeNull();
      // Type-safe: foundParent.state() has proper type
      expect(foundParent?.state().value()).toBe('p3');

      // c2 can find c1 by ChildDir.State.token
      const foundChild = c2().state.ancestry.parentOfType(ChildDir.State.token);
      expect(foundChild).not.toBeNull();
      expect(foundChild?.state).toBe(fixture.componentInstance.c1().state);

      // p1 cannot find any ParentDir ancestor
      expect(p1().state.ancestry.parentOfType(ParentDir.State.token)).toBeNull();

      // p2 can find p1
      const p2FoundParent = p2().state.ancestry.parentOfType(ParentDir.State.token);
      expect(p2FoundParent?.state).toBe(p1().state);
    });

    it('ancestry.ancestors() should return all ancestors of same type', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { p1, p2, p3, c1, c2 } = fixture.componentInstance;

      // p1 has no ancestors of same type
      expect(p1().state.ancestry.ancestors()).toEqual([]);

      // p2's ancestors of same type are [p1]
      const p2Ancestors = p2().state.ancestry.ancestors();
      expect(p2Ancestors.length).toBe(1);
      expect(p2Ancestors[0].state).toBe(p1().state);

      // p3's ancestors of same type are [p2, p1] (nearest first)
      const p3Ancestors = p3().state.ancestry.ancestors();
      expect(p3Ancestors.length).toBe(2);
      expect(p3Ancestors[0].state).toBe(p2().state);
      expect(p3Ancestors[1].state).toBe(p1().state);

      // c1 has no ancestors of same type
      expect(c1().state.ancestry.ancestors()).toEqual([]);

      // c2's ancestors of same type are [c1]
      const c2Ancestors = c2().state.ancestry.ancestors();
      expect(c2Ancestors.length).toBe(1);
      expect(c2Ancestors[0].state).toBe(c1().state);
    });

    it('ancestry.ancestorsOfType(token) should return all ancestors of given type', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { p1, p2, p3, c2 } = fixture.componentInstance;

      // c2's Parent ancestors are [p3, p2, p1] (nearest first)
      const c2ParentAncestors = c2().state.ancestry.ancestorsOfType(ParentDir.State.token);
      expect(c2ParentAncestors.length).toBe(3);
      expect(c2ParentAncestors[0].state).toBe(p3().state);
      expect(c2ParentAncestors[1].state).toBe(p2().state);
      expect(c2ParentAncestors[2].state).toBe(p1().state);

      // p1 has no Parent ancestors
      expect(p1().state.ancestry.ancestorsOfType(ParentDir.State.token)).toEqual([]);
    });

    it('ancestry.all() with predicate should filter ancestors', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { c2 } = fixture.componentInstance;

      // Filter by name using predicate
      const parentAncestors = c2().state.ancestry.allAncestors(
        e => e.state.protoName === 'ParentDir',
      );
      expect(parentAncestors.length).toBe(3);

      const childAncestors = c2().state.ancestry.allAncestors(
        e => e.state.protoName === 'ChildDir',
      );
      expect(childAncestors.length).toBe(1);
    });

    it('ancestry.ancestors() with predicate should filter same-type ancestors', async () => {
      const { fixture } = await render(TestAncestryComp);
      const { p1, p3 } = fixture.componentInstance;

      // p3's ancestors filtered by value
      const filtered = p3().state.ancestry.ancestors(e => e.state().value() === 'p1');
      expect(filtered.length).toBe(1);
      expect(filtered[0].state).toBe(p1().state);
    });
  });

  describe('children', () => {
    const protoForParent = createProto<ParentDir>();

    @Directive({
      selector: '[parent]',
      exportAs: 'parent',
      providers: [ParentDir.State.provide()],
    })
    class ParentDir {
      private static readonly Proto = protoForParent(ParentDir);
      static readonly State = ParentDir.Proto.state;
      static readonly Hooks = ParentDir.Proto.hooks;

      readonly value = input<string>('parent');
      readonly state = ParentDir.Proto(this);
    }

    const protoForChild = createProto<ChildDir>();

    @Directive({
      selector: '[child]',
      exportAs: 'child',
      providers: [ChildDir.State.provide()],
    })
    class ChildDir {
      private static readonly Proto = protoForChild(ChildDir);
      static readonly State = ChildDir.Proto.state;
      static readonly Hooks = ChildDir.Proto.hooks;

      readonly value = input<string>('child');
      readonly state = ChildDir.Proto(this);
    }

    @Component({
      selector: 'test-children',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [ParentDir, ChildDir],
      template: `
        <div #p1="parent" parent value="p1">
          <div #p2="parent" parent value="p2">
            <div #c1="child" child value="c1"></div>
            <div #p3="parent" parent value="p3"></div>
          </div>
          @if (showChildren()) {
            <div #c2="child" child value="c2">
              <div #p4="parent" parent value="p4"></div>
            </div>
          }
        </div>
      `,
    })
    class TestChildrenComp {
      readonly p1 = viewChild.required('p1', { read: ParentDir });
      readonly p2 = viewChild.required('p2', { read: ParentDir });
      readonly p3 = viewChild.required('p3', { read: ParentDir });
      readonly p4 = viewChild.required('p4', { read: ParentDir });
      readonly c1 = viewChild.required('c1', { read: ChildDir });
      readonly c2 = viewChild.required('c2', { read: ChildDir });
      readonly showChildren = signal(true);
    }

    it('ancestry.children should return all descendants of same proto type', async () => {
      const { fixture } = await render(TestChildrenComp);
      const { p1, p2, p3, p4, c1, c2 } = fixture.componentInstance;

      // p1's children of same type (ParentDir) are all ParentDir descendants: [p2, p3, p4]
      let p1Children = p1().state.ancestry.children();
      expect(p1Children.length).toBe(3);
      expect(p1Children[0].state).toBe(p2().state);
      expect(p1Children[1].state).toBe(p3().state);
      expect(p1Children[2].state).toBe(p4().state);

      // p2's children of same type are [p3] (p4 is not a descendant of p2)
      const p2Children = p2().state.ancestry.children();
      expect(p2Children.length).toBe(1);
      expect(p2Children[0].state).toBe(p3().state);

      // p3 has no children of same type
      expect(p3().state.ancestry.children()).toEqual([]);

      // p4 has no children of same type
      expect(p4().state.ancestry.children()).toEqual([]);

      // c1 has no children of same type
      expect(c1().state.ancestry.children()).toEqual([]);

      // c2 has no children of same type (p4 is different type)
      expect(c2().state.ancestry.children()).toEqual([]);

      // Toggle children to verify reactive behavior
      fixture.componentInstance.showChildren.set(false);
      fixture.detectChanges();

      // p1's children of same type (ParentDir) are [p2, p3, p4]
      p1Children = p1().state.ancestry.children();
      expect(p1Children.length).toBe(2);
      expect(p1Children[0].state).toBe(p2().state);
      expect(p1Children[1].state).toBe(p3().state);

      const p1All = p1().state.ancestry.allChildren()();
      expect(p1All.length).toBe(3);
      expect(p1All[0].state).toBe(p2().state);
      expect(p1All[1].state).toBe(c1().state);
      expect(p1All[2].state).toBe(p3().state);
    });

    it('ancestry.childrenOfType(token) should return all descendants of given proto type', async () => {
      const { fixture } = await render(TestChildrenComp);
      const { p1, p2, p3, c1, c2 } = fixture.componentInstance;

      // p1's ChildDir descendants are [c1, c2] (all ChildDir descendants)
      const p1ChildChildren = p1().state.ancestry.childrenOfType(ChildDir.State.token)();
      expect(p1ChildChildren.length).toBe(2);
      expect(p1ChildChildren[0].state).toBe(c1().state);
      expect(p1ChildChildren[1].state).toBe(c2().state);

      // p2's ChildDir descendants are [c1] only (c2 is not under p2)
      const p2ChildChildren = p2().state.ancestry.childrenOfType(ChildDir.State.token)();
      expect(p2ChildChildren.length).toBe(1);
      expect(p2ChildChildren[0].state).toBe(c1().state);

      // p3 has no ChildDir descendants
      const p3ChildChildren = p3().state.ancestry.childrenOfType(ChildDir.State.token)();
      expect(p3ChildChildren.length).toBe(0);

      // c2's ParentDir descendants are [p4]
      const c2ParentChildren = c2().state.ancestry.childrenOfType(ParentDir.State.token)();
      expect(c2ParentChildren.length).toBe(1);
      expect(c2ParentChildren[0].state).toBe(fixture.componentInstance.p4().state);
    });

    it('ancestry.allChildren() should return all descendants regardless of type', async () => {
      const { fixture } = await render(TestChildrenComp);
      const { p1, p2, p3, p4, c1, c2 } = fixture.componentInstance;

      // p1's all descendants are [p2, c1, p3, c2, p4] (5 total)
      const p1AllChildren = p1().state.ancestry.allChildren()();
      expect(p1AllChildren.length).toBe(5);
      expect(p1AllChildren[0].state).toBe(p2().state);
      expect(p1AllChildren[1].state).toBe(c1().state);
      expect(p1AllChildren[2].state).toBe(p3().state);
      expect(p1AllChildren[3].state).toBe(c2().state);
      expect(p1AllChildren[4].state).toBe(p4().state);

      // p2's all descendants are [c1, p3]
      const p2AllChildren = p2().state.ancestry.allChildren()();
      expect(p2AllChildren.length).toBe(2);
      expect(p2AllChildren[0].state).toBe(c1().state);
      expect(p2AllChildren[1].state).toBe(p3().state);

      // p3 has no descendants
      expect(p3().state.ancestry.allChildren()()).toEqual([]);

      // c1 has no descendants
      expect(c1().state.ancestry.allChildren()()).toEqual([]);

      // c2's all descendants are [p4]
      const c2AllChildren = c2().state.ancestry.allChildren()();
      expect(c2AllChildren.length).toBe(1);
      expect(c2AllChildren[0].state).toBe(p4().state);
    });

    it('childrenOfType should return cached signal for same token', async () => {
      const { fixture } = await render(TestChildrenComp);
      const { p1, c1, c2 } = fixture.componentInstance;

      // Get childrenOfType signal twice with same token
      const signal1 = p1().state.ancestry.childrenOfType(ChildDir.State.token);
      const signal2 = p1().state.ancestry.childrenOfType(ChildDir.State.token);

      // Should return the exact same signal instance (cached)
      expect(signal1).toBe(signal2);

      // The signal should still work correctly
      const children = signal1();
      expect(children.length).toBe(2);
      expect(children[0].state).toBe(c1().state);
      expect(children[1].state).toBe(c2().state);
    });

    it('ancestry.children should be reactive (signal)', async () => {
      // Create a simple test to verify children is a reactive signal
      const { fixture } = await render(TestChildrenComp);
      const { p1 } = fixture.componentInstance;

      // Verify children is a signal (can be called as a function)
      const childrenSignal = p1().state.ancestry.children;
      expect(typeof childrenSignal).toBe('function');

      // Get the current value
      const children = childrenSignal();
      expect(Array.isArray(children)).toBe(true);
    });
  });

  describe('injectAncestorState', () => {
    const protoForOuter = createProto<OuterDir>();

    @Directive({
      selector: '[outer]',
      providers: [OuterDir.State.provide()],
    })
    class OuterDir {
      private static readonly Proto = protoForOuter(OuterDir);
      static readonly State = OuterDir.Proto.state;
      static readonly Hooks = OuterDir.Proto.hooks;

      readonly value = input<string>('outer');
      readonly state = OuterDir.Proto(this);
    }

    const protoForInner = createProto<InnerDir>();

    @Directive({
      selector: '[inner]',
      providers: [InnerDir.State.provide()],
    })
    class InnerDir {
      private static readonly Proto = protoForInner(InnerDir);
      static readonly State = InnerDir.Proto.state;
      static readonly Hooks = InnerDir.Proto.hooks;

      readonly outerState = injectProtoAncestor(OuterDir.State.token);
      readonly state = InnerDir.Proto(this);
    }

    @Component({
      selector: 'test-inject-ancestor',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [OuterDir, InnerDir],
      template: `
        <div outer value="test-outer">
          <div #inner inner></div>
        </div>
      `,
    })
    class TestInjectAncestorComp {
      readonly inner = viewChild.required('inner', { read: InnerDir });
    }

    it('should inject ancestor state', async () => {
      const { fixture } = await render(TestInjectAncestorComp);
      const inner = fixture.componentInstance.inner();

      expect(inner.outerState).not.toBeNull();
      expect(inner.outerState().value()).toBe('test-outer');
    });
  });

  describe('injectParentState', () => {
    const protoForItem = createProto<ItemDir>();

    @Directive({
      selector: '[item]',
      providers: [ItemDir.State.provide()],
    })
    class ItemDir {
      private static readonly Proto = protoForItem(ItemDir);
      static readonly State = ItemDir.Proto.state;
      static readonly Hooks = ItemDir.Proto.hooks;

      readonly parentItem = injectProtoParent(ItemDir.State.token, { optional: true });
      readonly value = input<string>('item');
      readonly state = ItemDir.Proto(this);
    }

    @Component({
      selector: 'test-inject-parent',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [ItemDir],
      template: `
        <div #item1 item value="first">
          <div #item2 item value="second">
            <div #item3 item value="third"></div>
          </div>
        </div>
      `,
    })
    class TestInjectParentComp {
      readonly item1 = viewChild.required('item1', { read: ItemDir });
      readonly item2 = viewChild.required('item2', { read: ItemDir });
      readonly item3 = viewChild.required('item3', { read: ItemDir });
    }

    it('should inject parent state of same type', async () => {
      const { fixture } = await render(TestInjectParentComp);
      const { item1, item2, item3 } = fixture.componentInstance;

      // item1 has no parent
      expect(item1().parentItem).toBeNull();

      // item2's parent is item1
      expect(item2().parentItem).not.toBeNull();
      expect(item2().parentItem?.().value()).toBe('first');

      // item3's parent is item2
      expect(item3().parentItem).not.toBeNull();
      expect(item3().parentItem?.().value()).toBe('second');
    });
  });

  describe('hooks', () => {
    interface TestHookConfig {
      hookValue?: string;
    }

    const protoForHook = createProto<HookDir, TestHookConfig>({ hookValue: 'default' });

    let hookCalls: string[] = [];
    let afterRenderCalls: string[] = [];

    @Directive({
      selector: '[hook]',
      providers: [
        HookDir.State.provide(),
        HookDir.Hooks.provide(
          state => {
            // Simple synchronous hook
            hookCalls.push(`hook:${state.protoName}:${state.config.hookValue}`);
          },
          state => {
            // Hook that schedules afterNextRender
            afterNextRender(() => {
              afterRenderCalls.push(`afterRender:${state.protoName}:${state.config.hookValue}`);
            });
          },
        ),
      ],
    })
    class HookDir {
      private static readonly Proto = protoForHook(HookDir);
      static readonly State = HookDir.Proto.state;
      static readonly Config = HookDir.Proto.config;
      static readonly Hooks = HookDir.Proto.hooks;

      readonly value = input<string>('hook');
      readonly state = HookDir.Proto(this);
    }

    @Component({
      selector: 'test-hooks',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [HookDir],
      providers: [HookDir.Config.provide({ hookValue: 'custom' })],
      template: `
        <div #hook hook></div>
      `,
    })
    class TestHooksComp {
      readonly hook = viewChild.required('hook', { read: HookDir });
    }

    beforeEach(() => {
      hookCalls = [];
      afterRenderCalls = [];
    });

    it('should call hook synchronously (before state is set)', async () => {
      // Hooks run synchronously during set(), no async waiting needed
      await render(TestHooksComp);

      expect(hookCalls).toContain('hook:HookDir:custom');
    });

    it('should allow hooks to schedule afterNextRender', async () => {
      const { fixture } = await render(TestHooksComp);
      fixture.detectChanges();

      // afterRender is called via afterNextRender
      await fixture.whenStable();

      expect(afterRenderCalls).toContain('afterRender:HookDir:custom');
    });
  });

  describe('config', () => {
    interface CounterConfig {
      min: number;
      max: number;
    }

    const protoForCounter = createProto<CounterDir, CounterConfig>({
      min: 0,
      max: 100,
    });

    @Directive({
      selector: '[counter]',
      providers: [CounterDir.State.provide()],
    })
    class CounterDir {
      private static readonly Proto = protoForCounter(CounterDir);
      static readonly State = CounterDir.Proto.state;
      static readonly Config = CounterDir.Proto.config;
      static readonly Hooks = CounterDir.Proto.hooks;

      readonly config = CounterDir.Config.inject();
      readonly state = CounterDir.Proto(this);
    }

    @Component({
      selector: 'test-config',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [CounterDir],
      template: `
        <div #counter counter></div>
      `,
    })
    class TestDefaultConfigComp {
      readonly counter = viewChild.required('counter', { read: CounterDir });
    }

    @Component({
      selector: 'test-custom-config',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [CounterDir],
      providers: [CounterDir.Config.provide({ min: 10, max: 50 })],
      template: `
        <div #counter counter></div>
      `,
    })
    class TestCustomConfigComp {
      readonly counter = viewChild.required('counter', { read: CounterDir });
    }

    it('should use default config when none provided', async () => {
      const { fixture } = await render(TestDefaultConfigComp);
      const counter = fixture.componentInstance.counter();

      expect(counter.config.min).toBe(0);
      expect(counter.config.max).toBe(100);
    });

    it('should use custom config when provided', async () => {
      const { fixture } = await render(TestCustomConfigComp);
      const counter = fixture.componentInstance.counter();

      expect(counter.config.min).toBe(10);
      expect(counter.config.max).toBe(50);
    });
  });

  describe('config hierarchy', () => {
    const testConfig = {
      a: {
        a: 0,
        b: 0,
        c: 0,
      },
      b: {
        a: 0,
        b: 0,
        c: 0,
      },
      c: 0,
      d: 0,
    };

    const protoForTest = createProto<ProtoTestComp, typeof testConfig>(testConfig);

    // Define the main component first so its static members are available
    @Component({
      selector: 'proto-test',
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: ``,
    })
    class ProtoTestComp {
      private static readonly Proto = protoForTest(ProtoTestComp);
      static readonly State = ProtoTestComp.Proto.state;
      static readonly Config = ProtoTestComp.Proto.config;
      static readonly Hooks = ProtoTestComp.Proto.hooks;

      readonly config = ProtoTestComp.Config.inject();
    }

    // Now define the host directives that reference ProtoTestComp.Config
    @Directive({
      selector: '[protoTestGrandparent]',
      providers: [
        ProtoTestComp.Config.provide({
          a: {
            a: 1,
          },
        }),
      ],
    })
    class ProtoTestGrandparent {}

    @Directive({
      selector: '[protoTestParent]',
      hostDirectives: [ProtoTestGrandparent],
      providers: [
        ProtoTestComp.Config.provide({
          b: {
            a: 2,
            b: 2,
          },
        }),
      ],
    })
    class ProtoTestParent {}

    // Create a wrapper component that applies the host directives
    @Component({
      selector: 'proto-test-wrapper',
      changeDetection: ChangeDetectionStrategy.OnPush,
      hostDirectives: [ProtoTestParent],
      providers: [
        ProtoTestComp.State.provide(),
        ProtoTestComp.Config.provide({
          a: {
            b: 3,
          },
          b: {
            b: 3,
            c: 3,
          },
          c: 3,
        }),
      ],
      template: ``,
    })
    class ProtoTestWrapper {
      readonly config = ProtoTestComp.Config.inject();
    }

    it('should inherit config from grandparent', async () => {
      const { fixture } = await render(ProtoTestWrapper);
      const config = fixture.componentInstance.config;

      expect(config).toEqual({
        a: {
          a: 1, // grandparent
          b: 3, // child
          c: 0, // default (missing from test!)
        },
        b: {
          a: 2, // parent
          b: 3, // child
          c: 3, // child
        },
        c: 3, // child
        d: 0, // default (missing from test!)
      });
    });
  });

  describe('state inheritance with hooks', () => {
    const protoForNested = createProto<NestedDir>();

    @Directive({
      selector: '[nested]',
      exportAs: 'nested',
      providers: [
        NestedDir.State.provide(),
        NestedDir.Hooks.provide(state => {
          effect(() => {
            // Use type-safe parent() to get immediate parent of same type
            const parent = state.ancestry.parent;
            if (parent) {
              // parent.state is now properly typed as ProtoState<NestedDir, 'Nested', ...>
              const parentState = parent.state();
              // parentState.disabled is now properly typed
              state().disabled.control(parentState.disabled());
            }
          });
        }),
      ],
    })
    class NestedDir {
      private static readonly Proto = protoForNested(NestedDir);
      static readonly State = NestedDir.Proto.state;
      static readonly Hooks = NestedDir.Proto.hooks;

      readonly disabled = input<boolean, BooleanInput>(false, { transform: booleanAttribute });
      readonly enabled = computed(() => !this.disabled());
      readonly state = NestedDir.Proto(this);
    }

    @Component({
      selector: 'test-nested',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NestedDir],
      template: `
        <div #n1="nested" nested [disabled]="n1Disabled()">
          <div #n2="nested" nested [disabled]="n2Disabled()">
            <div #n3="nested" nested [disabled]="n3Disabled()"></div>
          </div>
        </div>
      `,
    })
    class TestNestedComp {
      readonly n1 = viewChild.required('n1', { read: NestedDir });
      readonly n1Disabled = signal(false);

      readonly n2 = viewChild.required('n2', { read: NestedDir });
      readonly n2Disabled = signal(false);

      readonly n3 = viewChild.required('n3', { read: NestedDir });
      readonly n3Disabled = signal(false);
    }

    it('should inherit disabled state from parent via hook', async () => {
      const { fixture } = await render(TestNestedComp);
      const { n1, n1Disabled, n2, n3 } = fixture.componentInstance;

      // Initially all false
      await fixture.whenStable();
      expect(n1().state().disabled()).toBe(false);
      expect(n2().state().disabled()).toBe(false);
      expect(n3().state().disabled()).toBe(false);

      // Disable n1, children should inherit
      n1Disabled.set(true);
      fixture.detectChanges();

      expect(n1().state().disabled()).toBe(true);
      expect(n2().state().disabled()).toBe(true);
      expect(n2().state().disabled.isControlled()).toBe(true);
      expect(n3().state().disabled()).toBe(true);
      expect(n3().state().disabled.isControlled()).toBe(true);
    });
  });
});
