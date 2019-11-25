import React from 'react';

import { useSelector } from 'hodux';

import counter from '../counter';
import Counter from './Counter';

const App: React.FC = () => {
  const { count, foo, loading } = useSelector(counter, s => ({
    count: s.state.count,
    foo: s.state.nested.foo,
    loading: s.loading,
  }));
  console.log('[App render]');

  return (
    <>
      <div>
        count: {count}, foo: {foo}
      </div>
      <button onClick={() => counter.add()}>add 1</button>
      <button
        onClick={() => {
          counter.addx(1);
        }}
      >
        addx 1{loading ? '...' : ''}
      </button>
      <Counter />
    </>
  );
};

export default App;
