import { beforeAll, expect, test, describe } from "bun:test";

import TaskIntervalFactory from '../../src/task/transports/interval';
const TaskInterval = TaskIntervalFactory();
import tools from '../tools';

describe('TaskInterval', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let task;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => task = new TaskInterval()).not.toThrow();
      task.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await task.init();
    });  
  });

  describe('.start()', () => { 
    test('should start the task every 100ms', async () => {
      let counter = 0;
      const interval = 100;
      const res = await task.add('test', interval, () => counter++);      
      await task.start(res);
      expect(counter).toEqual(0);
      await tools.wait(interval / 2);
      expect(counter).toEqual(0);
      await tools.wait(interval / 2);
      expect(counter).toEqual(1);
      await tools.wait(interval);
      expect(counter).toEqual(2);
    });
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await task.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await task.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await task.destroy();
    });
  });
});