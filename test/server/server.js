import { beforeAll, expect, test, describe } from "bun:test";

import fetch from 'node-fetch';
import https from 'https';
import ServerFactory from '../../src/server/transports/server';
const Server = ServerFactory();
import utils from '../../src/utils';
import selfsigned from 'selfsigned';

describe('Server', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let server;
  let nodeServer;

  describe('instance creation', () => {
    test('should create an instance', () => { 
      expect(() => server = new Server()).not.toThrow();
      server.node = testContext.node;
      nodeServer = testContext.node.server;
      testContext.node.server = server;
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await server.init();
    });
    
    test('should ping to the server', async () => {
      const res = await fetch(`http://${testContext.node.address}`);  
      expect(res.status).toEqual(200);
    });
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await server.deinit();
    });

    test('should not ping to the server', async () => {
      expect(await utils.isPortUsed(testContext.node.port)).toBe(false);
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => { 
      const pems = selfsigned.generate();
      server.options.https = { key: pems.private, cert: pems.cert, ca: pems.clientcert };
      await server.init();
    });

    test('should ping to the server', async () => {  
      const agent = new https.Agent({ rejectUnauthorized: false });
      const res = await fetch(`https://${testContext.node.address}`, { agent });  
      expect(res.status).toEqual(200);
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await server.destroy();
      testContext.node.server = nodeServer;
    });

    test('should not ping to the server', async () => {
      expect(await utils.isPortUsed(testContext.node.port)).toBe(false);
    });
  });
});