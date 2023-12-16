import { afterAll, beforeAll, expect, test, describe } from "bun:test";
import NodeFactory from '../src/node';
const Node = NodeFactory();
import tools from './tools';
import fse from 'fs-extra';

describe('Node', () => {
  let node;

  describe('instance creation', () => {
    test('should not create an instance because of port', async () => {
      const options = await tools.createNodeOptions({ port: '' });
      expect(() => new Node(options)).toThrow();      
    });

    test('should create an instance', async() => { 
      const options = await tools.createNodeOptions();
      expect(() => node = new Node(options)).not.toThrow();
    });
  });

  describe('.init()', () => {
    test('should not throw an exception', async () => {
      await node.init();
    });

    test('should create the db file', async () => {
      expect(await fse.pathExists(tools.getDbFilePath(node))).toBe(true);
    });
  });

  describe('.getValueGivenNetworkSize()', () => {
    let networkSize;

    beforeAll(async () => {
      for(let i = 0; i < 9; i++) {
        await node.db.addMaster(`localhost:${i + 1}`, 1);
      }

      networkSize = await node.getNetworkSize();
    });

    afterAll(async () => {
      await node.db.removeMasters();
    });

    test('should return the specified option value', async () => {
      const val = 2;
      expect(await node.getValueGivenNetworkSize(val)).toEqual(val);
    });

    test('should return the percentage', async () => {
      expect(await node.getValueGivenNetworkSize('50%')).toEqual(Math.ceil(networkSize / 2));
    });

    test('should return sqrt', async () => {
      expect(await node.getValueGivenNetworkSize('auto')).toEqual(Math.ceil(Math.sqrt(networkSize)));
    });

    test('should return the network size', async () => {
      expect(await node.getValueGivenNetworkSize(networkSize + 10)).toEqual(networkSize);
    });
  });

  describe('.deinit()', () => {
    test('should not throw an exception', async () => {
      await node.deinit();
    });

    test('should not remove the db file', async () => {
      expect(await fse.pathExists(tools.getDbFilePath(node))).toBe(true);
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await node.init();
    });

    test('should create the db file', async () => {
      expect(await fse.pathExists(tools.getDbFilePath(node))).toBe(true);
    });
  });

  describe('.destroy()', () => {
    test('should not throw an exception', async () => {
      await node.destroy();
    });

    test('should remove the db file', async () => {
      expect(await fse.pathExists(tools.getDbFilePath(node))).toBe(false);
    });
  });
});