import { observable } from '@nx-js/observer-util';

import { rawToProxy } from './internals';

export default function createStore<M extends object>(model: M): M {
  let store = rawToProxy.get(model);

  if (store) return store;

  store = observable(model);
  rawToProxy.set(model, store);

  return store;
}
