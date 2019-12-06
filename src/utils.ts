import { unstable_batchedUpdates } from 'react-dom';
import { raw } from '@nx-js/observer-util';
import { Equals } from './types';

export function batch(fn: Function, ctx?: object, ...args: unknown[]): any {
  let r;

  unstable_batchedUpdates(() => (r = Reflect.apply(fn, ctx, args)));

  return r;
}

const hasOwn = Object.prototype.hasOwnProperty;

export function shallowEqual(objA: any, objB: any) {
  if (is(objA, objB)) return true;

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

function is(x: any, y: any) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  }

  return x !== x && y !== y;
}

// export const isFunction = (val: unknown) => typeof val === 'function';

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export function isPlainObject(obj: unknown) {
  if (typeof obj !== 'object' || obj === null) return false;

  const proto = Object.getPrototypeOf(obj);

  if (proto === null) return true;

  let baseProto = proto;

  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
}

export function tryClone<Value>(
  value: Value,
  // equals: Equals<Value>
): Value | Value[] {
  if (isPlainObject(value)) {
    // It is faster to use JSON.parse of a string literal than to use a JSON object literal:
    // @see https://v8.dev/blog/cost-of-javascript-2019#json

    // const cloned = JSON.parse(JSON.stringify(value as PickState<Value>));
    const cloned = JSON.parse(JSON.stringify(value));

    // if (!equals(cloned, value)) {
    //   // console.warn('Selected value should be plain object or basic types!');
    //   return value;
    // }

    return cloned;
  }
  if (Array.isArray(value)) return value.slice();

  return value;
}
