import {
  act,
  cleanup,
  fireEvent,
  render,
  waitForDomChange
} from '@testing-library/react';
import deepEqual from 'fast-deep-equal';
import React, { Component, ComponentClass } from 'react';
import { isObservable, raw } from '@nx-js/observer-util';

import { store, useSelector, connect, HoduxConfig, batch } from '../src';
import { ConnectedComponent, Debugger } from '../src/types';
// import { useSelector2 } from '../src/useSelector';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms || 1));

let model = null;
let testStore = null;

function createStore() {
  model = {
    n: 0,
    s: '',
    o: { n: 0, o: {} },
    a: [],
    set: new Set(),
    map: new Map(),
    inc() {
      testStore.n += 1;
    },
    // inc: () => { testStore.n += 1; }, // or
    async incx() {
      await wait(10);
      testStore.n += 1;
    }
  };

  testStore = store(model);

  return { model, testStore };
}

function cleanupAll() {
  cleanup();
  model = null;
  testStore = null;
}

describe('store()', () => {
  const m = { n: 0, s: 's', o: {}, col: new Set(), m: new Map(), sys: Symbol('@store'), d: new Date() };
  const s1 = store(m);
  const s2 = store(m);

  it('should returns reactive store', () => {
    expect(isObservable(m)).toBeFalsy();
    expect(isObservable(s1)).toBeTruthy();
    expect(isObservable(s2)).toBeTruthy();
  });

  it('should returns unique store', () => {
    expect(s1).toEqual(s2);
    expect(raw(s1)).toEqual(m);
    expect(raw(s2)).toEqual(m);
    expect(raw(s1)).toEqual(raw(s2));
  });

  it('should throw when model is invalid', () => {
    expect(() => store(null)).toThrow();
    expect(() => store(undefined)).toThrow();
    expect(() => store(() => {})).toThrow();
    expect(() => store([])).toThrow();
    expect(() => store(new class {})).toThrow();
    expect(() => store(new Map())).toThrow();
    expect(() => store(new Set())).toThrow();
    expect(() => store(new WeakMap())).toThrow();
    expect(() => store(new WeakSet())).toThrow();
  });
});

