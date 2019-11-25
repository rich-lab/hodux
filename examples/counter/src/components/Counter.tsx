import React from 'react';

import { useSelector } from 'hodux';

import counter from '../counter';

const Counter: React.FC = () => {
  const { count, foo, loading } = useSelector(counter, s => ({
    count: s.state.count,
    foo: s.state.nested.foo,
    loading: s.loading,
  }));
  console.log('[Counter render]');

  return (
    <>
      <div>
        count: {count}, foo: {foo}
      </div>
      <button onClick={() => counter.add()}>add 1</button>
      <button
        onClick={() => {
          counter.addx(10);
        }}
      >
        addx 10{loading ? '...' : ''}
      </button>
      <Counter />
    </>
  );
};

export default Counter;
