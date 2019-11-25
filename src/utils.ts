import { unstable_batchedUpdates } from 'react-dom';

export function batch(fn: Function, ctx?: object, ...args: unknown[]): any {
  let r;

  unstable_batchedUpdates(() => (r = Reflect.apply(fn, ctx, args)));

  return r;
}

export const isFunction = (val: unknown) => typeof val === 'function';

const hasOwn = Object.prototype.hasOwnProperty;

export function shallowEqual(objA, objB) {
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

function is(x, y) {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  }

  return x !== x && y !== y;
}

function isObject(obj) {
  return typeof obj !== 'object';
}
