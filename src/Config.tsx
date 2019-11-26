import * as React from 'react';
import { createContext, PropsWithChildren, createElement, memo } from 'react';

export type Config<T = any> = {
  equals?: (a: T, b: T) => boolean;
  debugger?: Function;
};

export const HoduxContext = createContext<Config>({});

HoduxContext.displayName = 'HoduxContext';

type Props<T = any> = PropsWithChildren<{
  equals?: Config<T>['equals'];
  debugger?: Config<T>['debugger'];
}>;

/**
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

// export class HoduxConfig extends React.PureComponent<Props> {
//   render() {
//     return (
//       <HoduxContext.Provider value={this.props.config}>
//         {this.props.children}
//       </HoduxContext.Provider>
//     );
//   }
// }
