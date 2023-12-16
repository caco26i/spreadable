import { beforeAll, expect, test, describe } from "bun:test";

import TaskFactory from '../../src/task/transports/task';
const Task = TaskFactory();
import tools from '../tools';

describe('Task', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let task;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => task = new Task()).not.toThrow();
      task.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await task.init();
    });  
  });

  describe('.add()', () => { 
    test('should create the task', async () => {
      const name = 'test';
      const interval = 1;
      const option = 1;
      await task.add(name, interval, () => {}, { test: option });
      const res = task.tasks[name];
      expect(typeof res).toBe('object');
      expect(res.name).toEqual(name);
      expect(res.interval).toEqual(interval);
      expect(res.test).toEqual(option);
    });

    test('should update the task', async () => {
      const name = 'test';
      const interval = 2;
      const option = 2;
      await task.add(name, interval, () => {}, { test: option });
      const res = task.tasks[name];
      expect(typeof res).toBe('object');
      expect(res.name).toEqual(name);
      expect(res.interval).toEqual(interval);
      expect(res.test).toEqual(option);
    }); 
  });

  describe('.get()', () => { 
    test('should get the task', async () => {
      const name = 'test';
      const interval = 2;
      const option = 2;
      const res = await task.get(name);
      expect(typeof res).toBe('object');
      expect(res.name).toEqual(name);
      expect(res.interval).toEqual(interval);
      expect(res.test).toEqual(option);
    }); 

    test('should not get the wrong task', async () => {
      expect(await task.get('wrong')).toBeNull();
    });
  });

  describe('.remove()', () => { 
    test('should remove the task', async () => {
      const name = 'test';
      await task.remove(name);
      expect(await task.get(name)).toBeNull();
    }); 
  });

  describe('.start()', () => { 
    test('should start the task', async () => { 
      const res = await task.add('test', 1, () => {});
      expect(res.isStopped).toBe(true);
      await task.start(res);
      expect(res.isStopped).toBe(false);
    }); 
  });

  describe('.stop()', () => { 
    test('should stop the task', async () => {
      const res = await task.get('test');
      expect(res.isStopped).toBe(false);
      await task.stop(res);
      expect(res.isStopped).toBe(true);
    }); 
  });

  describe('.run()', () => { 
    test('should run the task callback', async () => {
      let counter = 0;
      const res = await task.add('test', 1, () => counter++);
      await task.start(res);
      await task.run(res);
      expect(counter).toEqual(1);
    }); 
  });

  describe('blocking', () => { 
    test('should block the task', async () => {
      let counter = 0;
      let interval = 100;
      const res = await task.add('test', interval, async () => (await tools.wait(interval), counter++)); 
      await task.start(res); 
      await Promise.all([task.run(res), task.run(res)]);
      expect(counter).toEqual(1);
      await task.run(res);
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