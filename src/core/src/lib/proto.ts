import {
  controlledInput,
  ControlledInput,
  deepMerge,
  DeepPartial,
  injectElementRef,
  isFunction,
  isInputSignal,
  isObject,
  MaybeFn,
  OmitNever,
  uniqueId,
} from '@angular-proto/core/utils';
import {
  DestroyRef,
  ElementRef,
  inject,
  InjectionToken,
  InjectOptions,
  Injector,
  InputSignal,
  InputSignalWithTransform,
  isDevMode,
  Provider,
  runInInjectionContext,
  signal,
  Signal,
  Type,
  WritableSignal,
} from '@angular/core';
import {
  createProtoAncestry,
  PROTO_ANCESTRY_CHAIN,
  ProtoAncestorEntry,
  ProtoAncestry,
} from './proto-ancestry';

/**
 * Internal type representing the writable state before it's made public.
 * The signal can hold null before initialization.
 */
type InternalProtoState<
  T extends object,
  C extends object,
> = WritableSignal<ProtoDirective<T> | null> & ProtoStateProps<T, C>;

export type ProtoDirective<T extends object> = {
  [K in keyof T]: T[K] extends InputSignalWithTransform<infer U, infer TransformT>
    ? ControlledInput<U, TransformT, T[K]>
    : T[K] extends InputSignal<infer V>
      ? ControlledInput<V, V, T[K]>
      : T[K];
};

const PROTO_STATE_SIGNAL: unique symbol = Symbol('PROTO_STATE_SIGNAL');
const ALL_CHILDREN: unique symbol = Symbol('ALL_CHILDREN');

export function isProtoStateSignal(value: unknown): value is ProtoStateProps<object, object> {
  return isObject(value) && value[PROTO_STATE_SIGNAL] === true;
}

export interface ProtoStateProps<T extends object = object, C extends object = object> {
  readonly [PROTO_STATE_SIGNAL]: true;
  readonly protoId: string;
  readonly protoName: string;
  readonly config: C;
  readonly ancestry: ProtoAncestry<T, C>;
  readonly injector: Injector;
  readonly elementRef: ElementRef<HTMLElement>;
}

export type ProtoState<T extends object, C extends object> = Signal<ProtoDirective<T>> &
  ProtoStateProps<T, C>;

export type ProtoHook<T extends object, C extends object> = (proto: ProtoState<T, C>) => void;

export type Proto<T extends object, C extends object> = ((instance: T) => ProtoState<T, C>) &
  OmitNever<{
    state: {
      readonly token: InjectionToken<ProtoState<T, C>>;
      provide(): Provider;
      inject(options?: InjectOptions & { optional?: false }): ProtoState<T, C>;
      inject(options: InjectOptions & { optional: true }): ProtoState<T, C> | null;
    };

    config: Record<PropertyKey, never> extends Required<C>
      ? never
      : {
          readonly token: InjectionToken<C>;
          provide(cfg: MaybeFn<DeepPartial<C>>): Provider;
          inject(options?: Omit<InjectOptions, 'optional'>): C;
        };

    hooks: {
      readonly token: InjectionToken<ProtoHook<T, C>[]>;
      provide(...hooks: ProtoHook<T, C>[]): Provider;
      inject(options?: Omit<InjectOptions, 'optional'>): ProtoHook<T, C>[];
    };
  }>;

export type ProtoFactoryFn<T extends object, C extends object = object> = (
  type: Type<T>,
) => Proto<T, C>;

