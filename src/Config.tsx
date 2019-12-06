import React, { createContext, createElement, memo } from 'react';

import { Config, HoduxConfigProps } from './types';

export const HoduxContext = createContext<Config<any>>({});

HoduxContext.displayName = 'HoduxContext';

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
export const HoduxConfig: React.FC<HoduxConfigProps<any>> = memo(props => {
  const value = { equals: props.equals, debugger: props.debugger };

  return createElement(HoduxContext.Provider, { value }, props.children);
});
