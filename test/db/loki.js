import { beforeAll, expect, test, describe } from "bun:test";

import fse from 'fs-extra';
import path from 'path';
import tools from '../tools';
import utils from '../../src/utils';
import DatabaseLokiFactory from '../../src/db/transports/loki';
const DatabaseLoki = DatabaseLokiFactory();
import BehaviorFailFactory from '../../src/behavior/transports/fail';
const BehaviorFail = BehaviorFailFactory();
import ApprovalFactory from '../../src/approval/transports/approval';
const Approval = ApprovalFactory();

describe('DatabaseLoki', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let loki;
  let lastNodeDb;

  describe('instance creation', () => {
    test('should create an instance', () => { 
      expect(() => loki = new DatabaseLoki({
        filename: tools.getDbFilePath(this.node)
      })).not.toThrow();  
      loki.node = testContext.node;
      lastNodeDb = testContext.node.db;
      testContext.node.db = loki;  
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await loki.init();
    });  
    
    test('should create the db file', async () => {    
      expect(await fse.pathExists(tools.getDbFilePath(testContext.node))).toBe(true);
    });
  });

  describe('.setData()', () => { 
    test('should set the value', async () => {
      await loki.setData('test', 'test');
      const obj = loki.col.data.findOne({ name: 'test' });
      expect(obj.value).toEqual('test');
    }); 
  });

  describe('.getData()', () => { 
    test('should get the value', async () => {
      expect(await loki.getData('test')).toEqual('test');
    }); 
  });

  describe('.addSlave()', () => {
    test('should add the slave', async () => {
      const address = 'localhost:1';
      await loki.addSlave(address);
      expect(typeof (await loki.col.servers.findOne({ address, isSlave: true }))).toBe('object');
    }); 

    test('should edit the slave', async () => {
      const address = 'localhost:1';
      await loki.addSlave(address);
      const servers = await loki.col.servers.find({ address, isSlave: true });
      expect(servers.length).toEqual(1);
    });
  });

  describe('.hasSlave()', () => {
    test('should return true', async () => {
      expect(await loki.hasSlave('localhost:1')).toBe(true);
    }); 

    test('should not return true', async () => {  
      expect(await loki.hasSlave('undefined')).toBe(false);
    });
  });

  describe('.getSlaves()', () => {
    test('should get one slave', async () => {
      const slaves = await loki.getSlaves();
      expect(slaves.length).toEqual(1);
    });

    test('should get two slaves', async () => {
      await loki.addSlave('localhost:2');
      const slaves = await loki.getSlaves();
      expect(slaves.length).toEqual(2);
    });
  });

  describe('.addBacklink()', () => {
    test('should add the backlink', async () => {
      const address = 'localhost:3';
      await loki.addBacklink(address);
      expect(typeof (await loki.col.servers.findOne({ address, isBacklink: true }))).toBe('object');
    });

    test(
      'should change the backlink and add it into the existent slave',
      async () => {
        const address = 'localhost:1';
        await loki.addBacklink(address);
        const servers = await loki.col.servers.find({ address, isBacklink: true });
        expect(servers.length).toEqual(1);
        expect(servers[0].isSlave).toBe(true);
      }
    );

    test('should edit the slave', async () => {
      const address = 'localhost:1';
      await loki.addBacklink(address);
      const servers = await loki.col.servers.find({ address });
      expect(servers.length).toEqual(1);
    });
  });

  describe('.getBacklink()', () => {
    test('should get the backlink', async () => {
      const backlink = await loki.getBacklink();
      expect(backlink.isBacklink).toBe(true);
    });
  });

  describe('.addMaster()', () => {
    test('should add the master', async () => {
      const address = 'localhost:3';
      await loki.addMaster(address, 0);
      expect(typeof (await loki.col.servers.findOne({ address, isMaster: true }))).toBe('object');
    }); 

    test(
      'should change the master and add it into the existent slave',
      async () => {
        const address = 'localhost:1';
        await loki.addMaster(address, 1);
        const servers = await loki.col.servers.find({ address, isMaster: true });
        expect(servers.length).toEqual(1);
        expect(servers[0].isSlave).toBe(true);
      }
    );

    test('should edit the master', async () => {
      const address = 'localhost:1';
      await loki.addMaster(address, 2);
      const servers = await loki.col.servers.find({ address, isMaster: true });
      const obj = servers[0];
      expect(servers.length).toEqual(1);
      expect(obj.size).toEqual(2);
    });
  });

  describe('.getMastersCount()', () => {
    test('should return two', async () => {
      expect(await loki.getMastersCount()).toEqual(2);
    });

    test('should return three', async () => {
      await loki.addMaster('localhost:4', 0);
      expect(await loki.getMastersCount()).toEqual(3);
    });
  });

  describe('.getSlavesCount()', () => {
    test('should return two', async () => {
      expect(await loki.getSlavesCount()).toEqual(2);
    });

    test('should return three', async () => {
      await loki.addSlave('localhost:5', 0);
      expect(await loki.getSlavesCount()).toEqual(3);
    });
  });

  describe('.getMasters()', () => {
    test('should return three masters', async () => {
      const masters = await loki.getMasters();
      expect(masters.length).toEqual(3);

      for(let i = 0; i < masters.length; i++) {
        expect(masters[i].isMaster).toBe(true);
      }
    });
  });

  describe('.getMaster()', () => {
    test('should return the necessary master', async () => {
      const master = await loki.getMaster('localhost:4');
      expect(master.address).toEqual('localhost:4');
    });

    test('should not return the wrong master', async () => {
      expect(await loki.getMaster('localhost:2')).toBeNull();
    });
  });

  describe('.getServer()', () => {
    test('should return the necessary server', async () => {
      const server = await loki.getServer('localhost:4');
      expect(server.address).toEqual('localhost:4');
    });

    test('should not return the wrong server', async () => {
      expect(await loki.getServer('localhost:20')).toBeNull();
    });
  });

  describe('.getServers()', () => {
    test('should return all servers', async () => {
      const servers = await loki.getServers('localhost:4');
      expect(servers.length).toEqual(5);
    });
  });

  describe('.removeSlave()', () => {
    test('should remove new slave', async () => {
      const count = await loki.getSlavesCount();
      await loki.addSlave('localhost:6');
      expect(await loki.getSlavesCount()).toEqual(count + 1);
      await loki.removeSlave('localhost:6');
      expect(await loki.getSlavesCount()).toEqual(count);
    });
  });

  describe('.removeSlaves()', () => {
    test('should remove all slaves', async () => {
      const count = await loki.getSlavesCount();
      expect(count > 0).toBeTruthy();
      await loki.removeSlaves();
      expect(await loki.getSlavesCount()).toEqual(0);
      expect((await loki.getSlaves()).length).toEqual(0);
      expect((await loki.getServers()).length).toEqual(3);
    });
  });

  describe('.isMaster()', () => {
    test('should be false', async () => {
      expect(await loki.isMaster()).toBe(false);
    });

    test('should be true', async () => {
      await loki.addSlave('localhost:1');
      expect(await loki.isMaster()).toBe(true);
    });
  });

  describe('.shiftSlaves()', () => {
    test('should shift 2 slaves', async () => {
      await loki.addSlave('localhost:2');
      await loki.addSlave('localhost:3');
      const count = await loki.getSlavesCount();
      const limit = 2;
      await loki.shiftSlaves(limit);
      expect(await loki.getSlavesCount()).toEqual((await count) - limit);
      expect((await loki.getSlaves())[0].address).toEqual('localhost:1');
    });
  });

  describe('.removeBacklink()', () => {
    test('should remove the backlink', async () => {
      const count = (await loki.getServers()).length;
      expect(await loki.getBacklink()).not.toBeNull();
      
      await loki.removeBacklink();
      expect(await loki.getBacklink()).toBeNull();
      expect((await loki.getServers()).length).toEqual(count);
    });
  });

  describe('.removeMaster()', () => {
    test('should remove the master', async () => {
      const address = 'localhost:1';
      await loki.removeMaster(address);
      expect(await loki.getMaster(address)).toBeNull();
    });
  });

  describe('.removeMasters()', () => {
    test('should remove all masters', async () => {
      await loki.addMaster('localhost:1', 0);
      await loki.removeMasters();
      expect(await loki.getMastersCount()).toEqual(0);
      expect((await loki.getMasters()).length).toEqual(0);
      expect((await loki.getServers()).length).toEqual(1);
    });
  });

  describe('.failedServerAddress()', () => { 
    let address; 
    let isBroken;

    beforeAll(() => {
      address = 'localhost:1';
    });

    test('should increase the fails count', async () => {
      const server = await loki.getServer(address);
      isBroken = server.isBroken;
      expect(server.fails).toEqual(0);

      for(let i = 0; i < testContext.node.options.network.serverMaxFails + 1; i++) {
        await loki.failedServerAddress(address);
        expect(server.fails).toEqual(i + 1);
      }      
    });

    test('should change the server status to "isBroken"', async () => {    
      expect(isBroken).toBe(false);
      const server = await loki.getServer(address);
      expect(server.isBroken).toBe(true);
    });
  });

  describe('.successServerAddress()', () => { 
    let address; 
    let isBroken;

    beforeAll(() => {
      address = 'localhost:1';
    });

    test('should decrease the fails count', async () => {
      const server = await loki.getServer(address);
      isBroken = server.isBroken;
      expect(server.fails > 0).toBeTruthy();
      await loki.successServerAddress(address);      
      expect((await loki.getServer(address)).fails).toEqual(0);   
    });

    test('should remove "isBroken" status', async () => {    
      expect(isBroken).toBe(true);
      const server = await loki.getServer(address);
      expect(server.isBroken).toBe(false);
    });
  });

  describe('.normalizeServers()', () => {
    let address;

    beforeAll(() => {
      address = 'localhost:1';
    });
    
    test('should set "isBroken" to false', async () => {
      const server = await loki.getServer(address);
      server.isBroken = true;
      expect(server.fails <= testContext.node.options.network.serverMaxFails).toBeTruthy();
      await loki.normalizeServers();
      expect((await loki.getServer(address)).isBroken).toBe(false);
    });

    test('should set "isBroken" to true', async () => {
      for(let i = 0; i < testContext.node.options.network.serverMaxFails + 1; i++) {
        await loki.failedServerAddress(address);
      } 

      await loki.normalizeServers();
      expect((await loki.getServer(address)).isBroken).toBe(true);
    });

    test(
      'should remove the slave with the current node address',
      async () => {
        await loki.addSlave(testContext.node.address, 0);
        expect(typeof (await loki.getServer(testContext.node.address))).toBe('object');
        await loki.normalizeServers();
        expect(await loki.getServer(testContext.node.address)).toBeNull();
      }
    );

    test(
      'should remove the backlink with the current node address',
      async () => {
        await loki.addBacklink(testContext.node.address);
        expect(typeof (await loki.getServer(testContext.node.address))).toBe('object');
        await loki.normalizeServers();
        expect(await loki.getServer(testContext.node.address)).toBeNull();
      }
    );

    test('should remove the server with wrong statuses', async () => {
      const address = 'localhost:1';
      const server = await loki.getServer(address);
      expect(typeof server).toBe('object');
      server.isMaster = false;
      server.isSlave = false;
      server.isBacklink = false;
      loki.col.servers.update(server);
      await loki.normalizeServers();
      expect(await loki.getServer(address)).toBeNull();
    });
  });

  describe('.addBanlistAddress()', () => { 
    test('should add the address', async () => {
      const address = 'localhost:1';
      await loki.addBanlistAddress(address, '1d');
      expect(loki.col.banlist.count({ address })).toBeTruthy();        
    });

    test('should not create the same address', async () => {
      const address = 'localhost:1';
      await loki.addBanlistAddress(address, '1d');
      expect(loki.col.banlist.count({ address })).toEqual(1);        
    });
  });

  describe('.getBanlist()', () => { 
    test('should return the list', async () => {
      const address = 'localhost:1';
      const list = await loki.getBanlist();
      expect(list.length).toBe(1);
      expect(list[0].address).toEqual(address);
    });
  });

  describe('.getBanlistAddress()', () => { 
    test('should return the address', async () => {
      const address = 'localhost:1';
      const server = await loki.getBanlistAddress(address);
      expect(server.address).toEqual(address);
    });

    test('should not return the wrong address', async () => {
      expect(await loki.getBanlistAddress('wrong')).toBeNull();        
    });
  });

  describe('.checkBanlistIp()', () => { 
    test('should return true', async () => {
      const address = 'localhost:1';
      const server = await loki.getBanlistAddress(address);
      expect(await loki.checkBanlistIp(server.ip)).toBeTruthy();
    });

    test('should return false', async () => {
      expect(await loki.checkBanlistIp('wrong')).toBe(false)      
    });    
  });

  describe('.removeBanlistAddress()', () => { 
    test('should remove the address', async () => {
      const address = 'localhost:1';
      await loki.removeBanlistAddress(address);
      expect(await loki.getBanlistAddress(address)).toBeNull();
    });   
  });

  describe('.normalizeBanlist()', () => { 
    test('check the lifetime', async () => {
      const address = 'localhost:1';
      await loki.addBanlistAddress(address, 1000 * 60);
      const count = loki.col.banlist.count();
      await loki.normalizeBanlist();
      const data = loki.col.banlist.find();
      expect(count).toEqual(data.length);
      data[0].resolvedAt = Date.now() - 1;
      await loki.normalizeBanlist();
      expect(count - 1).toEqual(loki.col.banlist.count());
    }); 
  });

  describe('.emptyBanlist()', () => { 
    test('should empty the list', async () => {
      for(let i = 1; i < 10; i++) {
        await loki.addBanlistAddress(`localhost:${i}`, '1d');
      }

      await loki.emptyBanlist();      
      expect((await loki.getBanlist()).length).toBe(0);
    });
  });

  describe('candidates behavior', () => { 
    let action;

    beforeAll(() => {
      action = 'test';
    });
 
    describe('.addBehaviorCandidate()', () => { 
      test('should add the behavior', async () => {
        loki.col.servers.chain().find().remove();      
        const address = 'localhost:1';
        await loki.addMaster(address, 3);
        await loki.addBehaviorCandidate(action, address);
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.suspicion).toEqual(1);
        expect(behavior.excuse).toEqual(0);
        const wrongBehavior = loki.col.behaviorCandidates.findOne({ address, action: 'wrong' });
        expect(wrongBehavior).toBeNull();
      });

      test('should add the second candidate behavior', async () => {  
        const address = 'localhost:2';
        await loki.addBehaviorCandidate(action, address);
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.suspicion).toEqual(1);
        expect(behavior.excuse).toEqual(0);
      });

      test('should change the first candidate excuse', async () => {
        const address = 'localhost:1';
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.excuse).toEqual(await testContext.node.getCandidateExcuseStep());
      });

      test('should add suspicion to the second candidate', async () => {
        const address = 'localhost:2';
        let behavior = loki.col.behaviorCandidates.findOne({ address, action });
        const lastSuspicion = behavior.suspicion;
        const count = 3;

        for(let i = 0; i < count; i++) {
          await loki.addBehaviorCandidate(action, address);  
        }
            
        behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.suspicion).toEqual(lastSuspicion + count);
        expect(behavior.excuse).toEqual(0);
      });

      test('should add the third candidate behavior', async () => {
        const address = 'localhost:3';
        await loki.addBehaviorCandidate(action, address);      
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.suspicion).toEqual(1);
        expect(behavior.excuse).toEqual(0);
      });

      test('should remove the first candidate behavior', async () => {
        const address = 'localhost:1';
        expect(loki.col.behaviorCandidates.findOne({ address, action })).toBeNull();
      });

      test('should change the second candidate excuse', async () => {
        const address = 'localhost:2';
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.excuse).toEqual(await testContext.node.getCandidateExcuseStep());
      });
    });
    
    describe('.normalizeBehaviorCandidates()', () => {
      test('should decrease the candidate suspicion', async () => {
        const address = 'localhost:2';
        let behavior = loki.col.behaviorCandidates.findOne({ address, action });
        const level = await testContext.node.getCandidateSuspicionLevel();
        expect(behavior.suspicion > level).toBeTruthy();
        await loki.normalizeBehaviorCandidates();
        behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.suspicion <= level).toBeTruthy();       
      });

      test('should remove the candidate', async () => {
        const address = 'localhost:2';
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        behavior.excuse = behavior.suspicion + 1;
        loki.col.behaviorCandidates.update(behavior);
        await loki.normalizeBehaviorCandidates();
        expect(loki.col.behaviorCandidates.findOne({ address, action })).toBeNull();
      });      
    });

    describe('.getBehaviorCandidates()', () => {
      test('should not get any candidates', async () => {
        const address = 'localhost:3';
        const level = await testContext.node.getCandidateSuspicionLevel();        
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        expect(behavior.suspicion < level).toBeTruthy();
        const candidates = await loki.getBehaviorCandidates(action);
        expect(candidates.length).toEqual(0);     
      });

      test('should get an array with the third candidate', async () => {
        const address = 'localhost:3';
        const level = await testContext.node.getCandidateSuspicionLevel();       
        const behavior = loki.col.behaviorCandidates.findOne({ address, action });
        behavior.suspicion = level;
        loki.col.behaviorCandidates.update(behavior);
        const candidates = await loki.getBehaviorCandidates(action);
        expect(candidates.length).toEqual(1);
        expect(candidates[0].address).toEqual(address);
        const wrongCandidates = await loki.getBehaviorCandidates('wrong');
        expect(wrongCandidates.length).toEqual(0);
      });
    });    
  });

  describe('delays behavior', () => { 
    let action;

    beforeAll(() => {
      action = 'test';
    });
 
    describe('.addBehaviorDelay()', () => { 
      test('should add the behavior', async () => {
        const address = 'localhost:1';
        await loki.addBehaviorDelay(action, address);
        const behavior = loki.col.behaviorDelays.findOne({ action, address });
        expect(behavior.address).toEqual(address);        
      });

      test('should not create the same behavior', async () => {
        const address = 'localhost:1';
        await loki.addBehaviorDelay(action, address);
        const data = loki.col.behaviorDelays.find({ action, address });
        expect(data.length).toEqual(1);        
      });
    });
    
    describe('.getBehaviorDelay()', () => { 
      test('should get the behavior', async () => {
        const address = 'localhost:1';
        const behavior = await loki.getBehaviorDelay(action, address);
        expect(behavior.address).toEqual(address);
        const wrongBehavior = loki.col.behaviorDelays.findOne({ address, action: 'wrong' });
        expect(wrongBehavior).toBeNull();
      });

      test('should not get the wrong behavior', async () => {
        expect(await loki.getBehaviorDelay(action, 'wrong')).toBeNull();
      });
    });

    describe('.removeBehaviorDelay()', () => { 
      test('should remove behavior', async () => {
        const address = 'localhost:1';
        await loki.addBehaviorDelay(action, 'localhost:2');
        await loki.removeBehaviorDelay(action, address);
        let behavior = loki.col.behaviorDelays.findOne({ address, action });
        expect(behavior).toBeNull();
        behavior = loki.col.behaviorDelays.findOne({ action });
        expect(behavior).not.toBeNull();
      });
    });

    describe('.cleanBehaviorDelays()', () => { 
      test('should remove all action behavior', async () => {
        const address = 'localhost:1';
        await loki.addBehaviorDelay(action, address);
        await loki.addBehaviorDelay('anotherAction', address);
        let data = loki.col.behaviorDelays.find({ action });
        expect(data.length).toEqual(2);
        await loki.cleanBehaviorDelays(action);
        data = loki.col.behaviorDelays.find({ action });
        expect(data.length).toEqual(0);
        data = loki.col.behaviorDelays.find();
        expect(data.length).toEqual(1);
      });
    });
  });

  describe('approval', () => { 
    let action;
    let key;

    beforeAll(() => {
      action = 'test';
      key = 'key'
    });

    describe('.addApproval()', () => {
      test('should add the approval', async () => {
        await testContext.node.addApproval(action, new Approval());
        const ip = '127.0.0.1';
        const clientIp = utils.isIpv6(ip)? utils.getFullIpv6(ip): utils.ipv4Tov6(ip);
        const startedAt = Date.now();
        const info = 1;
        await loki.addApproval(action, ip, key, startedAt, info);
        const approval = loki.col.approval.findOne({ action, clientIp, key, startedAt, info });
        assert.containsAllKeys(approval, ['usedBy', 'updatedAt']);       
      });

      test('should replace the approval', async () => {
        const ip = '127.0.0.1';
        const clientIp = utils.isIpv6(ip)? utils.getFullIpv6(ip): utils.ipv4Tov6(ip);
        key = 'newKey';
        const startedAt = Date.now();
        const info = 2;
        await loki.addApproval(action, ip, key, startedAt, info);
        const approval = loki.col.approval.findOne({ action, clientIp, key, startedAt, info });
        expect(approval).not.toBeNull();
        expect(loki.col.approval.find().length).toBe(1);
      });
    });

    describe('.getApproval()', () => { 
      test('should get the approval', async () => {
        const approval = await loki.getApproval(key);
        expect(approval).not.toBeNull();
      });

      test('should not get the wrong approval', async () => {
        expect(await loki.getApproval('wrong key')).toBeNull();
      });
    });

    describe('.startApproval()', () => { 
      test('should start the approval', async () => {
        const answer = 1;
        await loki.startApproval(key, answer);
        const approval = await loki.getApproval(key);
        expect(approval.answer).toEqual(answer);
      });
    });

    describe('.useApproval()', () => { 
      test('should use the approval', async () => {
        const address = 'localhost:1'
        let approval = await loki.getApproval(key);
        const date = approval.updatedAt;
        await tools.wait(10);
        await loki.useApproval(key, address);
        approval = await loki.getApproval(key);
        expect(approval.usedBy[0]).toEqual(address);
        expect(approval.updatedAt > date).toBeTruthy();
      });

      test('should add the new user', async () => {
        const address = 'localhost:2';
        await loki.useApproval(key, address);
        const approval = await loki.getApproval(key);
        expect(approval.usedBy[1]).toEqual(address);
      });

      test('should not add the same user', async () => {
        const address = 'localhost:2';
        await loki.useApproval(key, address);
        const approval = await loki.getApproval(key);
        expect(approval.usedBy.length).toBe(2);
      });
    });

    describe('.normalizeApproval()', () => { 
      test('check the lifetime', async () => {
        const count = loki.col.approval.count({ action });
        await loki.normalizeApproval();
        const data = loki.col.approval.find({ action });
        expect(count).toEqual(data.length);
        const approval = await testContext.node.getApproval(action);
        data[0].updatedAt = Date.now() - approval.period - 1;
        await loki.normalizeApproval();
        expect(count - 1).toEqual(loki.col.approval.count({ action }));
      });
    });
  });

  describe('fails behavior', () => { 
    let action;

    beforeAll(() => {
      action = 'test';
    });
 
    describe('.addBehaviorFail()', () => { 
      test('should throw an error', async () => {
        const address = 'localhost:1';
        try {
          await loki.addBehaviorFail(action, address);  
          throw new Error('Fail');
        }
        catch(err) {
          expect(err.message.includes("doesn't exist")).toBeTruthy();
        }         
      });

      test('should add the behavior', async () => {
        await testContext.node.addBehavior(action, new BehaviorFail());
        const address = 'localhost:1';
        await loki.addBehaviorFail(action, address);
        const behavior = loki.col.behaviorFails.findOne({ action, address });
        expect(behavior).not.toBeNull();       
      });

      test('should have the expected suspicion and balance', async () => {
        const address = 'localhost:2';
        const count = 5;

        for(let i = 0, b = 1; i < count; i += 2, b++) {
          await loki.addBehaviorFail(action, address, 2);
          const behavior = loki.col.behaviorFails.findOne({ action, address });
          expect(behavior.suspicion).toEqual(i + 2); 
          expect(behavior.balance).toEqual(b);
        }
      });

      test('should handle the step as a function', async () => {
        const address = 'localhost:1';  
        let behavior = loki.col.behaviorFails.findOne({ action, address });
        const suspicion = behavior.suspicion;
        const balance = behavior.balance;
        await loki.addBehaviorFail(action, address, b => b.balance * 2);
        behavior = loki.col.behaviorFails.findOne({ action, address });
        expect(behavior.suspicion).toEqual(suspicion + balance * 2); 
        expect(behavior.balance).toEqual(balance + 1);
      });

      test('should handle up and down fields', async () => {
        const address = 'localhost:3';  

        for(let i = 0; i < 3; i++) {
          const behavior = await loki.addBehaviorFail(action, address);
          expect(behavior.up).toEqual(i + 1);
          expect(behavior.down).toEqual(0);
        }

        for(let i = 0; i < 3; i++) {
          const behavior = await loki.subBehaviorFail(action, address);
          expect(behavior.down).toEqual(i + 1);
          expect(behavior.up).toEqual(0);
        }
      });
    });

    describe('.getBehaviorFail()', () => { 
      test('should get the behavior', async () => {
        const address = 'localhost:1';
        const behavior = await loki.getBehaviorFail(action, address);
        expect(behavior.address).toEqual(address);
        const wrongBehavior = loki.col.behaviorFails.findOne({ address, action: 'wrong' });
        expect(wrongBehavior).toBeNull();
      });

      test('should not get the wrong behavior', async () => {
        expect(await loki.getBehaviorFail(action, 'wrong')).toBeNull();
      });
    });
    
    describe('.subBehaviorFail()', () => { 
      test('should subtract the behavior', async () => {
        const address = 'localhost:1';
        let behavior = await loki.getBehaviorFail(action, address);   
        behavior.suspicion = 4;
        loki.col.behaviorFails.update(behavior);
        await loki.subBehaviorFail(action, address);             
        behavior = await loki.getBehaviorFail(action, address);
        expect(behavior.suspicion).toEqual(3);
      });

      test('should handle the step as a function', async () => {
        const address = 'localhost:1';
        await loki.subBehaviorFail(action, address, () => 1);
        const behavior = await loki.getBehaviorFail(action, address)
        expect(behavior.suspicion).toEqual(2);        
      });

      test(
        'should subtract the behavior with the custom step and remove',
        async () => {
          const address = 'localhost:1';
          await loki.subBehaviorFail(action, address, 2);
          expect(await loki.getBehaviorFail(action, address)).toBeNull();
        }
      );
    });

    describe('.cleanBehaviorFail()', () => { 
      test('should remove the behavior', async () => {
        const address = 'localhost:1';
        await loki.addBehaviorFail(action, address, 10); 
        await loki.cleanBehaviorFail(action, address); 
        expect(await loki.getBehaviorFail(action, address)).toBeNull();
      });
    });

    describe('.normalizeBehaviorFails()', () => { 
      test('check the lifetime', async () => {
        const count = loki.col.behaviorFails.count({ action });
        await loki.normalizeBehaviorFails();
        const data = loki.col.behaviorFails.find({ action });
        expect(count).toEqual(data.length);
        data[0].updatedAt = 0;
        loki.col.behaviorFails.update(data[0]);
        await loki.normalizeBehaviorFails();
        expect(count - 1).toEqual(loki.col.behaviorFails.count({ action }));
      });

      test('check the banlist delay', async () => {
        loki.col.banlist.chain().find().remove();
        const address = 'localhost:1';
        const behavior = await loki.addBehaviorFail(action, address);
        await loki.normalizeBehaviorFails();
        expect(loki.col.banlist.count()).toEqual(0);
        const options = await loki.node.getBehavior(action);
        options.banDelay = 1000;
        behavior.suspicion = options.failSuspicionLevel + 1;
        loki.col.behaviorFails.update(behavior);
        await tools.wait(10);
        await loki.normalizeBehaviorFails();
        expect(loki.col.banlist.count()).toEqual(0); 
        expect(await loki.getBehaviorFail(action, address)).not.toBeNull();        
      });

      test('check the banlist', async () => {
        loki.col.banlist.chain().find().remove();
        const address = 'localhost:1';
        const behavior = await loki.addBehaviorFail(action, address);
        behavior.createdAt = 0;
        loki.col.behaviorFails.update(behavior);
        await loki.normalizeBehaviorFails();
        expect(loki.col.banlist.count()).toEqual(1);
        expect(await loki.getBehaviorFail(action, address)).toBeNull();       
      });
    });
  });

  describe('cache', () => { 
    let type;

    beforeAll(() => {
      type = 'test';
    });
 
    describe('.setCache()', () => { 
      test('should set the cache', async () => {
        const key = 'key1';
        await loki.setCache(type, key, 1);
        expect(loki.col.cache.count({ type, key })).toBeTruthy();     
      });

      test('should update the same cache', async () => {
        const key = 'key1';
        await loki.setCache(type, key, 2);
        const data = loki.col.cache.find({ type, key });
        expect(data.length).toEqual(1); 
        expect(data[0].value).toEqual(2);   
      });

      test('should keep the limit', async () => {
        const limit = 5;
        const key = 'key1';

        for(let i = 1; i < limit + 1; i++) {
          await tools.wait(10);
          await loki.setCache(type, i, i, { limit });          
        }

        const data = loki.col.cache.find({ type });
        expect(data.length).toEqual(limit);
        expect(data[0].key).not.toEqual(key);
      });
    });

    describe('.getCache()', () => { 
      let accessTime;

      test('should get the cache', async () => {
        await loki.setCache(type, 'key1', 1);
        const cache = await loki.getCache(type, 'key1');
        accessTime = cache.accessedAt;
        expect(typeof cache).toBe('object');     
      });

      test('should update the access time', async () => {
        await tools.wait(1);
        const cache = await loki.getCache(type, 'key1');
        expect(cache.accessedAt > accessTime).toBeTruthy();
      });

      test('should not get the wrong type cache', async () => {     
        expect(await loki.getCache('wrong', 'key1')).toBeNull();     
      });

      test('should not get the wrong key cache', async () => {
        expect(await loki.getCache(type, 'wrong')).toBeNull();     
      });
    });

    describe('.removeCache()', () => { 
      test('should not remove the wrong type cache', async () => {
        const key = 'key1';
        await loki.removeCache('wrong', key);
        expect(loki.col.cache.count({ type, key })).toBeTruthy();
      });

      test('should not remove the wrong key cache', async () => {
        const key = 'key1';
        await loki.removeCache(type, 'wrong');
        expect(loki.col.cache.count({ type, key })).toBeTruthy();
      });

      test('should remove the cache', async () => {
        const key = 'key1';
        await loki.removeCache(type, key);
        expect(loki.col.cache.count({ type, key })).toBeFalsy();
      });
    });

    describe('.normalizeCache()', () => { 
      test('should keep the right limit', async () => {
        const limit = 5;
        const key = 'key1';

        for(let i = 1; i < limit + 1; i++) {
          await loki.setCache(type, i, i);
          await tools.wait(10);
        }

        await loki.normalizeCache(type, { limit });
        const data = loki.col.cache.find({ type });
        expect(data.length).toEqual(limit);
        expect(data[0].key).not.toEqual(key);
      });

      test('should remove old cache', async () => {
        const count = loki.col.cache.chain().find({ type }).count();
        await tools.wait(10);
        await loki.setCache(type, count + 1, count + 1);
        await loki.normalizeCache(type, { lifetime: 9 });        
        expect(1).toEqual(loki.col.cache.chain().find({ type }).count());
      });
    });

    describe('.flushCache()', () => { 
      test('should remove all cache', async () => {
        for(let i = 1; i < 5; i++) {
          await loki.setCache(type, i);
        }
        
        await loki.flushCache(type); 
        expect(loki.col.cache.count({ type })).toEqual(0);
      });
    });
  });

  describe('.backup()', () => { 
    test('should create a backup', async () => {      
      await loki.backup();
      const files = await fse.readdir(loki.options.backups.folder);
      const backupBuffer = await fse.readFile(path.join(loki.options.backups.folder, files[0]));
      const dbBuffer = await fse.readFile(loki.options.filename);
      expect(backupBuffer.equals(dbBuffer)).toBe(true);
    });

    test('should create the secong backup', async () => {      
      await loki.backup();
      const files = await fse.readdir(loki.options.backups.folder);
      const backupBuffer = await fse.readFile(path.join(loki.options.backups.folder, files[1]));
      const dbBuffer = await fse.readFile(loki.options.filename);
      expect(backupBuffer.equals(dbBuffer)).toBe(true);
    });
  });

  describe('.restore()', () => { 
    test('should restore from the last backup', async () => {   
      await loki.setData('restore', 1);
      await loki.restore();
      const files = await fse.readdir(loki.options.backups.folder);
      const backupBuffer = await fse.readFile(path.join(loki.options.backups.folder, files[1]));
      const dbBuffer = await fse.readFile(loki.options.filename);
      expect(backupBuffer.equals(dbBuffer)).toBe(true);
    });

    test('should restore from the first backup', async () => {   
      await loki.setData('restore', 2);
      await loki.restore(1);
      const files = await fse.readdir(loki.options.backups.folder);
      const backupBuffer = await fse.readFile(path.join(loki.options.backups.folder, files[0]));
      const dbBuffer = await fse.readFile(loki.options.filename);
      expect(backupBuffer.equals(dbBuffer)).toBe(true);
    });
  });

  describe('.deinit()', () => { 
    test('should not throw an exception', async () => {
      await loki.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await loki.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await loki.destroy();
      testContext.node.db = lastNodeDb;
    });
    
    test('should remove the db file', async () => {
      expect(await fse.pathExists(tools.getDbFilePath(testContext.node))).toBe(false);
    });
  });
});