简体中文 | [English](./README.md)

# Hodux

[![Build Status](https://img.shields.io/travis/react-kit/hodux.svg?style=flat)](https://travis-ci.org/react-kit/hodux)
[![Coverage Status](https://img.shields.io/coveralls/react-kit/hodux.svg?style=flat)](https://coveralls.io/r/react-kit/hodux)
[![NPM version](https://img.shields.io/npm/v/hodux.svg?style=flat)](https://npmjs.org/package/hodux)
[![size](https://badgen.net/bundlephobia/minzip/hodux@latest)](https://bundlephobia.com/result?p=hodux@latest)
![React](https://img.shields.io/npm/dependency-version/hodux/peer/react?logo=react)

:rocket:（基于ES6 Proxy构建的）轻量级简单易用的React响应式数据流方案。

> Hodux灵感源自[react-easy-state](https://github.com/solkimicreb/react-easy-state)但抛弃HOC，拥抱Hooks。

## :sparkles:介绍

- **响应式**数据流转，足够简单易懂。
- 类react-redux hooks的**selector API**，可以按需从store提取数据，当且仅当选择的数据改变时组件才会刷新，[**高性能**](https://github.com/react-kit/hodux/issues/3)保证。
- 完美支持**Typescript**。

```js
import { store, useSelector } from 'hodux';

// 1、创建一个可观测的store（数据劫持）
const counter = store({
  num: 0,
  otther: '',
  inc() { counter.num += 1; }
});

// 2、按需取数（依赖收集）
export default function Counter(props) {
  // 当且仅当num改变时组件re-render
  const num = useSelector(() => counter.num);

  return <div onClick={counter.inc}>The used num:{num}</div>;
}
```

## 在线demo（TodoMVC）

[![Edit](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/todo-mvc-b3rhz)

## :package:安装

```bash
$ npm install hodux --save
# or
$ yarn add hodux
```

## 📖 API

### `store(model)`

- 签名：`function store<M extends object>(model: M): M`
- 说明：传入一个pureModel或viewModel，返回一个可观测（observable）对象，原始的model对象并没有任何改变，内部只是进行了一次Proxy binding，所以返回的observable对象的行为和原生js对象无异。得益于ES6 Proxy强大的数据劫持能力，store可以感知到更加细粒度的数据修改（如数组、对象等）。

<details>
<summary><strong>传入pureModel</strong></summary>

```js
// stores/counter.js
export default store({ count: 0 });

// src/Counter.js
import counter from './stores/counter';
// 在store外部（任意位置）修改数据，React组件都能更新数据
const incx = async () => {
  await wait(1000);
  counter.count += 1;
};

export function Counter() {
  const count = useSelector(() => counter.count);
  return <div onClick={incx}>{count}</div>;
}
```

</details>

<details>
<summary><strong>传入viewModel（数据和操作数据的方法放在一起）</strong></summary>

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

</details>

<details>
<summary><strong>Lazy create（可处理初始值、内部变量等）</strong></summary>

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

</details>

<details>
<summary><strong>复杂对象（任意合法的js数据结构）</strong></summary>

```js
// stores can include nested data, arrays, Maps, Sets, getters, setters, inheritance, ...
const person = store({
  // nested object
  profile: {
    firstName: 'Bob',
    lastName: 'Smith',
    // getters
    get name() {
      return `${user.firstName} ${user.lastName}`
    },
    age: 25
  },
  // array
  hobbies: [ 'programming', 'sports' ],
  // collections
  familyMembers: new Map(),
});

// changing stores as normal js objects
person.profile.firstName = 'Daid';
delete person.profile.lastName;
person.hobbies.push('reading');
person.familyMembers.set('father', father);
person.familyMembers.set('mother', mother);
```

</details>

### `useSelector(selector, config?)`

- 签名：`function useSelector<V>(selector: Selector<V>, config?: Config<V>): V`
- 说明：从store提取state。API参考了我们熟悉的react-redux，功能相似但不完全相同，在`selector`函数里边按需提取store state（组件依赖收集），hodux会缓存`useSelector`的返回值，在下一次render时进行对比，如果两次返回值不相同才会真正重新render该组件。

> 因为redux采用single store，所以任意state改变时selector都会重新执行（参见[官方tips](https://react-redux.js.org/api/hooks#useselector)），redux内部会对selector返回值进行对比最终决定是否重新render，而hodux得益于Proxy精细颗粒度的数据劫持控制，只有在selected的state发生改变时才会执行selector，因此理论上不需要像redux那样借助第三方select（如reselect）库来实现select cache。

`useSelector` 接受两个参数：

- 第一个是selector函数：从store提取state，作用类似于响应式系统里的`observer`。

- 第二个是可选的useSelector配置项

  - equals：前后两次selector value的对比函数，默认是全等（`===`）对比，用户可自行实现equals函数，比如当返回复杂对象时可以直接传入`_.isEqual`用于深度对比（作为最佳实践，推荐返回基本类型，可通过多次`useSelector`调用来选择多个state）。

  - debugger：透传给[observer-util](https://github.com/nx-js/observer-util#boolean--isobservableobject)，一般用于调试打印一些日志

<details>
<summary><strong>返回基本数据类型（推荐）</strong></summary>

```javascript
function Counter() {
  const num = useSelector(() => counter.num);
  
  return <div>{num}</div>;
}
```

</details>

<details>
<summary><strong>Computed(计算缓存)</strong></summary>

```js
function App() {
  const computed = useSelector(() => {
    const items = store.items; // select items from store

    return items.reduce((acc, item) => acc + item.value, 0);
  });
  
  return <div>{computed}</div>;
}
```

依赖计算：由于`useSelector`是一个custom hook，所以`selector`内部可以直接访问组件内部的任意变量（比如props）而不需要做任何的参数传递。

```javascript
function ComputedWithProps({ step }) {
  // 相当于computed
	const total = useSelector(() => counterStore.count + step);
}
```

</details>

<details>
<summary><strong>select多个store</strong></summary>

```javascript
function CompWithMutlStore() {
  // 当且仅当store1的count值或者store2的step值改变时才会re-render，result总会是最新的计算结果
	const result = useSelector(() => store1.count + store2.step);
}
```

</details>

<details>
<summary>返回复杂对象时建议传入equals函数，用于复杂对象diff（默认是全等对比）</summary>

```js
function TodoView() {
  const [isEmpty, hasCompleted, allCompleted, active, filter] = useSelector(
    () => [
      todoStore.isEmpty,
      todoStore.hasCompleted,
      todoStore.allCompleted,
      todoStore.activeType,
      todoStore.filterType
    ],
    { equals: _.equals } // use lodash/isEqual
  );
  ...
}
```

</details>

:rotating_light:请注意：`selector` 的返回值必须是一个可序列化（serializable）类型（js对象、数组以及基本值），因为non-serializable值（如function、ES6 collection、Symbol、RegExp等）进行比较是无意义的，react-redux hooks也有此[限制](https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)，但是`store()`没这个限制（接受任意observeable对象），你可以在`selector`内部对non-serializable值进行serializable转换后再返回。

<details>
<summary><strong>:rotating_light:selector应该返回可序列化（serializable）值</strong></summary>

```js
function Component() {
  // DON'T DO THIS
  const familyMemebers = useSelector(() => person.familyMemebers);
  // DO THIS
  const [father, mother] = useSelector(() => [
    person.familyMemebers.get('father'),
    person.familyMemebers.get('mother')
  ]);
  ...
}
```

</details>

### 类组件绑定：`connect(selector, ownProps?)`

```ts
function connect<V extends {}, OwnProps = {}>(
  selector: Selector<V, OwnProps>,
  config?: Config<V>
): (classComponent: C) => ConnectedComponent<V, OwnProps>
```

`connect`是一个HOC，传参和`useSelector`基本一致，不同的是`selector`参数返回值需要是一个object（类似`mapStateToProps`），`OwnProps`和react-redux类似，connect支持ownProps。

<details>
<summary><strong>类组件写法</strong></summary>

```js
const selectToProps = () => ({ n: counter.n });

class Counter extends Component {
 render() {
   return <div onClick={counter.inc}>{n}</div>;
 }
}

export default const ConnectedCounter = connect(selectToProps)(Counter);
```

</details>

<details>
<summary><strong>支持ownProps</strong></summary>

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

</details>

### `<HoduxConfig equals={fn} debugger={fn} />`

- type：`React.FunctionComponent<React.PropsWithChildren<Config<any>>>`
- 作用：全局config provider，组件可自行传入参数覆盖全局配置。

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

- 签名：`function batch(fn: Function) => void`
- 作用：`unstable_batchedUpdates` API的简单封装，用于在异步环境下批量更新state。

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

## 💿 本地运行示例

[examples](examples)文件夹包含所有可用代码示例，可以通过以下命令运行示例代码：

```bash
$ cd examples/[folder] && npm run install && npm start
```

然后用浏览器打开<http://localhost:3000>即可。

## License

MIT
