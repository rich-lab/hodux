import { createStore, batch } from 'hodux';

let c = 0;

const counter = createStore({
  c: 0,
  loading: false,
  m: new Set(),
  state: {
    count: 0,
    list: [{ c }],
    nested: {
      foo: 'bar',
    },
  },
  add() {
    counter.state.count += 1;
    // console.log("apply add()", this === counter);
  },
  setAdd() {
    counter.m.add(1);
  },
  setLoading(loading: boolean) {
    counter.loading = loading;
  },
  async addx(n = 1) {
    // console.log("apply addx()");
    if (counter.loading) return;

    counter.setLoading(true); // bad case: this.setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    batch(() => {
      counter.state.count += n;
      counter.setLoading(false);
    });
  },
  addxx: async () => {},
  nested() {
    counter.state.nested.foo = `biz_${c++}`;
    counter.state.list[0].c = c;
  },
});

export default counter;
