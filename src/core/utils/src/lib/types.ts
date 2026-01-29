/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Signal } from '@angular/core';
import { isFunction } from './validators';

export type MaybeFn<T> = T | (() => T);
export type MaybeSignal<T> = T | Signal<T>;

export type Unwrap<T> =
  T extends Signal<infer U> ? U : T extends (...args: any[]) => infer R ? R : T;

export function unwrapFn<T>(value: MaybeFn<T>): T {
  return isFunction(value) ? value() : value;
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: T[P] extends (infer U)[]
        ? DeepPartial<U>[]
        : T[P] extends object | undefined
          ? DeepPartial<T[P]>
          : T[P];
    }
  : T;

export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: T[P] extends (infer U)[]
        ? DeepRequired<U>[]
        : T[P] extends object | undefined
          ? DeepRequired<T[P]>
          : T[P];
    }
  : T;

export type OmitNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type NonRecord =
  | Iterable<any>
  | WeakSet<any>
  | WeakMap<any, any>
  | Promise<any>
  | Date
  | Error
  | RegExp
  | ArrayBuffer
  | DataView
  | Function;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type IsRecord<T> = T extends object ? (T extends NonRecord ? false : true) : false;

export type IsUnknownRecord<T> = keyof T extends never
  ? true
  : string extends keyof T
    ? true
    : symbol extends keyof T
      ? true
      : number extends keyof T
        ? true
        : false;

export type IsKnownRecord<T> =
  IsRecord<T> extends true ? (IsUnknownRecord<T> extends true ? false : true) : false;

export type OmitPrivate<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};
