import { beforeAll, expect, test, describe } from "bun:test";

import ApprovalFactory from '../../src/approval/transports/approval';
const Approval = ApprovalFactory();

describe('Approval', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let approval;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => approval = new Approval()).not.toThrow();
      approval.node = testContext.node;
    });

    test('should create the default properties', () => {
      assert.containsAllKeys(approval, ['approversCount', 'decisionLevel', 'period']);
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await approval.init();
    });  
  });

  describe('.deinit()', () => {
    test('should not throw an exception', async () => {
      await approval.deinit();
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await approval.init();
    });
  });

  describe('.destroy()', () => { 
    test('should not throw an exception', async () => {
      await approval.destroy();
    });
  });
});