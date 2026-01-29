import { computed, inject, InjectionToken, InjectOptions, Signal } from '@angular/core';
import { ProtoState } from './proto';

export interface ProtoAncestorEntry<T extends object = object, C extends object = object> {
  readonly token: InjectionToken<ProtoState<T, C>>;
  readonly state: ProtoState<T, C>;
}

export const PROTO_ANCESTRY_CHAIN = new InjectionToken<ProtoAncestorEntry[]>('ProtoAncestryChain', {
  factory: () => [],
});

export interface ProtoAncestry<T extends object = object, C extends object = object> {
  /**
   * The immediate parent of the same proto type, if any.
   */
  get parent(): ProtoAncestorEntry<T, C> | null;

  /**
   * The immediate parent of the given proto token, if any.
   */
  parentOfType<TT extends object, CC extends object>(
    token: InjectionToken<ProtoState<TT, CC>>,
  ): ProtoAncestorEntry<TT, CC> | null;

  /**
   * All ancestors of same proto type, ordered from parent to genesis.
   * @param predicate - Optional predicate to filter ancestors.
   */
  ancestors(predicate?: (entry: ProtoAncestorEntry<T, C>) => boolean): ProtoAncestorEntry<T, C>[];

  /**
   * All ancestors of the given proto type, ordered from parent to genesis.
   * @param predicate - Optional predicate to filter ancestors.
   */
  ancestorsOfType<TT extends object, CC extends object>(
    token: InjectionToken<ProtoState<TT, CC>>,
    predicate?: (entry: ProtoAncestorEntry<TT, CC>) => boolean,
  ): ProtoAncestorEntry<TT, CC>[];

  /**
   * All ancestors of any type, ordered from parent to genesis.
   * @param predicate - Optional predicate to filter ancestors.
   */
  allAncestors(predicate?: (entry: ProtoAncestorEntry) => boolean): ProtoAncestorEntry[];

  /**
   * All children of the same proto type, ordered from nearest to farthest.
   */
  readonly children: Signal<ProtoAncestorEntry<T, C>[]>;

  /**
   * All children of the given proto type, ordered from nearest to farthest.
   * Returns a cached signal that is reused for subsequent calls with the same token.
   */
  childrenOfType<TT extends object, CC extends object>(
    token: InjectionToken<ProtoState<TT, CC>>,
  ): Signal<ProtoAncestorEntry<TT, CC>[]>;

  /**
   * All children of any type, ordered from nearest to farthest.
   */
  allChildren(): Signal<ProtoAncestorEntry[]>;
}

