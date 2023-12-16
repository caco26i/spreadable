import { beforeAll, expect, test, describe } from "bun:test";

import BehaviorFailFactory from '../../src/behavior/transports/fail';
const BehaviorFail = BehaviorFailFactory();

describe('Behavior', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let behavior;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => behavior = new BehaviorFail()).not.toThrow();
      behavior.node = testContext.node;
    });

    test('should create the default properties', () => {
      assert.containsAllKeys(behavior, ['ban', 'banLifetime', 'failSuspicionLevel']);
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await behavior.init();
    });  
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await behavior.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await behavior.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await behavior.destroy();
    });
  });
});