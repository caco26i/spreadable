import { afterAll, beforeAll, expect, test, describe } from "bun:test";
import fetch from 'node-fetch';
import NodeFactory from '../src/node';
const Node = NodeFactory();
import ClientFactory from '../src/client';
const Client = ClientFactory();
import ApprovalClientFactory from '../src/approval/transports/client';
const ApprovalClient = ApprovalClientFactory();
import utils from '../src/utils';
import schema from '../src/schema';
import tools from './tools';

describe('routes', () => {
  let node;
  let client;

  beforeAll(async () => {
    node = new Node(await tools.createNodeOptions({ 
      network: { 
        auth: { username: 'username', password: 'password' }
      } 
    }));
    await node.addApproval('test', new ApprovalClient());
    await node.init();
    await node.sync();
    client = new Client(await tools.createClientOptions({
      address: node.address, 
      auth: { username: 'username', password: 'password' }
    }));
    await client.init();
  });

  afterAll(async () => {
    await node.deinit();
    await client.deinit();
  });

  describe('/ping', () => {
    test('should return the right address', async () => { 
      const res = await fetch(`http://${node.address}/ping`);
      const json = await res.json();
      expect(json.address).toEqual(node.address);      
      expect(json.version).toEqual(node.getVersion());
    });
  });

  describe('/status', () => {
    test('should return an auth error', async () => { 
      const res = await fetch(`http://${node.address}/status`);
      expect(await res.status).toEqual(401);
    });

    test('should return the status', async () => { 
      const options = client.createDefaultRequestOptions({ method: 'get' });
      const res = await fetch(`http://${node.address}/status`, options);
      const json = await res.json();

      expect(() => {
        utils.validateSchema(schema.getStatusResponse(), json);
      }).not.toThrow();
    });

    test('should return the pretty status', async () => { 
      const options = client.createDefaultRequestOptions({ method: 'get' });
      const res = await fetch(`http://${node.address}/status?pretty`, options);
      const json = await res.json();
      
      expect(() => {
        utils.validateSchema(schema.getStatusPrettyResponse(), json);
      }).not.toThrow();
    });
  });  

  describe('/client/get-available-node', () => {
    test('should return an auth error', async () => { 
      const res = await fetch(`http://${node.address}/client/get-available-node`, { method: 'post' });
      expect(await res.status).toEqual(401);
    });

    test('should return the node address', async () => { 
      const options = client.createDefaultRequestOptions();
      const res = await fetch(`http://${node.address}/client/get-available-node`, options);
      const json = await res.json();

      expect(() => {
        utils.validateSchema(schema.getAvailableNodeResponse(), json);
      }).not.toThrow();
    });
  });

  describe('/client/request-approval-key', () => {
    test('should return an auth error', async () => { 
      const res = await fetch(`http://${node.address}/client/request-approval-key`, { method: 'post' });
      expect(await res.status).toEqual(401);
    });

    test('should return a data error', async () => { 
      const options = client.createDefaultRequestOptions();  
      const res = await fetch(`http://${node.address}/client/request-approval-key`, options);
      expect(res.status).toEqual(422);
    });

    test('should return the right schema', async () => {
      const body = { action: 'test' };
      const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/client/request-approval-key`, options);
      const json = await res.json();

      expect(() => {
        utils.validateSchema(schema.getRequestApprovalKeyResponse(), json);
      }).not.toThrow();
    });
  });

  describe('/client/add-approval-info', () => {
    test('should return an auth error', async () => { 
      const res = await fetch(`http://${node.address}/client/add-approval-info`, { method: 'post' });
      expect(await res.status).toEqual(401);
    });

    test('should return a data error', async () => { 
      const options = client.createDefaultRequestOptions();  
      const res = await fetch(`http://${node.address}/client/add-approval-info`, options);
      expect(res.status).toEqual(422);
    });

    test('should return the success message', async () => {
      const approval = await node.getApproval('test')
      const body = { 
        action: 'test',
        key: 'key',
        startedAt: utils.getClosestPeriodTime(Date.now(), approval.period)
      };
      const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/client/add-approval-info`, options);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('/client/request-approval-question', () => {
    test('should return an auth error', async () => { 
      const res = await fetch(`http://${node.address}/client/request-approval-question`, { method: 'post' });
      expect(await res.status).toEqual(401);
    });

    test('should return a data error', async () => { 
      const options = client.createDefaultRequestOptions();  
      const res = await fetch(`http://${node.address}/client/request-approval-question`, options);
      expect(res.status).toEqual(422);
    });

    test('should return the question', async () => {
      const body = { 
        action: 'test',
        key: 'key',
        confirmedAddresses: [node.address]
      };
      const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/client/request-approval-question`, options);
      const json = await res.json();
      expect(json.question).toBeDefined();
    });
  });

  describe('/api/node/get-approval-info', () => {
    test('should return an auth error', async () => { 
      const options = tools.createJsonRequestOptions();         
      const res = await fetch(`http://${node.address}/api/node/get-approval-info`, options);
      expect(await res.status).toEqual(401);
    });

    test('should return a data error', async () => { 
      const options = node.createDefaultRequestOptions();  
      const res = await fetch(`http://${node.address}/api/node/get-approval-info`, options);
      expect(res.status).toEqual(422);
    });

    test('should return the info', async () => {
      const body = { 
        action: 'test',
        key: 'key'
      };
      const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/api/node/get-approval-info`, options);
      const json = tools.createServerResponse(node.address, await res.json());
      expect(json.info).toBeDefined();
    });
  });

  describe('/api/node/check-approval-answer', () => {
    test('should return an auth error', async () => { 
      const options = tools.createJsonRequestOptions();         
      const res = await fetch(`http://${node.address}/api/node/check-approval-answer`, options);
      expect(await res.status).toEqual(401);
    });

    test('should return a data error', async () => { 
      const options = node.createDefaultRequestOptions();  
      const res = await fetch(`http://${node.address}/api/node/check-approval-answer`, options);
      expect(res.status).toEqual(422);
    });

    test('should return the success message', async () => {
      const approver = await node.db.getApproval('key');
      const body = { 
        action: 'test',
        key: 'key',
        clientIp: approver.clientIp,
        approvers: [node.address],
        answer: approver.answer
      };
      
      const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/api/node/check-approval-answer`, options);
      const json = tools.createServerResponse(node.address, await res.json());
      expect(json.success).toBe(true);
    });
  });

  describe('/api/node/register', () => {
    let targetNode;

    beforeAll(async () => {
      targetNode = new Node(await tools.createNodeOptions({ 
        initialNetworkAddress: node.address,
        network: node.options.network 
      }));
      await targetNode.init();
      await targetNode.sync();
    });

    afterAll(async () => {
      await targetNode.deinit();
    })

    test('should return an auth error', async () => {        
      const res = await fetch(`http://${node.address}/api/node/register`, { method: 'post' });
      expect(await res.status).toEqual(401);
    });

    test('should return an interview error', async () => {        
      const body = { target: 'localhost:1' };
      const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/api/node/register`, options);
      expect(await res.status).toEqual(422);
    });

    test('should return the right schema', async () => {
      const body = { target: targetNode.address };
      const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/api/node/register`, options);
      const json = tools.createServerResponse(node.address, await res.json());
      expect(() => {
        utils.validateSchema(schema.getRegisterResponse(), json);
      }).not.toThrow();
    });
  });

  describe('/api/node/structure', () => {
    test('should return an auth error', async () => { 
      const options = tools.createJsonRequestOptions();         
      const res = await fetch(`http://${node.address}/api/node/structure`, options);
      expect(await res.status).toEqual(401);
    });

    test('should return the right schema', async () => {
      const options = node.createDefaultRequestOptions();
      const res = await fetch(`http://${node.address}/api/node/structure`, options);
      const json = tools.createServerResponse(node.address, await res.json());
      expect(() => {
        utils.validateSchema(schema.getStructureResponse(), json);
      }).not.toThrow();
    });
  });

  describe('/api/node/get-interview-summary', () => {
    test('should return an auth error', async () => { 
      const options = tools.createJsonRequestOptions();         
      const res = await fetch(`http://${node.address}/api/node/get-interview-summary`, options);
      expect(await res.status).toEqual(401);
    });

    test('should return the right schema', async () => {
      const options = node.createDefaultRequestOptions();
      const res = await fetch(`http://${node.address}/api/node/get-interview-summary`, options);      
      const json = tools.createServerResponse(node.address, await res.json());      
      expect(() => {
        utils.validateSchema(schema.getInterviewSummaryResponse(), json);
      }).not.toThrow();
    });
  });

  describe('/api/node/provide-registration', () => {
    test('should return an auth error', async () => {         
      const res = await fetch(`http://${node.address}/api/node/provide-registration`, { method: 'post' });
      expect(await res.status).toEqual(401);
    });

    test('should return the right schema', async () => {
      const body = { target: node.address };
      const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
      const res = await fetch(`http://${node.address}/api/node/provide-registration`, options);
      const json = tools.createServerResponse(node.address, await res.json());
      expect(() => {
        utils.validateSchema(schema.getProvideRegistrationResponse(), json);
      }).not.toThrow();
    });
  });
});