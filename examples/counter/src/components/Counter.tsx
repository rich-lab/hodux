import React from 'react';

import { useSelector, PickState } from 'hodux';

import counter from '../counter';

type Store = PickState<typeof counter>;

const Counter: React.FC = () => {
  // useSelector(counter, selector, { equals, debugger });
  const { count, foo, loading, m } = useSelector(counter, s => ({
    count: s.state.count,
    foo: s.state.nested.foo,
    loading: s.loading,
    m: s.m.has(1),
  }));
  console.log('[Counter render]');

  return (
    <>
      <div>
        count: {count}, foo: {foo}, m: {m ? 'hasSet' : '--'}
      </div>
      <button onClick={() => counter.add()}>add 1</button>
      <button
        onClick={() => {
          counter.addx(10);
        }}
      >
        addx 10{loading ? '...' : ''}
      </button>
      <button onClick={counter.setAdd}>set add</button>
      <button onClick={counter.nested}>foo change</button>
    </>
  );
};

export default Counter;
