import { beforeAll, expect, test, describe } from "bun:test";

import ApprovalClientFactory from '../../src/approval/transports/client';
const ApprovalClient = ApprovalClientFactory();
import utils from '../../src/utils';

describe('ApprovalClient', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let approval;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => approval = new ApprovalClient()).not.toThrow();
      approval.node = testContext.node;
    });
  });

  describe('.init()', () => {
    test('should not throw an exception', async () => {
      await approval.init();
    });  
  });

  describe('.createInfo()', () => {
    test('should return the right info', async () => {
      const clientIp = '127.0.0.1';
      const result = await approval.createInfo({ clientIp });
      expect(result.info == clientIp && result.answer == clientIp).toBeTruthy();
    });  
  });

  describe('.createQuestion()', () => {
    test('should return the right question', async () => {
      const clientIp = '127.0.0.1';
      const result = await approval.createQuestion([], undefined, clientIp);
      expect(result).toEqual(clientIp);
    });  
  });

  describe('.checkAnswer()', () => {
    test('should return false', async () => {
      const clientIp = '127.0.0.1';
      const result = await approval.checkAnswer({ answer: clientIp }, '1.1.1.1');
      expect(result).toBe(false);
    });  

    test('should return true', async () => {
      const clientIp = '127.0.0.1';
      const result = await approval.checkAnswer({ answer: clientIp }, clientIp);
      expect(result).toBe(true);
    });  
  });

  describe('.getClientInfoSchema()', () => {
    test('should throw an error', () => {
      const schema = approval.getClientInfoSchema();
      expect(() => utils.validateSchema(schema, {})).toThrow();
    });  

    test('should not throw an error', () => {
      const schema = approval.getClientInfoSchema();
      expect(() => utils.validateSchema(schema, undefined)).not.toThrow();
    }); 
  });

  describe('.getClientAnswerSchema()', () => {
    test('should throw an error', () => {
      const schema = approval.getClientAnswerSchema();
      expect(() => utils.validateSchema(schema, 'wrong')).toThrow();
    });  

    test('should not throw an error', () => {
      const schema = approval.getClientAnswerSchema();
      expect(() => utils.validateSchema(schema, '1.1.1.1')).not.toThrow();
    }); 
  });

  describe('.getApproverInfoSchema()', () => {
    test('should throw an error', () => {
      const schema = approval.getApproverInfoSchema();
      expect(() => utils.validateSchema(schema, 'wrong')).toThrow();
    });  

    test('should not throw an error', () => {
      const schema = approval.getApproverInfoSchema();
      expect(() => utils.validateSchema(schema, '1.1.1.1')).not.toThrow();
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