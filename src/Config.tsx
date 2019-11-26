import * as React from 'react';
import { createContext, PropsWithChildren, createElement, memo } from 'react';

// debugger event types
export enum EventTypes {
  set = 'set',
  add = 'add',
  delete = 'delete',
  clear = 'clear',
  get = 'get',
  has = 'has',
  iterate = 'iterate',
}

export interface Event {
  type: EventTypes;
  target: object;
  key?: string;
  receiver?: object;
  oldValue?: any;
  value?: any;
  oldTarget?: object;
}

export type Config<T = any> = {
  equals?: (a: T, b: T) => boolean;
  debugger?: (event: Event) => void;
};

export const HoduxContext = createContext<Config>({});

HoduxContext.displayName = 'HoduxContext';

type Props<T = any> = PropsWithChildren<{
  equals?: Config<T>['equals'];
  debugger?: Config<T>['debugger'];
}>;

/**
 * Provider the global config for all the `useSelector()` hook
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
