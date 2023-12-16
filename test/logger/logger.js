import { beforeAll, expect, test, describe } from "bun:test";

import LoggerFactory from '../../src/logger/transports/logger';
const Logger = LoggerFactory();

describe('Logger', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let logger;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => logger = new Logger()).not.toThrow();
      logger.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await logger.init();
    });  
  });

  describe('.setLevel()', () => {
    test('should set the level', () => {
      const level = 'warn';
      expect(logger.level).toEqual(logger.defaultLevel);
      logger.setLevel(level);
      expect(logger.level).toEqual(level);
    });

    test('should throw an error with wrong level', () => {
      expect(() => logger.setLevel('wrong')).toThrow();
    });

    test('should set the false', () => {
      logger.setLevel(false);
      expect(logger.level).toBe(false);
    });
  });

  describe('.isLevelActive()', () => {
    test('should check the false level', () => {
      logger.isLevelActive('warn', 'check warn');
      logger.isLevelActive('info', 'check info');
      logger.isLevelActive('error', 'check error');
    });

    test('should check the info level', () => {
      logger.setLevel('info');
      expect(logger.isLevelActive('info')).toBe(true);
      expect(logger.isLevelActive('warn')).toBe(true);
      expect(logger.isLevelActive('error')).toBe(true);
    }); 

    test('should check the warn level', () => {
      logger.setLevel('warn');
      expect(logger.isLevelActive('info')).toBe(false);
      expect(logger.isLevelActive('warn')).toBe(true);
      expect(logger.isLevelActive('error')).toBe(true);
    }); 

    test('should check the error level', () => {
      logger.setLevel('error');
      expect(logger.isLevelActive('info')).toBe(false);
      expect(logger.isLevelActive('warn')).toBe(false);
      expect(logger.isLevelActive('error')).toBe(true);
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