export function createProtoAncestry<T extends object, C extends object>(
  parentChain: readonly ProtoAncestorEntry[],
  currentToken: InjectionToken<ProtoState<T, C>>,
  allChildrenSignal: Signal<ProtoAncestorEntry[]>,
): ProtoAncestry<T, C> {
  // Pre-compute reversed array (nearest first) - computed once at creation time
  // This is O(n) where n is the depth of nesting, but only happens once per proto
  const ancestors = [...parentChain].reverse();

  // Computed signal that filters children by same proto type
  const sameTypeChildren = computed(
    () => allChildrenSignal().filter(e => e.token === currentToken) as ProtoAncestorEntry<T, C>[],
  );

  // Cache parent lookup since it's commonly accessed
  let cachedParent: ProtoAncestorEntry<T, C> | null | undefined;

  // Cache for childrenOfType signals by token
  const childrenByTypeCache = new Map<
    InjectionToken<ProtoState<object, object>>,
    Signal<ProtoAncestorEntry<object, object>[]>
  >();

  const result: ProtoAncestry<T, C> = {
    get parent(): ProtoAncestorEntry<T, C> | null {
      // Lazy compute and cache the parent of the same type
      if (cachedParent === undefined) {
        const found = ancestors.find(e => e.token === currentToken);
        cachedParent = (found as ProtoAncestorEntry<T, C>) ?? null;
      }
      return cachedParent;
    },
    parentOfType<TT extends object, CC extends object>(
      token: InjectionToken<ProtoState<TT, CC>>,
    ): ProtoAncestorEntry<TT, CC> | null {
      // ancestors is already sorted nearest-first, so find() returns the closest match
      const found = ancestors.find(e => e.token === token);
      return (found as ProtoAncestorEntry<TT, CC>) ?? null;
    },

    ancestors(
      predicate?: (entry: ProtoAncestorEntry<T, C>) => boolean,
    ): ProtoAncestorEntry<T, C>[] {
      type A = ProtoAncestorEntry<T, C>;
      const sameType = ancestors.filter(e => e.token === currentToken) as A[];
      return predicate ? sameType.filter(predicate) : sameType;
    },

    ancestorsOfType<TT extends object, CC extends object>(
      token: InjectionToken<ProtoState<TT, CC>>,
      predicate?: (entry: ProtoAncestorEntry<TT, CC>) => boolean,
    ): ProtoAncestorEntry<TT, CC>[] {
      const ofType = ancestors.filter(e => e.token === token) as ProtoAncestorEntry<TT, CC>[];
      return predicate ? ofType.filter(predicate) : ofType;
    },

    allAncestors(predicate?: (entry: ProtoAncestorEntry) => boolean): ProtoAncestorEntry[] {
      // Return the cached array directly when no predicate is given
      return predicate ? ancestors.filter(predicate) : ancestors;
    },

    children: sameTypeChildren,

    childrenOfType<TT extends object, CC extends object>(
      token: InjectionToken<ProtoState<TT, CC>>,
    ): Signal<ProtoAncestorEntry<TT, CC>[]> {
      // Return cached signal if available
      let cached = childrenByTypeCache.get(token as InjectionToken<ProtoState<object, object>>);
      if (!cached) {
        // Create and cache new computed signal for this token
        cached = computed(() => allChildrenSignal().filter(e => e.token === token));
        childrenByTypeCache.set(token as InjectionToken<ProtoState<object, object>>, cached);
      }
      return cached as Signal<ProtoAncestorEntry<TT, CC>[]>;
    },

    allChildren(): Signal<ProtoAncestorEntry[]> {
      return allChildrenSignal;
    },
  };

  return result;
}

export function injectProtoAncestor<T extends object, C extends object>(
  token: InjectionToken<ProtoState<T, C>>,
  options?: InjectOptions & { optional?: false },
): ProtoState<T, C>;

export function injectProtoAncestor<T extends object, C extends object>(
  token: InjectionToken<ProtoState<T, C>>,
  options: InjectOptions & { optional: true },
): ProtoState<T, C> | null;

export function injectProtoAncestor<T extends object, C extends object>(
  token: InjectionToken<ProtoState<T, C>>,
  options: InjectOptions = {},
): ProtoState<T, C> | null {
  const { optional, ...injectOpts } = options;
  const state = inject(token, { ...injectOpts, optional: true, skipSelf: true });

  if (!state && !optional) {
    throw new Error(
      `Required ancestor state not found. ` +
        `Ensure the parent proto is present in the DOM hierarchy.`,
    );
  }

  return state ?? null;
}

export function injectProtoParent<T extends object, C extends object>(
  token: InjectionToken<ProtoState<T, C>>,
  options?: InjectOptions & { optional?: false },
): ProtoState<T, C>;

export function injectProtoParent<T extends object, C extends object>(
  token: InjectionToken<ProtoState<T, C>>,
  options: InjectOptions & { optional: true },
): ProtoState<T, C> | null;

export function injectProtoParent<T extends object, C extends object>(
  token: InjectionToken<ProtoState<T, C>>,
  options: InjectOptions = {},
): ProtoState<T, C> | null {
  return inject(token, { ...options, skipSelf: true }) ?? null;
}
