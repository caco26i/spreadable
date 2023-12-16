import { beforeAll, afterAll, describe } from "bun:test";
import {ensureDir, remove} from 'fs-extra';
import tools from './tools';

describe('spreadable', () => {
  beforeAll(() => ensureDir(tools.tmpPath));
  afterAll(() => remove(tools.tmpPath));
  require('./utils');
  // require('./utils');
  //require('./service');
  // require('./node');
  // require('./client');
  // require('./services');
  // require('./routes');
  // require('./group');
});