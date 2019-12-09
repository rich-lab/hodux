import React, { useContext, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { observe, unobserve } from '@nx-js/observer-util';

import { HoduxContext } from './Config';
import { tryClone } from './utils';
import { Config, Selector, UnwrapValue } from './types';

// @see react-redux
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const refEquality = (a: unknown, b: unknown) => a === b;

/**
 * Extracts state from store as needed, the components will **re-render only if the selected state changes**
 *
 * useSelector accepts two parameters:
 *
 * - the first parameter is a selector function which works as observer API in reactivity system. It subscribes the selected state and equals the previous returned value with the next one to decide if or not re-render. Maybe you can do some compute with state in useSelector and takes result as the return value.
 *
 * - the second is an optional config object
 *
 *    - equals: the compare function between previous return value and the next return value, the defalut is equality
 *
 *    - debugger: the debugger function passed to `@nx-js/observer-util`
 *
 *
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
 * export const Counter = ({ baseNum }) => {
 *   const total = useSelector(() => (counter.num + baseNum))
 *   return <div onClick={counter.inc}>{total}</div>
 * }
 */
export default function useSelector<V>(
  selector: Selector<V>,
  config?: Config<V>,
): UnwrapValue<V> {
  const globalConfig = useContext(HoduxContext);
  const equals = (config || globalConfig || {}).equals || refEquality;
  const debuggerFn = (config || globalConfig || {}).debugger;
  const [, forceRender] = useReducer(s => s + 1, 0);
  const reactionRef: React.MutableRefObject<Function> = useRef();
  const vRef: React.MutableRefObject<V | V[]> = useRef();

  if (!reactionRef.current) {
    reactionRef.current = observe(() => {
      const selectedValue = selector();

      // for diff
      vRef.current = tryClone(selectedValue);

      return selectedValue;
    }, {
      scheduler: () => {
        const newValue = selector();

        // TODO: diff logger
        // console.log(
        //   'oldValue %j, newValue: %j, equalName: %s, isEqual: %s',
        //   vRef.current, newValue, equals.name, equals(vRef.current, newValue)
        // );

        if (!equals(vRef.current, newValue)) {
          forceRender({});
        }
      },
      debugger: debuggerFn
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

  return vRef.current as UnwrapValue<V>;
}
