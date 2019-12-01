import React, { FC, useCallback } from 'react';
import hoistStatics from 'hoist-non-react-statics';

import { shallowEqual } from './utils';
import useSelector from './useSelector';

import { Config, Selector, InferableComponentEnhancerWithProps } from './types';

/**
 * Connects a React class component to a hodux store.
 *
 * connect accepts three parameters:
 *
 * - the first parameter is a reactived store returns by store()
 *
 * - the second parameter is a selector function familiar to mapStateToProps of redux, it should returns a `key-value` map of selected state.
 *
 * - the last one is an optional config object
 *
 *    - equals: the compare function between previous selected value and the next selected value, the defalut is equality
 *
 *    - debugger: the debugger function passed to `@nx-js/observer-util`
 *
 * @example
 * const counter = store({
 *   num: 0,
 *   inc() { counter.num += 1; }
 * });
 *
 * const selectToProps = store => ({ num: store.num });
 *
 * class Counter extends Component {
 *  render() {
 *    return <div onClick={counter.inc}>{num}</div>;
 *  }
 * }
 *
 * const ReactivedCounter = connect(counter, selectToProps)(Counter);
 */
export function connect<
  Store extends object,
  Selected extends {}, // selected value should be k-v map here!
  OwnProps = {}
>(
  store: Store,
  selectorWithProps: Selector<Store, Selected, OwnProps>,
  config?: Config<Selected>,
): InferableComponentEnhancerWithProps<Selected, OwnProps>;
export function connect(store, selectorWithProps, config) {
  return function wrapWithConnect(WrappedComponent) {
    const ConnectFunction: FC = function ConnectFunction(props) {
      const selector = useCallback(store => selectorWithProps(store, props), [props]);
      const classConfig = Object.assign({ equals: shallowEqual }, config || {});
      const selected = useSelector(store, selector, classConfig);
      const mergedProps = { ...props, ...selected };

      return <WrappedComponent {...mergedProps} />;
    };

    const wrappedComponentName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Connect = React.memo(ConnectFunction);

    // Connect.WrappedComponent = WrappedComponent;
    Connect.displayName = `Connected(${wrappedComponentName})`;

    return hoistStatics(Connect, WrappedComponent);
  };
}

// /////////////
// ownProps usage:

// type Store = {
//   a: number,
//   b: number
// };

// type OwnProps = {
//   x: number,
//   y: number
// };

// const selectToProps = (store: Store, props: OwnProps) => ({
//   yy: props.y,
//   xx: store.a
// });

// type Props = ReturnType<typeof selectToProps>;

// class Counter extends React.Component<Props> {
//   render() {
//     return <div>{this.props.xx}, {this.props.yy}</div>;
//   }
// }

// // Reactived has the props type: OwnProps
// const Reactived = connect({a: 1, b: 2}, selectToProps)(Counter);

// function App() {
//   return <Reactived x={1} y={99} />;
// }
