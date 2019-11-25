import { observable } from '@nx-js/observer-util';

import { rawToProxy } from './internals';

export default function createStore<T extends object>(model: T): T {
  let store = rawToProxy.get(model);

  if (store) return store;

  store = observable(model);
  rawToProxy.set(model, store);

  return store;
}