describe('useSelector()', () => {
  beforeEach(createStore);
  afterEach(cleanupAll);

  it('basic usage should work', async () => {
    const Counter = () => {
      const c = useSelector(() => testStore.n);

      return <div data-testid="a" onClick={testStore.incx}>c:{c}</div>;
    };
    const { container, getByTestId } = render(<Counter />);
    const div = getByTestId('a');

    expect(div.textContent).toEqual('c:0');
    act(testStore.inc);
    expect(div.textContent).toEqual('c:1');
    // trigger method as DOM event handler
    fireEvent.click(div);
    await waitForDomChange({ container });
    expect(div.textContent).toEqual('c:2');
    // manual trigger async method
    await act(async () => await testStore.incx());
    expect(div.textContent).toEqual('c:3');
  });

  it('should no re-render when selector returns null or undefined', () => {
    let c1 = 0;
    let c2 = 0;
    const Null = () => {
      useSelector(() => { console.log(testStore.n); return null; }); // null === null
      c1++;
      return <div />;
    };
    const Undefined = () => {
      useSelector(() => { console.log(testStore.n); return undefined; }); // undefined === undefined
      c2++;
      return <div />;
    };

    render(<><Null /><Undefined/></>);
    expect(c1).toEqual(1);
    expect(c2).toEqual(1);

    act(testStore.inc);
    expect(c1).toEqual(1);
    expect(c2).toEqual(1);
  });

  it('select store self should work', () => {
    const App = () => {
      const { n } = useSelector(() => testStore);
      return <div data-testid="a">{n}</div>;
    };

    const { getByTestId } = render(<App />);
    const div = getByTestId('a');

    act(testStore.inc);
    expect(testStore.n).toEqual(1);
    expect(div.textContent).toEqual('1');
  });

  it('re-render shoule be controlled (basic types)', async () => {
    const jestFn1 = jest.fn();
    const jestFn2 = jest.fn();
    const Parent = () => {
      jestFn1();
      useSelector(() => testStore);
      return (
        <>
          <Child />
        </>
      );
    };
    const Child = () => {
      jestFn2();
      useSelector(() => testStore.n);
      return <div />;
    };

    render(<Parent />);
    expect(jestFn1).toHaveBeenCalledTimes(1);
    expect(jestFn2).toHaveBeenCalledTimes(1);

    // changing state outof store should work
    act(() => { testStore.n += 1 });
    expect(jestFn1).toHaveBeenCalledTimes(2);
    expect(jestFn2).toHaveBeenCalledTimes(2);

    await act(async () => await testStore.incx());
    expect(testStore.n).toEqual(2);
    expect(jestFn1).toHaveBeenCalledTimes(3);
    expect(jestFn2).toHaveBeenCalledTimes(3);
  });

  it('re-render shoule be controlled (array and object types)', async () => {
    let c1 = 0;
    let c2 = 0;
    const Child = () => {
      c1++;
      useSelector(() => testStore.o);
      return <div />;
    };
    const Parent = () => {
      c2++;
      useSelector(() => ({ a: testStore.a, o: testStore.o }));
      return <><Child /></>;
    };

    render(<Parent />);
    expect(c1).toEqual(1);
    expect(c2).toEqual(1);

    act(() => { testStore.o = { n: 1, o: { s: 'ttt'}, a: [1] } });
    expect(c1).toEqual(2);
    expect(c2).toEqual(2);

    act(() => { delete testStore.o.o.s; testStore.o.a.push(2); });
    expect(c1).toEqual(3);
    expect(c2).toEqual(3);

    act(() => { testStore.a.push(1) });
    // force re-render by Parent render, use `useMemo()` or `memo()` to prevent it!
    expect(c1).toEqual(4);
    expect(c2).toEqual(4);
  });

  it('re-render shoule be controlled (collection types)', async () => {
    let c1 = 0;
    let c2 = 0;
    let n = 0;
    let l = 0;
    const Child = () => {
      const o: any = useSelector(() => testStore.map.get('o'));
      if (o?.n) n += o.n;
      c1++;
      return <div />;
    };
    const Parent = () => {
      const r: any = useSelector(() => ({ l: testStore.set.size, o: testStore.map.get('o') }));
      if (r.o?.n) n += r.o.n;
      if (r.l) l = r.l;
      c2++;
      return <><Child /></>;
    };

    render(<Parent />);
    expect(n).toEqual(0);
    expect(l).toEqual(0);

    act(() => { testStore.map.set('o', { n: 1 }) });
    expect(testStore.map.get('o').n).toEqual(1);
    expect(n).toEqual(2);
    expect(l).toEqual(0);
    expect(c1).toEqual(2);
    expect(c2).toEqual(2);

    act(() => { testStore.set.add(1);testStore.set.add(2); });
    expect(n).toEqual(4);
    expect(l).toEqual(2);
    expect(c1).toEqual(3);
    expect(c2).toEqual(3);
  });

  it('equals should work in effects handler', async () => {
    let c1 = 0;
    let c2 = 0;
    let c3 = 0;
    const selector = () => testStore.o;
    const RefEquality = () => {
      c1++;
      useSelector(selector);
      return <div />;
    };
    const DeepEqual = () => {
      c2++;
      useSelector(selector, { equals: deepEqual });
      return <div />;
    };
    const Parent = () => {
      c3++;
      useSelector(() => ({ a: testStore.a, o: testStore.o }));
      return <><RefEquality /><DeepEqual /></>;
    };

    render(<Parent />);
    expect(c1).toEqual(1);
    expect(c2).toEqual(1);
    expect(c3).toEqual(1);

    // act(() => { testStore.o.n += 1; });

    await act(async () => {
      await wait(10);
      testStore.o.n += 1;
    });
    expect(c1).toEqual(3); // take notice here!!
    expect(c2).toEqual(2);
    expect(c3).toEqual(2);
  });

  it('batch should work in effects handler', async () => {
    testStore.loading = false;
    testStore.loadAsync = async (isBatch = false) => {
      testStore.loading = true;
      await wait(1000);
      if (isBatch) {
        batch(update);
      } else {
        update();
      }

      function update() {
        testStore.loading = false;
        testStore.n += 1;
      }
    }

    let c = 0;
    const App = () => {
      c++;
      useSelector(() => ({ n: testStore.n, loading: testStore.loading }));
      return <div />;
    };

    render(<App />);
    expect(c).toEqual(1);

    await act(async () => { await testStore.loadAsync() });
    expect(c).toEqual(4); // step is 3

    await act(async () => { await testStore.loadAsync(true) });
    expect(c).toEqual(6); // step is 2
  });
});

