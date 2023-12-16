import { beforeAll, expect, test, describe } from "bun:test";
import ServiceFactory from '../src/service';
const Service = ServiceFactory();

describe('Service', () => {
  let service;

  describe('instance creation', () => {
    test('should create an instance', async () => { 
      expect(() => service = new Service()).not.toThrow();
    });
  });

  describe('.init()', () => {
    test(
      'should not initialize the slave service without registration',
      async () => {
        try {
          await service.init();
          throw new Error('Fail');
        }
        catch(err) {
          expect(err.message.match('You have to register')).toBeTruthy(); 
        }      
      }
    );

    test('should initialize the service', async () => {      
      service.__isMasterService = true;
      await service.init();
      expect(typeof service.__initialized).toBe('number');
    });
  });

  describe('.isInitialized()', () => {
    test('should be true', () => {
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('.deinit()', () => {
    test('should deinitialize the server', async () => {
      await service.deinit();
      expect(service.__initialized).toBe(false);
    });
  });

  describe('.isInitialized()', () => {
    test('should be false', () => {
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('reinitialization', () => {
    test('should not throw an exception', async () => {
      await service.init();
      expect(service.isInitialized()).toBeTruthy();
    });
  });

  describe('.destroy()', () => {
    test('should destroy the service', async () => {
      await service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });
});