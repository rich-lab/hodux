import { ComponentClass, PropsWithChildren, NamedExoticComponent } from 'react';
import { NonReactStatics } from 'hoist-non-react-statics';

/**
 * Model type
 */
// export type Model<T = {}> = {
//   [K in keyof T]: T[K]
// }

interface GetEvent {
  type: 'get';
  target: object;
  key: string;
  receiver?: object;
}

interface SetEvent {
  type: 'set';
  key: string;
  target: object;
  receiver?: object;
  value: any;
  oldValue: any;
}

interface AddEvent {
  type: 'add';
  key: string;
  target: object;
  receiver?: object;
  value: any;
}

interface DeleteEvent {
  type: 'delete';
  key: string;
  target: object;
  oldValue: any;
}

interface HasEvent {
  type: 'has';
  key: string;
  target: object;
}

interface IterateEvent {
  type: 'iterate';
  target: object;
}

interface ClearEvent {
  type: 'clear';
  target: object;
  oldTarget: object;
}

/**
 * Debugger function events
 */
type DebuggerEvent =
  | GetEvent
  | SetEvent
  | AddEvent
  | DeleteEvent
  | HasEvent
  | IterateEvent
  | ClearEvent;

export interface Equals<T> {
  (previousValue: T, nextValue: T): boolean;
}

export interface Debugger {
  (event: DebuggerEvent): void;
}
/**
 * config types
 */
export interface Config<T> {
  equals?: Equals<T>;
  debugger?: Debugger;
}

/**
 * HoduxProvider props type
 */
export type HoduxConfigProps<T> = PropsWithChildren<Config<T>>;

type BasicTypes =
  | number
  | string
  | boolean
  // | symbol
  // | Date
  // | Regexp
  | undefined
  | null;

type ArrayItem<T> = { [P in keyof T]: UnwrapValue<T[P]> }

// Recursively unwraps nested selected value
export type UnwrapValue<T> = {
  basic: T
  array: T extends Array<infer V> ? Array<UnwrapValue<V>> & ArrayItem<T> : T
  object: { [K in keyof T]: UnwrapValue<T[K]> }
}[T extends BasicTypes ? 'basic'
  : T extends Array<any> ? 'array'
  : T extends object ? 'object' : never]

/**
 * Store selector function interface
 */
export interface Selector<V, Props = {}> {
  // (store: Store, ownProps?: OwnProps): V;
  (props?: Props): V;
}

// @see https://medium.com/@flut1/deep-flatten-typescript-types-with-finite-recursion-cb79233d93ca
export type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

/**
 * Exclude all methods from selected value
 */
export type PickValue<V> = Pick<V, NonFunctionKeys<V>>;

// Omit taken from https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Matching<InjectedProps, DecorationTargetProps> = {
  [P in keyof DecorationTargetProps]: P extends keyof InjectedProps
    ? InjectedProps[P] extends DecorationTargetProps[P]
      ? DecorationTargetProps[P]
      : InjectedProps[P]
    : DecorationTargetProps[P];
};

export type Shared<InjectedProps, DecorationTargetProps> = {
  [P in Extract<
    keyof InjectedProps,
    keyof DecorationTargetProps
  >]?: InjectedProps[P] extends DecorationTargetProps[P] ? DecorationTargetProps[P] : never;
};

// Infers prop type from component C
export type GetProps<C> = C extends ComponentClass<infer P> ? P : never;

// only support ComponentClass, FunctionComponent should use useSelector hook!
export type ConnectedComponent<C extends ComponentClass<any>, P> = 
  NamedExoticComponent<JSX.LibraryManagedAttributes<C, P>> & NonReactStatics<C>;

// @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/674d84d48af47b4b608d54c71f148e605dff2ccd/types/react-redux/index.d.ts
export type InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> = <
  C extends ComponentClass<Matching<TInjectedProps, GetProps<C>>>
>(
  classComponent: C,
) => ConnectedComponent<
  C,
  Omit<GetProps<C>, keyof Shared<TInjectedProps, GetProps<C>>> & TNeedsProps
>;
