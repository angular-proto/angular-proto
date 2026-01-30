/**
 * Type validation utilities
 */

import { ElementRef } from '@angular/core';

/**
 * Checks if a value is a string
 * @param value - The value to check
 * @returns true if the value is a string, false otherwise
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a number
 * @param value - The value to check
 * @returns true if the value is a number, false otherwise
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Checks if a value is a boolean
 * @param value - The value to check
 * @returns true if the value is a boolean, false otherwise
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a function
 * @param value - The value to check
 * @returns true if the value is a function, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction<T, F extends (...args: any[]) => T>(value: T | F): value is F;
export function isFunction(value: unknown): value is CallableFunction {
  return typeof value === 'function';
}

/**
 * Checks if a value is a plain object (but not null or array)
 * @param value - The value to check
 * @returns true if the value is a plain object, false otherwise
 */
export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks if a value is undefined
 * @param value - The value to check
 * @returns true if the value is undefined, false otherwise
 */
export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

/**
 * Checks if a value is null
 * @param value - The value to check
 * @returns true if the value is null, false otherwise
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Checks if a value is null or undefined
 * @param value - The value to check
 * @returns true if the value is null or undefined, false otherwise
 */
export function isNil(value: unknown): value is null | undefined {
  return isUndefined(value) || isNull(value);
}

/**
 * Checks if a value is not null and not undefined
 * @param value - The value to check
 * @returns true if the value is not null and not undefined, false otherwise
 */
export function notNil<T>(value: T | null | undefined): value is T {
  return !isNil(value);
}

/**
 * Checks if a value is a literal
 * @param literal - The literal to check
 * @param value - The value to check
 * @returns true if the value is a literal, false otherwise
 */
export function isLiteral<T extends string = never>(lit: T, value: unknown): value is T;

/**
 * Checks if a value is a literal
 * @param compareFn - The function to compare the value to the literal type
 * @param value - The value to check
 * @returns true if the value is a literal, false otherwise
 */
export function isLiteral<T extends string = never>(
  compareFn: (v: string) => boolean,
  value: unknown,
): value is T;

export function isLiteral<T extends string = never>(
  compareFn: T | ((v: string) => boolean),
  value: unknown,
): value is T {
  return isString(compareFn) ? compareFn === value : compareFn(String(value));
}

/**
 * Checks if a value is a native button element.
 * Note: This only checks for `<button>` elements, not `<input type="button|submit|reset">`.
 * For button role detection (which includes input buttons), additional checks are needed.
 * @param elementRef - The element to check
 * @param options - The options for the button element
 * @param options.types - The types of the button element
 * @returns true if the element is a native button element, false otherwise
 */
export function isNativeButtonTag(
  elementRef: ElementRef,
  { types = [] }: { types?: string[] } = {},
): elementRef is ElementRef<HTMLButtonElement> {
  return (
    elementRef.nativeElement.tagName === 'BUTTON' &&
    (types.length === 0 || types.includes((elementRef.nativeElement as HTMLButtonElement).type))
  );
}

/**
 * Checks if a value is a native input element.
 * @param elementRef - The element to check
 * @param options - The options for the input element
 * @param options.types - The types of the input element
 * @returns true if the element is a native input element, false otherwise
 */
export function isNativeInputTag(
  elementRef: ElementRef,
  { types = [] }: { types?: string[] } = {},
): elementRef is ElementRef<HTMLInputElement> {
  return (
    elementRef.nativeElement.tagName === 'INPUT' &&
    (types.length === 0 || types.includes(elementRef.nativeElement.type))
  );
}

/**
 * Checks if a value is a native anchor element
 * @param elementRef - The element to check
 * @param options - The options for the anchor element
 * @param options.validLink - Whether to check if the element is a valid link (has href or routerLink attribute)
 * @returns true if the element is a native anchor element, false otherwise
 */
export function isNativeAnchorTag(
  elementRef: ElementRef,
  { validLink = false }: { validLink?: boolean } = {},
): elementRef is ElementRef<HTMLAnchorElement> {
  return (
    elementRef.nativeElement.tagName === 'A' &&
    (!validLink || !!elementRef.nativeElement.href || !!elementRef.nativeElement.routerLink)
  );
}

/**
 * Checks if an element supports the native `disabled` attribute.
 * @param elementRef - The element to check
 * @returns true if the element supports the disabled attribute, false otherwise
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
 */
export function supportsDisabledAttribute(
  elementRef: ElementRef,
): elementRef is ElementRef<HTMLElement & { disabled: boolean }> {
  return elementRef.nativeElement instanceof HTMLElement && 'disabled' in elementRef.nativeElement;
}
