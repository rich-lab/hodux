import React, { useContext, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { observe, unobserve, isObservable } from '@nx-js/observer-util';
import invariant from 'invariant';

import { HoduxContext } from './Config';
import { isFunction } from './utils';

import { Config, Selector } from './types';

// @see react-redux
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const refEquality = (a: unknown, b: unknown) => a === b;

/**
 * A hook to access the state of a hodux store.
 *
 * useSelector accepts three parameters:
 *
 * - the first parameter is a reactived store returns by store()
 *
 * - the second parameter is a selector function familiar to useSelector() in react-redux which is called with the passed store
 *
 * - the last one is an optional config object
 *
 *    - equals: the compare function between previous selected value and the next selected value, the defalut is equality
 *
 *    - debugger: the debugger function passed to `@nx-js/observer-util`
 *
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
 * import { store, useSelector } from 'hodux'
 *
 * const counter = store({
 *   num: 0,
 *   inc() { counter.num += 1; }
 * })
 *
 * export const Counter = () => {
 *   const num = useSelector(counter, state => state.num)
 *   return <div onClick={counter.inc}>{num}</div>
 * }
 */
export default function useSelector<Store extends object, SelectedValue = any>(
  store: Store,
  selector: Selector<Store, SelectedValue>,
  config?: Config<SelectedValue>,
): SelectedValue {
  invariant(isObservable(store), `store ${store} has not created!`);

  const globalConfig = useContext(HoduxContext);
  const cfg = Object.assign({ equals: refEquality }, globalConfig, config || {});

  invariant(isFunction(cfg.equals), 'equals should be function!');

  const [, forceRender] = useReducer(s => s + 1, 0);
  const reactionRef: React.MutableRefObject<Function | undefined> = useRef();
  const vRef: React.MutableRefObject<any> = useRef();

  if (!reactionRef.current) {
    reactionRef.current = observe(() => (vRef.current = selector(store)), {
      scheduler: (reaction: Function) => {
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
