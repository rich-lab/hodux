import React, { FC, useCallback } from 'react';
import hoistStatics from 'hoist-non-react-statics';

import { shallowEqual } from './utils';
import useSelector from './useSelector';

import { Config, Selector, InferableComponentEnhancerWithProps } from './types';

/**
 * Connects a React class component to some hodux store.
 *
 * connect accepts two parameters:
 * 
 * - the first parameter is a selector function familiar to mapStateToProps of redux, it should returns a `key-value` map of selected state.
 *
 * - the second one is an optional config object
 *
 *    - equals: the compare function between previous selected value and the next selected value, the defalut is equality
 *
 *    - debugger: the debugger function passed to `@nx-js/observer-util`
 *
 * @param {Function} selectorWithProps the selector function
 * @param {Object=} config the config for current component
 *
 * @returns {ConnectedComponent} the connected class component
 * 
 * @example
 * const counter = store({
 *   num: 0,
 *   inc() { counter.num += 1; }
 * });
 *
 * const selectToProps = () => ({ num: counter.num });
 *
 * class Counter extends Component {
 *  render() {
 *    return <div onClick={counter.inc}>{num}</div>;
 *  }
 * }
 *
 * const ReactivedCounter = connect(selectToProps)(Counter);
 */
export function connect<
  Selected extends {}, // selected value should be k-v map here!
  OwnProps = {}
>(
  selectorWithProps: Selector<Selected, OwnProps>,
  config?: Config<Selected>,
): InferableComponentEnhancerWithProps<Selected, OwnProps>;
export function connect(selectorWithProps, config) {
  return function wrapWithConnect(WrappedComponent) {
    const ConnectFunction: FC = function ConnectFunction(props) {
      const selector = useCallback(() => selectorWithProps(props), [props]);
      const classConfig = Object.assign({ equals: shallowEqual }, config || {});
      const selected = useSelector(selector, classConfig);
      const mergedProps = { ...props, ...selected };

      return <WrappedComponent {...mergedProps} />;
    };

    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Connect = React.memo(ConnectFunction);

    // Connect.WrappedComponent = WrappedComponent;
    Connect.displayName = `Connected(${wrappedComponentName})`;

    return hoistStatics(Connect, WrappedComponent);
  };
}
