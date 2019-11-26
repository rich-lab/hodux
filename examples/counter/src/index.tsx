import React from 'react';
import { render } from 'react-dom';

import deepEqual from 'fast-deep-equal';

import { HoduxConfig } from 'hodux';

import App from './components/App';

render(
  <HoduxConfig equals={deepEqual}>
    <App />
  </HoduxConfig>,
  document.getElementById('root'),
);
