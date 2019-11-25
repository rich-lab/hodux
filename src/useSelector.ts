import React, { useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { observe, unobserve, isObservable } from '@nx-js/observer-util';
import invariant from 'invariant';

import { isFunction } from './utils';

// @see react-redux
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const refEquality = (a, b) => a === b;

export default function useSelector<T extends object, V = any>(
  store: T,
  selector: (store: T) => V,
  equals?: (a: V, b: V) => boolean,
): ReturnType<typeof selector> {
  invariant(isObservable(store), `store ${store} has not created!`);

  if (equals) invariant(isFunction(equals), 'equals should be function');

  equals = equals || refEquality;

  const [, forceRender] = useReducer(s => s + 1, 0);
  const reactionRef: React.MutableRefObject<Function | undefined> = useRef();
  const vRef: React.MutableRefObject<any> = useRef();

  if (!reactionRef.current) {
    // console.log("run observe");
    reactionRef.current = observe(() => (vRef.current = selector(store)), {
      scheduler: (reaction: Function) => {
        // const newValue = reaction();
        const newValue = selector(store);

        // TODO: diff logger
        // console.log('prev %j, curr: %j', vRef.current, newValue);

        if (!equals(vRef.current, newValue)) {
          forceRender({});
        }
      },
      debugger: console.log,
    });
  } else {
    // vRef.current = selector(store);
    reactionRef.current();
  }

  // cleanup
  useIsomorphicLayoutEffect(() => {
    if (reactionRef.current) {
      unobserve(reactionRef.current);
    }
  }, []);

  return vRef.current;
}
