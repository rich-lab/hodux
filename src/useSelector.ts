import React, { useContext, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { observe, unobserve, isObservable } from '@nx-js/observer-util';
import invariant from 'invariant';

import { HoduxContext, Config } from './Config';
import { isFunction } from './utils';

// @see react-redux
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const refEquality = (a: unknown, b: unknown) => a === b;

/**
 * A hook to access some store's state. This hook takes a selector function
 * as an argument. The selector is called with the passed store state.
 *
 * @param {Object} store the obversed store
 * @param {Function} selector the selector function
 * @param {Object=} config the config for current component
 *
 * @returns {any} the selected state
 *
 * @example
 *
 * import React from 'react'
 * import { createStore, useSelector } from 'hodux'
 *
 * const counter = createStore({
 *   num: 0,
 *   inc() { counter.num += 1; }
 * })
 *
 * export const Counter = () => {
 *   const num = useSelector(counter, state => state.num)
 *   return <div onClick={counter.inc}>{num}</div>
 * }
 */
export default function useSelector<T extends object, V = any>(
  store: T,
  selector: (store: T) => V,
  config?: Config<V>,
): V {
  invariant(isObservable(store), `store ${store} has not created!`);

  const globalConfig = useContext(HoduxContext);
  const cfg = Object.assign({ equals: refEquality }, globalConfig, config || {});

  invariant(isFunction(cfg.equals), 'equals should be function!');

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

        if (!cfg.equals(vRef.current, newValue)) {
          forceRender({});
        }
      },
      debugger: cfg.debugger,
    });
  } else {
    // vRef.current = selector(store);
    reactionRef.current();
  }

  // cleanup
  useIsomorphicLayoutEffect(() => {
    return () => {
      if (reactionRef.current) {
        unobserve(reactionRef.current);
      }
    };
  }, []);

  return vRef.current;
}
