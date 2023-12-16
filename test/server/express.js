import { beforeAll, expect, test, describe } from "bun:test";

import ServerExpressFactory from '../../src/server/transports/express';
const ServerExpress = ServerExpressFactory();

describe('ServerExpress', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let server;
  let nodeServer;

  describe('instance creation', () => {
    test('should create an instance', () => { 
      expect(() => server = new ServerExpress()).not.toThrow();  
      server.node = testContext.node;
      nodeServer = testContext.node.server;
      testContext.node.server = server; 
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await server.init();
    });
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await server.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await server.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await server.destroy();
      testContext.node.server = nodeServer; 
    });
  });
});