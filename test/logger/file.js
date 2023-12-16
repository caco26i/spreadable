import { beforeAll, expect, test, describe } from "bun:test";

import fse from 'fs-extra';
import path from 'path';
import tools from '../tools';
import LoggerFileFactory from '../../src/logger/transports/file';
const LoggerFile = LoggerFileFactory();

describe('LoggerConsole', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let logger;
  let folder;

  beforeAll(() => {
    folder = path.join(tools.tmpPath, 'file-logs');
  });

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => logger = new LoggerFile({ folder, level: 'info' })).not.toThrow();
      logger.node = testContext.node;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await logger.init();
    }); 
    
    test('should create the first file', async () => {
      expect((await fse.readdir(folder)).length).toBe(1);
    }); 
  });

  describe('.getMessageSize()', () => { 
    test('should return the right size', () => {
      const prepared = logger.prepareMessage('test', 'info');
      expect(logger.getMessageSize(prepared)).toEqual(Buffer.byteLength(prepared, 'utf8'));
    }); 
  });

  describe('.prepareMessage()', () => { 
    test('should prepare the right message', () => {
      const message = 'test';
      const level = 'warn';
      const prepared = logger.prepareMessage(message, level);
      const json = JSON.parse(prepared);
      expect(message).toEqual(json.message);
      expect(level).toEqual(json.level);
      expect(new Date(json.date).getTime()).not.toBe();
    }); 
  });

  describe('.info()', () => { 
    test('should write nothing', async () => {
      logger.level = 'warn';
      const message = 'test info';
      const prepared = logger.prepareMessage(message, 'info');
      await logger.info(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(content.toString().match(prepared)).toBeFalsy();
    }); 

    test('should write the info message', async () => {
      logger.level = 'info';
      const message = 'test info';
      const prepared = logger.prepareMessage(message, 'info');
      await logger.info(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(content.toString().match(prepared)).toBeTruthy();
    });     
  });

  describe('.warn()', () => { 
    test('should write nothing', async () => {
      logger.level = 'error';
      const message = 'test warn';
      const prepared = logger.prepareMessage(message, 'warn');
      await logger.warn(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(content.toString().match(prepared)).toBeFalsy();
    }); 

    test('should write the warn message', async () => {
      logger.level = 'warn';
      const message = 'test warn';
      const prepared = logger.prepareMessage(message, 'warn');
      await logger.warn(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(content.toString().match(prepared)).toBeTruthy();
    }); 
  });

  describe('.error()', () => { 
    test('should write nothing', async () => {
      logger.level = false;
      const message = 'test error';
      const prepared = logger.prepareMessage(message, 'error');
      await logger.error(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(content.toString().match(prepared)).toBeFalsy();
    }); 

    test('should write the error message', async () => {
      logger.level = 'error';
      const message = 'test error';
      const prepared = logger.prepareMessage(message, 'error');
      await logger.error(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(content.toString().match(prepared)).toBeTruthy();
    }); 
  });

  describe('.log()', () => { 
    test('should write in a new file', async () => {
      logger.level = 'info';
      const message = 'test';
      const first = logger.getLastFile();
      logger.options.fileMaxSize = first.stat.size;
      const prepared = logger.prepareMessage(message, 'info');
      await logger.info(message);
      const last = logger.getLastFile();
      const content = await fse.readFile(last.filePath);
      expect(first.filePath).not.toEqual(last.filePath);
      expect(content.toString()).toEqual(prepared + '\n');
    }); 

    test('should add messages in parallel', async () => {
      logger.options.fileMaxSize = '10mb';
      const messages = [];
      const p = []
      
      for(let i = 1; i < 10; i++) {
        messages.push('$$' + i);
        p.push(logger.info(messages[messages.length - 1]));
      }

      await Promise.all(p);
      const last = logger.getLastFile();
      const content = (await fse.readFile(last.filePath)).toString();
      
      for(let i = 0; i < messages.length; i++) {
        expect(content.indexOf(messages[i]) >= 0).toBeTruthy();
      }
    }); 
  });

  describe('.addNewFile()', () => { 
    test('should create a new file', async () => {
      const files = await fse.readdir(folder);
      const prev = logger.getLastFile();
      const file = await logger.addNewFile();
      const last = logger.getLastFile();
      expect(files.length + 1).toEqual((await fse.readdir(folder)).length);
      expect(file.index).toEqual(prev.index + 1);
      expect(file.filePath != prev.filePath && file.filePath == last.filePath).toBe(true);
      assert.containsAllKeys(file.stat, ['size'], 'check the stat');
    }); 
  });

  describe('.getLastFile()', () => { 
    test('should get the last file', async () => {
      const files = await fse.readdir(folder);
      let max = 1;

      for(let i = 0; i < files.length; i++) {
        const index = parseInt(path.basename(files[i]));
        index > max && (max = index);
      }

      const first = logger.getLastFile();
      expect(first.index).toEqual(max);
      await logger.addNewFile();
      const last = logger.getLastFile();
      expect(first.index + 1).toEqual(last.index);
    }); 
  });

  describe('.normalizeFilesCount()', () => { 
    beforeAll(async () => {
      await fse.emptyDir(folder);
    });

    test('should create a new file', async () => {
      await logger.normalizeFilesCount();
      const files = await fse.readdir(folder);
      expect(files.length).toEqual(1);
    }); 

    test('should remove excess files', async () => {
      const count = logger.options.filesCount + 2;

      for(let i = 0; i < count; i++) {
        await logger.addNewFile();
      }

      await logger.normalizeFilesCount();
      const files = await fse.readdir(folder);
      expect(files.length).toEqual(logger.options.filesCount);
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

    test('should remove the folder', async () => {
      expect(await fse.pathExists(folder)).toBe(false);
    }); 
  });
});