import { InputSignalWithTransform, isDevMode, signal, Signal } from '@angular/core';
import { SIGNAL, signalSetFn } from '@angular/core/primitives/signals';
import { isInputSignal, isModelSignal, signalAsReadonly } from './signals-util';

const CONTROLLED_INPUT: unique symbol = Symbol('CONTROLLED_INPUT');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isControlledInput<S extends InputSignalWithTransform<any, any>>(
  source: S,
): source is S extends InputSignalWithTransform<infer U, infer V>
  ? ControlledInput<U, V, S>
  : never {
  return (source as unknown as Record<symbol, unknown>)[CONTROLLED_INPUT] === true;
}

export interface ControlledInputProps<
  T,
  TransformT = T,
  S extends InputSignalWithTransform<T, TransformT> = InputSignalWithTransform<T, TransformT>,
> {
  readonly [CONTROLLED_INPUT]: true;
  readonly node: S[typeof SIGNAL];
  readonly controlValue: Signal<T>;
  readonly templateValue: Signal<T>;
  readonly isControlled: Signal<boolean>;
  control(controlValue: T): void;
  reset(): void;
  asReadonly(): Signal<T>;
}

export type ControlledInput<
  T,
  TransformT = T,
  S extends InputSignalWithTransform<T, TransformT> = InputSignalWithTransform<T, TransformT>,
> = S & ControlledInputProps<T, TransformT, S>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function controlledInput<S extends InputSignalWithTransform<any, any>>(source: S) {
  type T = S extends InputSignalWithTransform<infer U, infer _V> ? U : never;
  type TransformT = S extends InputSignalWithTransform<infer _U, infer V> ? V : never;
  type C = ControlledInput<T, TransformT, S>;
  type P = ControlledInputProps<T, TransformT>;

  if (isControlledInput(source)) {
    // Dev-mode warning when controlledInput is called multiple times
    if (isDevMode()) {
      console.warn(
        `[angular-proto] controlledInput() was called on an already controlled signal. ` +
          `This may indicate a bug - each signal should only be wrapped once.`,
      );
    }
    return source;
  }

  if (!isInputSignal(source)) {
    throw new Error('Source is not a input signal');
  }

  const node = source[SIGNAL];
  const controlValue = signal(node.value);
  const templateValue = signal(node.value);
  const isControlled = signal(false);

  const origApply = node.applyValueToInputSignal.bind(node);
  node.applyValueToInputSignal = (inputNode, value) => {
    isControlled.set(false);
    templateValue.set(value);
    origApply(inputNode, value);
  };

  if (isModelSignal(source)) {
    const origSet = source.set.bind(source);
    source.set = value => {
      isControlled.set(false);
      templateValue.set(value);
      origSet(value);
    };

    const origUpdate = source.update.bind(source);
    source.update = updater => {
      isControlled.set(false);
      templateValue.set(updater(templateValue()));
      origUpdate(updater);
    };
  }

  const definition: P = {
    [CONTROLLED_INPUT]: true,
    node,
    isControlled: isControlled.asReadonly(),
    controlValue: controlValue.asReadonly(),
    templateValue: templateValue.asReadonly(),
    control: value => {
      isControlled.set(true);
      controlValue.set(value);
      signalSetFn(node, value);
    },
    reset: () => {
      isControlled.set(false);
      origApply(node, templateValue());
    },
    asReadonly: () => signalAsReadonly(node),
  };

  Object.assign(source, definition);
  return source as C;
}