describe('connect()', () => {
  beforeEach(createStore);
  afterEach(cleanupAll);

  it('connect should work with class component', async () => {
    class Comp extends Component<{n: number}> {
      render() {
        return (
          <>
            <div data-testid="n">
              n:{this.props.n}
            </div>
            <button data-testid="inc" onClick={testStore.inc}>inc</button>
            <button data-testid="incx" onClick={testStore.incx}>incx</button>
          </>
        );
      }
    }

    const Reactived = connect(() => ({n: testStore.n}))(Comp);
    const { container, getByTestId } = render(<Reactived />);
    const div = getByTestId('n');
    const inc = getByTestId('inc');
    const incx = getByTestId('incx');

    expect(div.textContent).toEqual('n:0');

    fireEvent.click(inc);
    expect(div.textContent).toEqual('n:1');

    fireEvent.click(incx);
    await waitForDomChange({ container });
    expect(div.textContent).toEqual('n:2');

    act(testStore.inc);
    expect(div.textContent).toEqual('n:3');

    await act(async () => { await testStore.incx() });
    expect(div.textContent).toEqual('n:4');
  });

  it('ownProps should work', async () => {
    type OwnProps = { step: number };
    type Props = ReturnType<typeof selectToProps>;

    const selectToProps = (props: OwnProps) => ({
      step: props.step,
      n: testStore.n
    });

    class Counter extends React.Component<Props> {
      state = { n: this.props.n }
      inc() {
        const n = this.state.n + this.props.step;
        this.setState({ n });
      }
      UNSAFE_componentWillReceiveProps(nextProps) {
        const n = this.state.n + nextProps.n;
        this.setState({ n });
      }
      render() {
        return <div data-testid="n" onClick={() => this.inc()}>{this.state.n}</div>;
      }
    }

    const Reactived = connect(selectToProps)(Counter);
    const { getByTestId } = render(<Reactived step={10} />);
    const div = getByTestId('n');

    expect(div.textContent).toEqual('0');

    fireEvent.click(div);
    expect(div.textContent).toEqual('10');

    act(testStore.inc);
    expect(div.textContent).toEqual('11');
  });
});

describe('<HoduxConfig />', () => {
  beforeEach(createStore);
  afterEach(cleanupAll);

  it('equals props should work', async () => {
    let c1 = 0;
    let c2 = 0;
    const selector = () => ({ n: testStore.n, s: testStore.s });
    const refEqual = (a, b) => a === b;
    const Counter1 = () => {
      c1++;
      useSelector(selector);
      return <div />;
    };
    const Counter2 = () => {
      c2++;
      useSelector(selector, { equals: refEqual }); // cover global config
      return <div />;
    };
    const App = () => {
      useSelector(selector);
      return (
        <>
          <Counter1 />
          <Counter2 />
        </>
      );
    };

    render(<HoduxConfig equals={deepEqual}><App /></HoduxConfig>);

    await act(async () => { await testStore.incx() });
    expect(c1).toEqual(2);
    expect(c2).toEqual(3);
  });
  
  it('debugger props shoule work', async () => {
    const logs = [];
    const logger: Debugger = e => {
      if (e.type === 'set') logs.push(`${e.oldValue}->${e.value}`);
    };
    const Counter = () => {
      useSelector(() => testStore.n);
      return <div />;
    };
    
    render(<HoduxConfig debugger={logger}><Counter /></HoduxConfig>);

    act(testStore.inc);
    expect(logs[0]).toEqual('0->1');

    await act(async () => { await testStore.incx() });
    expect(logs.pop()).toEqual('1->2');
  });
});