export function createProto<T extends object, C extends object = object>(
  ...configArgs: NonNullable<DeepPartial<C>> extends C
    ? [defaultConfig?: MaybeFn<C>]
    : [defaultConfig: MaybeFn<C>]
): ProtoFactoryFn<T, C> {
  return (type: Type<T>): Proto<T, C> => {
    const name = type.name;
    const [defaultConfig] = configArgs;

    /** Use for managing writable state (can be null before initialization) */
    const internalProtoToken = new InjectionToken<InternalProtoState<T, C>>(
      `ProtoInternalState:${name}`,
    );

    /** Use for exposing immutable state and ancestry lookups */
    const publicToken = new InjectionToken<ProtoState<T, C>>(`ProtoToken:${name}`);

    /** Use for proto configuration */
    const configToken = new InjectionToken<C>(`ProtoConfig:${name}`);

    /** Use for collecting config contributions from hostDirectives (multi provider) */
    const configContributionToken = new InjectionToken<DeepPartial<C>[]>(
      `ProtoConfigContribution:${name}`,
    );

    /** Use for proto hooks */
    const hooksToken = new InjectionToken<ProtoHook<T, C>[]>(`ProtoHooks:${name}`);

    function provideState(): Provider {
      return [
        {
          provide: internalProtoToken,
          useFactory: (): InternalProtoState<T, C> => {
            // Initialize with null - will be set by initState()
            // The null state indicates the proto is not yet initialized
            const source = signal<ProtoDirective<T> | null>(null);
            const chain = inject(PROTO_ANCESTRY_CHAIN, { optional: true, skipSelf: true }) ?? [];

            const children = signal<ProtoAncestorEntry[]>([]);

            const props: ProtoStateProps<T, C> = {
              [PROTO_STATE_SIGNAL]: true,
              protoId: uniqueId('proto'),
              protoName: name,
              config: injectConfig(),
              injector: inject(Injector),
              elementRef: injectElementRef<HTMLElement>(),
              ancestry: createProtoAncestry(chain, publicToken, children.asReadonly()),
            };

            (props as unknown as Record<symbol, unknown>)[ALL_CHILDREN] = children;

            // Combine signal with metadata - Object.assign preserves the signal function
            const protoState = Object.assign(source, props);

            // Register this proto as a child of all ancestors
            const destroyRef = inject(DestroyRef);
            const selfEntry: ProtoAncestorEntry<T, C> = {
              token: publicToken,
              state: protoState as unknown as ProtoState<T, C>,
            };
            for (const ancestor of chain) {
              const cSignal = (ancestor.state as unknown as Record<symbol, unknown>)[
                ALL_CHILDREN
              ] as WritableSignal<ProtoAncestorEntry[]>;
              cSignal.update(c => [...c, selfEntry]);
              destroyRef.onDestroy(() => {
                cSignal.update(c => c.filter(p => p !== selfEntry));
              });
            }

            return protoState;
          },
        },
        {
          provide: publicToken,
          useFactory: (): ProtoState<T, C> => {
            const proto = inject(internalProtoToken);

            // Forbid mutation on the public token by removing set/update
            // This prevents accidental state modification by consumers
            const publicProto = proto as Partial<WritableSignal<ProtoDirective<T> | null>>;
            delete publicProto.set;
            delete publicProto.update;

            // The public token exposes the proto as if it's always initialized
            // Accessing the signal before initState() will return null, which
            // is validated in injectState()
            return proto as unknown as ProtoState<T, C>;
          },
        },
        {
          provide: PROTO_ANCESTRY_CHAIN,
          useFactory: () => {
            const chain = inject(PROTO_ANCESTRY_CHAIN, { optional: true, skipSelf: true }) ?? [];
            const currentProto = inject(internalProtoToken);

            // Use publicToken in ancestry entries for proto lookups
            // The state is cast because ancestry needs the public token type
            const entry: ProtoAncestorEntry<T, C> = {
              token: publicToken,
              state: currentProto as unknown as ProtoState<T, C>,
            };

            return [...chain, entry];
          },
        },
        // Provide configToken at the state level as a fallback
        // This ensures config is always available even without explicit provideConfig() calls
        // Note: provideConfig() also provides this token, which is intentional for hierarchical config
        {
          provide: configToken,
          useFactory: (): C => injectConfig(),
        },
      ];
    }

    function injectState(opts?: InjectOptions & { optional?: false }): ProtoState<T, C>;
    function injectState(opts: InjectOptions & { optional: true }): ProtoState<T, C> | null;
    function injectState(opts: InjectOptions = {}): ProtoState<T, C> | null {
      const state = inject(publicToken, opts);

      if (!opts.optional && (!state || !state())) {
        throw new Error(
          `${name} proto not initialized. Call ${name}Proto.initState() in your component or directive constructor.`,
        );
      }

      return state ?? null;
    }

    function initState(instance: T): ProtoState<T, C> {
      const proto = inject(internalProtoToken);

      // Check if already initialized
      if (proto()) {
        if (isDevMode()) {
          throw new Error(
            `[angular-proto] ${name}Proto(instance) was called more than once. ` +
              `${name}Proto(instance) should only be called once in the constructor.`,
          );
        }
        return inject(publicToken);
      }

      const injector = inject(Injector);
      const hooks = inject<ProtoHook<T, C>[]>(hooksToken, { optional: true }) ?? [];

      // Wrap all InputSignals with controlled input behavior
      let inputCount = 0;
      for (const key of Object.keys(instance)) {
        const value = instance[key as keyof T];
        if (isInputSignal(value)) {
          controlledInput(value);
          inputCount++;
        }
      }

      // Dev-mode warning if no inputs found
      if (isDevMode() && inputCount === 0) {
        console.warn(
          `[angular-proto] ${name}Proto.initState() called but no input signals found. ` +
            `Did you forget to declare inputs with input()?`,
        );
      }

      // Set the state - the instance is now a ProtoDirective because all inputs are wrapped
      proto.set(instance as ProtoDirective<T>);

      // Run hooks in injection context
      runInInjectionContext(injector, () => {
        for (const hook of hooks) {
          hook(proto as unknown as ProtoState<T, C>);
        }
      });

      return inject(publicToken); // only expose the immutable public token
    }

    function provideConfig(cfg: MaybeFn<DeepPartial<C>>): Provider {
      return [
        {
          provide: configContributionToken,
          multi: true,
          useFactory: () => {
            const injector = inject(Injector);
            return isFunction(cfg) ? runInInjectionContext(injector, cfg) : cfg;
          },
        },
        {
          provide: configToken,
          useFactory: (): C => injectConfig(),
        },
      ];
    }

    function injectConfig(opts: Omit<InjectOptions, 'optional'> = {}): C {
      const injector = inject(Injector);
      const contributions = inject(configContributionToken, { ...opts, optional: true }) ?? [];
      const defaultCfg = isFunction(defaultConfig)
        ? runInInjectionContext(injector, defaultConfig)
        : (defaultConfig ?? {});
      return deepMerge(defaultCfg, ...contributions) as C;
    }

    function provideHooks(...hooks: ProtoHook<T, C>[]): Provider {
      return {
        provide: hooksToken,
        useFactory: () => {
          const parent = inject(hooksToken, { optional: true, skipSelf: true });
          return [...(parent ?? []), ...hooks];
        },
      };
    }

    function injectHooks(opts: Omit<InjectOptions, 'optional'> = {}): ProtoHook<T, C>[] {
      return inject(hooksToken, { ...opts, optional: true }) ?? [];
    }

    const definition: Record<string, unknown> = {
      state: {
        token: publicToken,
        provide: provideState,
        inject: injectState,
      },
      hooks: {
        token: hooksToken,
        provide: provideHooks,
        inject: injectHooks,
      },
    };

    if (defaultConfig) {
      definition['config'] = {
        token: configToken,
        provide: provideConfig,
        inject: injectConfig,
      };
    }

    Object.assign(initState, definition);
    return initState as Proto<T, C>;
  };
}
