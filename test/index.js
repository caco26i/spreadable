import fse from 'fs-extra';
import tools from './tools';

describe('spreadable', () => {
  beforeAll(() => fse.ensureDir(tools.tmpPath));
  afterAll(() => fse.remove(tools.tmpPath));
  require('./utils');
  require('./service');
  require('./node');
  require('./client');
  require('./services');
  require('./routes');
  require('./group');
});