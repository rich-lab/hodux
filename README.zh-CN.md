简体中文 | [English](./README.md)

# Hodux

[![NPM version](https://img.shields.io/npm/v/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![Build Status](https://img.shields.io/travis/react-kit/hodux.svg?style=flat)](https://travis-ci.org/react-kit/hodux)
[![Coverage Status](https://img.shields.io/coveralls/react-kit/hodux.svg?style=flat)](https://coveralls.io/r/react-kit/hodux)
[![NPM downloads](http://img.shields.io/npm/dm/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![size](https://badgen.net/bundlephobia/minzip/hodux@latest)](https://bundlephobia.com/result?p=hodux@latest)
![React](https://img.shields.io/npm/dependency-version/hodux/peer/react?logo=react)

（基于ES6 Proxy API的）React响应式数据流方案。

## 使用介绍

Hodux基于响应式系统机进行数据流转、以自定义Hook方式消费数据，同时支持React Hooks和Class。

```js
import { store, useSelector } from 'hodux';

// 1、创建store（数据劫持）
const counter = store({
  num: 0,
  inc() { counter.num += 1; }
});

// 2、（按需）提取数据（依赖收集）
export default function Counter(props) {
  // 当且仅当num改变时组件re-render
  const num = useSelector(() => counter.num);

  return <div onClick={counter.inc}>The used num:{num}</div>;
}
```

## 安装

```bash
$ npm install hodux --save
# or
$ yarn add hodux
```

## API

### 定义store：`store(model)`

签名：`function store<M extends object>(model: M): M`
作用：传入一个object like model，内部会进行Proxy binding，这样当model上任意数据发生改变时hodux就能感知到，这得益于ES6 Proxy强大的数据劫持能力，且所有Proxy支持的类型（object、array、ES6 collections对象）都可以挂载到model上或者直接作为model。

把state和方法统统挂载到model：

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

lazy create store：

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

local store（在组件内部创建store）:

> hodux的主要用途是全局状态管理，本地数据管理建议采用useState或useReducer

```js
export default function Counter() {
  const counter = store({ count: 0 });
  const count = useSelector(() => counter.count);

  return <div onClick={() => counter.count++}>{count}</div>;
}
```

### 从store选择state：`useSelector(selector, config?)`

签名：`function useSelector<V>(selector: Selector<V>, config?: Config<V>): V`
说明：API参考了我们熟悉的react-redux，功能相似但不完全相同，在selector函数里边按需提取store state（组件依赖收集），hodux会缓存useSelector的返回值，在下一次render时进行对比，如果两次返回值不相同才会真正重新render该组件。

> 因为redux采用single store，所以任意state改变时selector都会重新执行（参见[官方tips](https://react-redux.js.org/api/hooks#useselector)），redux内部会对selector返回值进行对比最终决定是否重新render，而hodux得益于Proxy精细颗粒度的数据劫持控制，只有在selected的state发生改变时才会执行selector，因此理论上不需要像redux那样借助第三方select（如reselect）库来实现select cache。

`useSelector` 接受两个参数：

- 第一个是selector函数：从store提取state，作用类似于响应式系统里的`observer`。

直接选择state并返回：

```js
function MyConponent() {
	const foo = useSelector(() => store.foo);
}
```

依赖计算：由于`useSelector`是一个custom hook，所以`selector`内部可以直接访问组件内部的任意变量（比如props）而不需要做任何的参数传递。

```js
function ComputedWithProps({ step }) {
  // 相当于computed
	const total = useSelector(() => counterStore.count + step);
}
```

select多个store：

```js
function CompWithMutlStore() {
  // 当且仅当store1的count值或者store2的step值改变时才会re-render，result总会是最新的计算结果
	const result = useSelector(() => store1.count + store2.step);
}
```

- 第二个是可选的useSelector配置项

```ts
interface Config<V> {
  equals?: (previousValue: V, nextValue: V): boolean;
  debugger?: (event: DebuggerEvent): void;
}
```

  - equals：前后两次selector value的对比函数，默认是全等（`===`）对比，用户可自行实现equals函数，比如当返回复杂对象时可以直接传入`_.isEqual`用于深度对比（作为最佳实践，推荐返回基本类型，可通过多次`useSelector`调用来选择多个state）。

  - debugger：透传给[observer-util](https://github.com/nx-js/observer-util#boolean--isobservableobject)，一般用于调试打印一些日志

### 类组件绑定：`connect(selector, ownProps?)`

```ts
function connect<V extends {}, OwnProps = {}>(
  selector: Selector<V, OwnProps>,
  config?: Config<V>
): (classComponent: C) => ConnectedComponent<V, OwnProps>
```

`connect`是一个HOC，传参和`useSelector`基本一致，不同的是`selector`参数返回值需要是一个object（类似`mapStateToProps`），`OwnProps`和react-redux类似，connect支持ownProps。

用法：

```js
const selectToProps = () => ({ n: counter.n });

class Counter extends Component {
 render() {
   return <div onClick={counter.inc}>{n}</div>;
 }
}

export default const ConnectedCounter = connect(selectToProps)(Counter);
```

支持ownProps：

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

type：`React.FunctionComponent<React.PropsWithChildren<Config<any>>>`
作用：全局config provider，组件可自行传入参数覆盖全局配置。

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

签名：`function batch(fn: Function) => void`
作用：`unstable_batchedUpdates` API的简单封装，用于在异步环境下批量更新state。

> 注意：React团队可能在后续解决了异步函数批量更新问题之后会移除unstable_batchedUpdates API，所以`batch`方法也可能未来会被移除。

使用场景：

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

## 本地运行示例

[examples](examples)文件夹包含所有可用代码示例，可以通过以下命令运行示例代码：

```bash
$ cd examples/[folder] && npm run install && npm start
```

然后用浏览器打开<http://localhost:3000>即可。

## License

MIT
