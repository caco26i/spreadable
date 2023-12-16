import { afterAll, beforeAll, expect, test, describe } from "bun:test";

import LoggerConsoleFactory from '../../src/logger/transports/console';
const LoggerConsole = LoggerConsoleFactory();

describe('LoggerConsole', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let logger;
  let fn;
  let status;
  let levels;

  beforeAll(() => {
    status = {};
    fn = {};
    levels = ['info', 'warn', 'error'];

    for(let i = 0; i < levels.length; i++) {
      const level = levels[i];
      status[level] = 0;
      //eslint-disable-next-line no-console
      fn[level] = console[level], console[level] = () => status[level]++;
    }
  });

  afterAll(() => {
    for(let i = 0; i < levels.length; i++) {
      const level = levels[i];
      //eslint-disable-next-line no-console
      console[level] = fn[level]
    }
  });

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => logger = new LoggerConsole()).not.toThrow();
      logger.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await logger.init();
    });  
  });

  describe('.info()', () => { 
    test('should not increment', async () => {
      logger.level = 'warn';
      await logger.info('test info');
      expect(status['info']).toEqual(0);
    }); 

    test('should increment', async () => {
      logger.level = 'info';
      await logger.info('test info');
      expect(status['info']).toEqual(1);
    }); 
  });

  describe('.warn()', () => { 
    test('should not increment', async () => {
      logger.level = 'error';
      await logger.info('test warn');
      expect(status['warn']).toEqual(0);
    });

    test('should increment', async () => {
      logger.level = 'warn';
      await logger.warn('test warn');
      expect(status['warn']).toEqual(1);
    });    
  });

  describe('.error()', () => { 
    test('should not increment', async () => {
      logger.level = false;
      await logger.info('test warn');
      expect(status['error']).toEqual(0);
    });

    test('should increment', async () => {
      logger.level = 'error';
      await logger.error('test error');
      expect(status['error']).toEqual(1);
    });    
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await logger.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await logger.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await logger.destroy();
    });
  });
});