import React from 'react';

import { useSelector } from 'hodux';

import counter from '../counter';
import Counter from './Counter';
import CounterClass from './CounterClass';

const App: React.FC = () => {
  const { count, foo, loading } = useSelector(() => ({
    count: counter.state.count,
    foo: counter.state.nested.foo,
    loading: counter.loading,
  }));
  console.log('[App render]');

  return (
    <>
      <div>---App---</div>
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
      <div>---Counter---</div>
      <Counter />
      <div>---CounterClass---</div>
      <CounterClass />
    </>
  );
};

export default App;
