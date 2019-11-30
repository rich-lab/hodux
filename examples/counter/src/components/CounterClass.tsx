import React, { Component } from 'react';
import { connect, PickState } from 'hodux';

import counter from '../counter';

const selector = (store: PickState<typeof counter>) => ({
  c: store.c,
  count: store.state.count,
});

type Props = ReturnType<typeof selector>;

class Counter extends Component<Props> {
  render() {
    console.log('[ClassCounter render ]');

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

export default connect(counter, selector)(Counter);
