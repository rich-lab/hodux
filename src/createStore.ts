import { observable } from '@nx-js/observer-util';
import invariant from 'invariant';

import { rawToProxy/* , proxyToRaw */ } from './internals';
import { isObject, isPlainObject } from './utils';

function hasModel(model: unknown): model is object {
  return isObject(model) && rawToProxy.has(model);
}

export default function createStore<M extends object = {}>(model: M): M {
  invariant(isPlainObject(model), 'model should be plain object!');

  if (hasModel(model)) return rawToProxy.get(model);

  const store = observable(model);

  rawToProxy.set(model, store);
  // proxyToRaw.set(store, model);

  return store;
}
