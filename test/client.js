import { beforeAll, afterAll, expect, test, describe } from "bun:test";
import NodeFactory from '../src/node';
const Node = NodeFactory();
import ClientFactory from '../src/client';
const Client = ClientFactory();
import ApprovalClientFactory from '../src/approval/transports/client';
const ApprovalClient = ApprovalClientFactory();
import tools from './tools';

describe('Client', () => {
  let client;
  let node;

  beforeAll(async () => {
    node = new Node(await tools.createNodeOptions());
    await node.addApproval('test', new ApprovalClient());
    await node.init();
    const options = await tools.createClientOptions({ address: node.address });
    client = new Client(options);
  });

  afterAll(async () => {
    await node.deinit();
  });

  describe('instance creation', () => {
    test('should create an instance', async () => { 
      expect(client).toBeDefined();
    });
  });

  describe('.init()', () => {
    test('should not throw an exception', async () => {
      console.log("debug client")
      console.log(client)
      await client.init();
    });

    test('should set the worker address', async () => {
      expect(client.workerAddress).toEqual(node.address);
    });
  });

  describe('.getApprovalQuestion()', () => {
    test('should return approval info', async () => {
      const info = await client.getApprovalQuestion('test');
      expect(info.question).toBeDefined();
    });      
  });
  
  describe('.deinit()', () => {
    test('should not throw an exception', async () => {
      await client.deinit();
    });
  });
});