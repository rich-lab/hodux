import React, { Component } from 'react';
import { connect, Config } from 'hodux';

import counter from '../counter';

const selector = () => ({
  c: counter.c,
  count: counter.state.count,
});

type Props = ReturnType<typeof selector>;

class Counter extends Component<Props> {
  render() {
    console.log('[ClassCounter render]');

    return (
      <>
        <div>
          count: {this.props.count}, c: {this.props.c}
        </div>
        <button onClick={counter.add}>add</button>
        <button onClick={counter.nested}>foo change</button>
      </>
    );
  }
}

const config: Config<Props> = {
  debugger(e) {
    if (e.type === 'set') console.log('[SET]', e.key, e.oldValue, e.value);
  },
};

export default connect(selector, config)(Counter);
