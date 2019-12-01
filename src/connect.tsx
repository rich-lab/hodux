import React, { FC, ComponentClass, NamedExoticComponent, useCallback } from 'react';
import hoistStatics, { NonReactStatics } from 'hoist-non-react-statics';

import { Config } from './Config';
import { shallowEqual } from './utils';
import useSelector, { Selector } from './useSelector';

// Omit taken from https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type Matching<InjectedProps, DecorationTargetProps> = {
  [P in keyof DecorationTargetProps]: P extends keyof InjectedProps
    ? InjectedProps[P] extends DecorationTargetProps[P]
      ? DecorationTargetProps[P]
      : InjectedProps[P]
    : DecorationTargetProps[P];
};

type Shared<InjectedProps, DecorationTargetProps> = {
  [P in Extract<
    keyof InjectedProps,
    keyof DecorationTargetProps
  >]?: InjectedProps[P] extends DecorationTargetProps[P] ? DecorationTargetProps[P] : never;
};

// Infers prop type from component C
type GetProps<C> = C extends ComponentClass<infer P> ? P : never;

// only support ComponentClass, FunctionComponent should use useSelector hook!
type ConnectedComponent<C extends ComponentClass<any>, P> = 
  NamedExoticComponent<JSX.LibraryManagedAttributes<C, P>> & NonReactStatics<C>;

// @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/674d84d48af47b4b608d54c71f148e605dff2ccd/types/react-redux/index.d.ts
type InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> = <
  C extends ComponentClass<Matching<TInjectedProps, GetProps<C>>>
>(
  component: C,
) => ConnectedComponent<
  C,
  Omit<GetProps<C>, keyof Shared<TInjectedProps, GetProps<C>>> & TNeedsProps
>;

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
