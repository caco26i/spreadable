import { beforeAll, expect, test, describe } from "bun:test";

import LoggerAdapterFactory from '../../src/logger/transports/adapter';
const LoggerAdapter = LoggerAdapterFactory();
import LoggerFactory from '../../src/logger/transports/logger';
const Logger = LoggerFactory();
import transports from '../../src/logger';

class LoggerInterface extends Logger {
  constructor() {
    super(...arguments);
    this.infoCounter = 0;
    this.warnCounter = 0;
    this.errorCounter = 0;
    this.initCounter = 0;
    this.deinitCounter = 0;
    this.destroyCounter = 0;
  }

  async log(level) {    
    this[level + 'Counter']++;
  }

  async init() {
    this.initCounter++;
  }

  async deinit() {
    this.deinitCounter++;
  }

  async destroy() {
    this.destroyCounter++;
  }
}

transports.LoggerInterface = LoggerInterface;

describe('LoggerConsole', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let logger;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => logger = new LoggerAdapter( { 
        transports: [
          { transport: LoggerInterface, options: { x: 1 } },
          { transport: 'LoggerInterface', options: { x: 2 } }
        ]
      })).not.toThrow();
      logger.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await logger.init();
    });  

    test('should add two transports', async () => {
      expect(logger.transports.length).toEqual(2);
    }); 

    test('should add the transport options', async () => {
      expect(logger.transports[0].options.x).toEqual(1);
      expect(logger.transports[1].options.x).toEqual(2);
    }); 

    test('should increment', async () => {
      expect(logger.transports[0].initCounter).toEqual(1);
      expect(logger.transports[1].initCounter).toEqual(1);
    }); 
  });

  describe('.info()', () => { 
    test('should not increment', async () => {
      logger.level = 'warn';
      await logger.info();
      expect(logger.transports[0].infoCounter).toEqual(0);
      expect(logger.transports[1].infoCounter).toEqual(0);
    }); 

    test('should increment', async () => {
      logger.level = 'info';
      await logger.info();
      expect(logger.transports[0].infoCounter).toEqual(1);
      expect(logger.transports[1].infoCounter).toEqual(1);
    }); 
  });

  describe('.warn()', () => { 
    test('should not increment', async () => {
      logger.level = 'error';
      await logger.info();
      expect(logger.transports[0].warnCounter).toEqual(0);
      expect(logger.transports[1].warnCounter).toEqual(0);
    });

    test('should increment', async () => {
      logger.level = 'warn';
      await logger.warn();
      expect(logger.transports[0].warnCounter).toEqual(1);
      expect(logger.transports[1].warnCounter).toEqual(1);
    });    
  });

  describe('.error()', () => { 
    test('should not increment', async () => {
      logger.level = false;
      await logger.info();
      expect(logger.transports[0].errorCounter).toEqual(0);
      expect(logger.transports[1].errorCounter).toEqual(0);
    });

    test('should increment', async () => {
      logger.level = 'error';
      await logger.error();
      expect(logger.transports[0].errorCounter).toEqual(1);
      expect(logger.transports[1].errorCounter).toEqual(1);
    });    
  });

  describe('.addTransport()', () => { 
    test('should add a new transport', async () => {
      logger.addTransport(new LoggerInterface({ x: 3 }));
      expect(logger.transports[2].options.x).toEqual(3);
    });  
  });

  describe('.removeTransport()', () => { 
    test('should add a new transport', async () => {
      logger.removeTransport(logger.transports[2]);
      expect(logger.transports[2]).not.toBeDefined();
    });  
  });

  describe('.deinit()', () => { 
    let first;
    let second;

    beforeAll(() => {
      first = logger.transports[0];
      second = logger.transports[1];
    });

    test('should not throw an exception', async () => {
      await logger.deinit();
    });

    test('should remove transports', async () => {
      expect(logger.transports.length).toBe(0);
    });

    test('should increment', async () => {
      expect(first.deinitCounter).toEqual(1);
      expect(second.deinitCounter).toEqual(1);
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await logger.init();
    });

    test('should increment', async () => {
      expect(logger.transports[0].initCounter).toEqual(1);
      expect(logger.transports[1].initCounter).toEqual(1);
    });
  });

  describe('.destroy()', () => { 
    let first;
    let second;

    beforeAll(() => {
      first = logger.transports[0];
      second = logger.transports[1];
    });

    test('should not throw an exception', async () => {
      await logger.destroy();
    });

    test('should increment', async () => {
      expect(first.destroyCounter).toEqual(1);
      expect(second.destroyCounter).toEqual(1);
    });
  });
});