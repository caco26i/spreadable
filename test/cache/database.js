import { beforeAll, expect, test, describe } from "bun:test";

import CacheDatabaseFactory from '../../src/cache/transports/database';
const CacheDatabase = CacheDatabaseFactory();

describe('CacheDatabase', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let cache;
  let type;

  beforeAll(() => {
    type = 'test';
  });

  describe('instance creation', () => {
    test('should create an instance', () => { 
      expect(() => cache = new CacheDatabase()).not.toThrow(); 
      cache.node = testContext.node;
      cache.name = 'test';   
    });    
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await cache.init();
    });  
  });

  describe('.set()', () => {
    test('should add the cache', async () => { 
      const key = 'key1'; 
      const value = 1;
      await cache.set(key, value);
      const res = await testContext.node.db.getCache(type, key);
      expect(res.value).toEqual(value);
    });
  });

  describe('.get()', () => {
    test('should get the cache', async () => {
      const res = await cache.get('key1');
      expect(res.value).toEqual(1);
    });
  });

  describe('.remove()', () => {
    test('should remove the cache', async () => {
      await cache.remove('key1');
      expect(await cache.get('key1')).toBeNull();
    });
  });

  describe('.flush()', () => {
    test('should remove the cache', async () => {
      const key = 'key';
      await cache.set(key, 1);
      await cache.flush();
      expect(await cache.get(key)).toBeNull();
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