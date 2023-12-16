import { beforeAll, expect, test, describe } from "bun:test";

import sharp from 'sharp';
import isPng from 'is-png';
import ApprovalCaptchaFactory from '../../src/approval/transports/captcha';
const ApprovalCaptcha = ApprovalCaptchaFactory();
import utils from '../../src/utils';

describe('Approval', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  let approval;

  describe('instance creation', () => {
    test('should create an instance', () => {
      expect(() => approval = new ApprovalCaptcha()).not.toThrow();
      approval.node = testContext.node;
    });

    test('should create the default properties', () => {
      assert.containsAllKeys(approval, [
        'captchaLength', 'captchaWidth', 'captchaBackground', 'captchaColor'
      ]);
    });
  });

  describe('.init()', () => { 
    test('should not throw an exception', async () => {
      await approval.init();
    });  
  });

  describe('.createText()', () => { 
    test('should return a random text', () => {
      const text = approval.createText();
      expect(typeof text == 'string' && text.length == approval.captchaLength).toBeTruthy();
    });  
  });

  describe('.createImage()', () => { 
    test('should return the right image', async () => {
      const options = { 
        captchaWidth: 200, 
        captchaBackground: 'transparent', 
        captchaColor: '#000000' 
      };
      const text = approval.createText();
      const img = await approval.createImage(text, options);
      const metadata = await img.metadata();
      expect(metadata.width).toEqual(options.captchaWidth);
    });  
  });

  describe('.createInfo()', () => {
    test('should return the right info', async () => {
      const result = await approval.createInfo({ info: {} });
      const text = result.answer;
      expect(() => isPng(Buffer.from(result.info, 'base64'))).not.toThrow();
      expect(typeof text == 'string' && text.length == approval.captchaLength).toBeTruthy();
    });  
  });

  describe('.createQuestion()', () => {
    test('should return the right question', async () => {
      const data = [];

      for(let i = 0; i < 3; i++) {
        const res = await approval.createInfo({ info: {} });
        data.push(res.info);
      }

      const result = await approval.createQuestion(data, {});
      const buffer = Buffer.from(result.split(',')[1], 'base64');
      expect(isPng(buffer)).toBe(true);
    });  
  });

  describe('.checkAnswer()', () => {
    test('should return false', async () => {
      const approvers = ['localhost:1', 'localhost:2', approval.node.address];
      const result = await approval.checkAnswer({ answer: '34' }, '123456', approvers);
      expect(result).toBe(false);
    });  

    test('should return true', async () => {
      const approvers = ['localhost:1', approval.node.address, 'localhost:2'];
      const result = await approval.checkAnswer({ answer: '34' }, '123456', approvers);
      expect(result).toBe(true);
    });  
  });

  describe('.getClientInfoSchema()', () => {
    test('should throw an error', () => {
      const schema = approval.getClientInfoSchema();
      expect(() => utils.validateSchema(schema, { captchaLength: 1 })).toThrow();
      expect(() => utils.validateSchema(schema, { captchaWidth: 90 })).toThrow();
      expect(() => utils.validateSchema(schema, { captchaWidth: 1000 })).toThrow();
      expect(() => utils.validateSchema(schema, { captchaBackground: 'wrong' })).toThrow();
      expect(() => utils.validateSchema(schema, { captchaColor: 'wrong' })).toThrow();
    });  

    test('should not throw an error', () => {
      const schema = approval.getClientInfoSchema();
      expect(() => utils.validateSchema(schema, { captchaWidth: 200 })).not.toThrow();
      expect(() => utils.validateSchema(schema, { captchaBackground: 'transparent' })).not.toThrow();
      expect(() => utils.validateSchema(schema, { captchaBackground: '#000000' })).not.toThrow();
      expect(() => utils.validateSchema(schema, { captchaColor: 'random' })).not.toThrow();
      expect(() => utils.validateSchema(schema, { captchaColor: '#000000' })).not.toThrow();
    }); 
  });

  describe('.getClientAnswerSchema()', () => {
    test('should throw an error', () => {
      const schema = approval.getClientAnswerSchema();
      expect(() => utils.validateSchema(schema, 1)).toThrow();
    });  

    test('should not throw an error', () => {
      const schema = approval.getClientAnswerSchema();
      expect(() => utils.validateSchema(schema, 'right')).not.toThrow();
    }); 
  });

  describe('.getApproverInfoSchema()', () => {
    test('should throw an error', async () => {
      const schema = approval.getApproverInfoSchema();
      expect(() => utils.validateSchema(schema, 'wrong')).toThrow();
    });  

    test('should not throw an error', async () => {
      const schema = approval.getApproverInfoSchema();
      const img = sharp({ 
        create: {
          width: 100,
          height: 10,
          channels: 4,
          background: 'transparent'
        }
      });
      img.png();
      const buffer = await img.toBuffer();
      expect(() => utils.validateSchema(schema, buffer.toString('base64'))).not.toThrow();
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