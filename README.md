English | [简体中文](./README.zh-CN.md)

# Hodux

[![NPM version](https://img.shields.io/npm/v/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![Build Status](https://img.shields.io/travis/react-kit/hodux.svg?style=flat)](https://travis-ci.org/react-kit/hodux)
[![Coverage Status](https://img.shields.io/coveralls/react-kit/hodux.svg?style=flat)](https://coveralls.io/r/react-kit/hodux)
[![NPM downloads](http://img.shields.io/npm/dm/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![size](https://badgen.net/bundlephobia/minzip/hodux@latest)](https://bundlephobia.com/result?p=hodux@latest)
![React](https://img.shields.io/npm/dependency-version/hodux/peer/react?logo=react)

The reactivity state management for React. Made with :heart: and ES6 Proxy API.

> Inspired by [react-easy-state](https://github.com/solkimicreb/react-easy-state) but more friendly for React Hooks.

## Features

- **Observable store**: the state flow is easy enough.
- **Consume state with react hook**: select state from store using custom hook as needed, and render optimized.
- **Perfectly TypeScript support**

## Introduction

Hodux is a reactivity state management solution for React which supports both Hooks and Class, it has only 2 core APIs and quit easy to learn.

```js
import { store, useSelector } from 'hodux';

// create store(Observable)
const counter = store({
  num: 0,
  inc() { counter.num += 1; }
});

// select state from store(Dependency collection)
export default function Counter(props) {
  const num = useSelector(() => counter.num);
  // or you can do some compute in component
  // const total = useSelector(() => counter.num + props.step);

  return <div onClick={counter.inc}>The num:{num}</div>;
}
```

## Install

```sh
npm install --save hodux
# or
$ yarn add hodux
```

## API

### `store(model)`

- Signature: `function store<M extends object>(model: M): M`
- Description: creates and returns a proxied observable object by the passed model(object), the original model object is not modified. It's just a wrapper of [observable()](https://github.com/nx-js/observer-util#proxy--observableobject).

create store with object-based model:

```js
// stores/counter.js
const counter = store({
  count: 0,
  inc() {
    counter.count++;
  },
  async incx() {
    await wait(1000);
    counter.count += 1;
  }
});

export default counter;
```

lazy creates:

```js
// stores/counter.js
export default (initalCount = 0) => {
  const state = store({ count: initalCount });

  function inc() {
    state += n;
  }

  async function incx() {
    await wait(1000);
    state.count += 1;
  }

  return { state, inc, incx }
}
```

local store(create store inner components):

> Maybe use native APIs(useState or useReducer) will be better, the goal of hodux is shared store between components.

```js
export default function Counter() {
  const counter = store({ count: 0 });
  const count = useSelector(() => counter.count);

  return <div onClick={() => counter.count++}>{count}</div>;
}
```

### `useSelector(selector, config?)`

- Signature: `function useSelector<V>(selector: Selector<V>, config?: Config<V>): V`
- Description: extracts state from store as needed, the components will not re-render **unless any selected state changes**.

> Maybe it's the main difference with react-redux's useSelector(), because react-redux call selector whenever store state changes even not selected at all(react-redux internal decides if makes re-render), so you do't need to use any cache selector library(such as reselect) with useSelector.

`useSelector` accepts two parameters:

- the first parameter is a `selector` function which works as observer API in reactivity system. It subscribes the selected state and diff the previous returned value with the next one to decide if or not re-render. Maybe you can do some compute with state in `useSelector` and takes result as the return value.

- the second is an optional config object
  
  - `equals`: the compare function between previous return value and the next return value, the defalut is equality

  - `debugger`: the debugger function passed to `@nx-js/observer-util`

Returns basic type is recommended:

```js
useSelector(() => {
  const items = store.items; // select items from store

  return items.reduce((acc, item) => acc + item.value, 0); // do some compute with state and return result
});
```

You should pass in equals function when returns object:

```js
useSelector(() => {
  return {
    loading: listStore.loading,
    list: listStore.list
  }
}, { equals: _.equals }); // use lodash/isEqual
```

Select state from multiple stores:

```js
function CompWithMutlStore() {
  // whenever the `count` from store1 or the `step` from store1 changes the compoent will re-render, so the `result` is always be the newest value
	const result = useSelector(() => store1.count + store2.step);
}
```

### `connect(selector, ownProps?)`

```ts
function connect<V extends {}, OwnProps = {}>(
  selector: Selector<V, OwnProps>,
  config?: Config<V>
): (classComponent: C) => ConnectedComponent<V, OwnProps>
```

A HOC wrapper of `useSelector` to connect store state to the class components, and is only for class components.

`connect` accepts two parameters:

- `selectorWithProps(ownProps?)`: familiar to selector, but the difference is selectorWithProps must return object type(such as `mapStateToProps` in react-redux), selectorWithProps accepts the connected component's props as parameter.

- `config`: same as useSelector's config parameter

class component usage:

```js
const counter = store({
  n: 0,
  inc() { counter.n += 1; }
});

const selectToProps = () => ({ n: counter.n });

class Counter extends Component {
 render() {
   return <div onClick={counter.inc}>{n}</div>;
 }
}

export default const ReactivedCounter = connect(selectToProps)(Counter);
```

ownProps:

```js
const selectToProps = (props) => ({
  step: props.step,
  n: testStore.n
});

class Counter extends React.Component {
  state = { n: this.props.n }
  inc() {
    const n = this.state.n + this.props.step;
    this.setState({ n });
  }
  render() {
    return <div onClick={() => this.inc()}>{this.state.n}</div>;
  }
}

const Connected = connect(selectToProps)(Counter);

render(<Connected step={10} />);
```

### `<HoduxConfig equals={fn} debugger={fn} />`

- Type: `React.FunctionComponent<React.PropsWithChildren<Config<any>>>`
- Description: The global config Provider.

```js
function consoleLogger(e) {
  if (e.type !== 'get') {
    console.log(`[${e.type}]`, e.key, e.value);
  }
}

ReactDOM.render(
  <HoduxConfig debugger={consoleLogger}>
    <App />
  </HoduxConfig>,
  document.getElementById('root')
);
```

### `batch(fn)`

- Signature: `function batch(fn: Function) => void`
- Description: a wrapper of `unstable_batchedUpdates`, to prevent multiples render caused by multiple store mutations in asynchronous handler such as `setTimeout` and `Promise`, etc. If you experience performance issues you can batch changes manually with `batch`.

> NOTE: The React team plans to improve render batching in the future. The `batch` API may be removed in the future in favor of React's own batching.

```js
const listStore = store({
  loading: false,
  list: []
});

listStore.load = async () => {
  testStore.loading = true;

  const list  = await fetchData();

  batch(() => {
    testStore.loading = false;
    testStore.list = list;
  });
}
```

## Run examples locally

The [examples](examples) folder contains working examples.
You can run one of them with

```bash
$ cd examples/[folder] && npm start
```

then open <http://localhost:3000> in your web browser.

## License

MIT
