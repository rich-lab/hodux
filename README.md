# hodux

[![NPM version](https://img.shields.io/npm/v/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![Build Status](https://img.shields.io/travis/react-kit/hodux.svg?style=flat)](https://travis-ci.org/react-kit/hodux)
[![Coverage Status](https://img.shields.io/coveralls/react-kit/hodux.svg?style=flat)](https://coveralls.io/r/react-kit/hodux)
[![NPM downloads](http://img.shields.io/npm/dm/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![size](https://badgen.net/bundlephobia/minzip/hodux@latest)](https://bundlephobia.com/result?p=hodux@latest)
![React](https://img.shields.io/npm/dependency-version/hodux/peer/react?logo=react)

The reactivity state management for React. Made with :heart: and ES6 Proxies.

> Inspired by [react-easy-state](https://github.com/solkimicreb/react-easy-state) but use friendly APIs for React Hooks.

## Features

- **Observable store**: the state flow is easy enough.
- **State selectable**: extract state as needed, the components will not re-render unless any selected state changes.
- **Perfectly typescript support**.

## Introduction

Hodux is a reactivity state management solution for React which supports both Hooks and Class, it has only 2 core APIs and quit easy to learn.

```js
import React from 'react';
import { store, useSelector } from 'hodux';

// create observable store
const counter = store({
  num: 0,
  inc() { counter.num += 1; }
});

// select state from store
export default function Counter(props) {
  const num = useSelector(() => counter.num);
  // or you can do some compute within component
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

### store(model)

Creates and returns a proxied observable object by the passed model(object), the original model object is not modified. It's just a wrapper of [observable()](https://github.com/nx-js/observer-util#proxy--observableobject).

create store object:

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

### useSelector(selector, config?)

Extracts state from store as needed, **the components will re-render only if any selected state changes**, maybe it's the main difference with react-redux's useSelector(), because react-redux call selector when any store state changes even if not selected state at all(react-redux internal decides if makes re-render), so you do't need to use any cache selector library(such as reselect) with useSelector.

`useSelector` accepts two parameters:

- the first parameter is a selector function which works as observer API in reactivity system. It subscribes the selected state and equals the previous returned value with the next one to decide if or not re-render. Maybe you can do some compute with state in useSelector and takes result as the return value.

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

### connect(selectorWithProps, config?)

`connect` is a HOC wrapper of `useSelector` which only for class components to connect some store's state with the components.

connect accepts two parameters:

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

### <HoduxConfig equal={fn} debugger={fn} />

The global config Provider.

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

### batch(fn: Function)

A wrapper of `unstable_batchedUpdates`, to prevent multiples render caused by multiple synchronous store mutations. If you experience performance issues you can batch changes manually with `batch`.

> NOTE: The React team plans to improve render batching in the future. The batch API may be removed in the future in favor of React's own batching.

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
