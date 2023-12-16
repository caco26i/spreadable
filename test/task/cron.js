import { beforeAll, expect, test, describe } from "bun:test";

import TaskCronFactory from '../../src/task/transports/cron';
const TaskCron = TaskCronFactory();
import tools from '../tools';

describe('TaskCron', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let task;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => task = new TaskCron()).not.toThrow();
      task.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await task.init();
    });  
  });

  describe('.start()', () => { 
    test('should start the task every 1s', async () => {
      let counter = 0;
      const interval = 1000;
      const res = await task.add('test', '* * * * * *', () => counter++);      
      await task.start(res);
      expect(counter).toEqual(0);
      await tools.wait(interval * 2);
      expect(counter > 0).toBeTruthy();
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