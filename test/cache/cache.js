import { beforeAll, expect, test, describe } from "bun:test";

import CacheFactory from '../../src/cache/transports/cache';
const Cache = CacheFactory();

describe('Cache', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let cache;

  describe('instance creation', () => {
    test('should create an instance', () => { 
      expect(() => cache = new Cache()).not.toThrow();  
      cache.node = testContext.node;
      cache.name = 'test';
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await cache.init();
    });  
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await cache.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await cache.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await cache.destroy();
    });
  });
});