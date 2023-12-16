import { beforeAll, expect, test, describe } from "bun:test";

import BehaviorFactory from '../../src/behavior/transports/behavior';
const Behavior = BehaviorFactory();

describe('Behavior', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let behavior;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => behavior = new Behavior()).not.toThrow();
      behavior.node = testContext.node;
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