import { beforeAll, expect, test, describe } from "bun:test";

import DatabaseFactory from '../../src/db/transports/database';
const Database = DatabaseFactory();

describe('Database', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let db;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => db = new Database()).not.toThrow();
      db.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await db.init();
    });  
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await db.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await db.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await db.destroy();
    });
  });
});