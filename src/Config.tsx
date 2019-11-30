import * as React from 'react';
import { createContext, PropsWithChildren, createElement, memo } from 'react';

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

// debugger event types
export type Event =
  | GetEvent
  | SetEvent
  | AddEvent
  | DeleteEvent
  | HasEvent
  | IterateEvent
  | ClearEvent;

export interface Config<T = any> {
  equals?: (a: T, b: T) => boolean;
  debugger?: (event: Event) => void;
}

export const HoduxContext = createContext<Config>({});

HoduxContext.displayName = 'HoduxContext';

type Props<T = any> = PropsWithChildren<{
  equals?: Config<T>['equals'];
  debugger?: Config<T>['debugger'];
}>;

/**
 * Provider the global config for all useSelector() and connect()
 *
 * @example
 * ReactDOM.render(
 *  <HoduxConfig equals={_.isEqual}>
 *    <App />
 *  </HoduxConfig>,
 *  document.getElementById('root')
 * );
 */
export const HoduxConfig: React.FC<Props> = memo(props => {
  const value = { equals: props.equals, debugger: props.debugger };

  return createElement(HoduxContext.Provider, { value }, props.children);
});
