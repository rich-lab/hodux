import { unstable_batchedUpdates } from 'react-dom';

export function batch(fn: Function, ctx?: object, ...args: unknown[]): any {
  let r;

  unstable_batchedUpdates(() => (r = Reflect.apply(fn, ctx, args)));

  return r;
}

export const isFunction = (val: unknown) => typeof val === 'function';

const hasOwn = Object.prototype.hasOwnProperty;

export function shallowEqual(objA: any, objB: any) {
  if (is(objA, objB)) return true;

  if (!isObject(objA) || objA === null || !isObject(objB) || objB === null) {
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

export function isObject(obj: unknown) {
  return typeof obj !== 'object';
}

export type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

// Exclude all methods from store!
export type PickState<Store> = Pick<Store, NonFunctionKeys<Store>>;
