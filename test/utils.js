import { beforeAll, beforeEach, expect, test, describe} from "bun:test";

import getPort from 'get-port';
import http from 'http';
import path from 'path';
import fse from 'fs-extra';
import mocks from 'node-mocks-http';
import utils from '../src/utils';
import tools from './tools';

describe('utils', () => {
  describe('.validateSchema()', () => {
    const testFails = (name) => {
      const types = [
        { name: 'string', value: '1' },
        { name: 'number', value: 1 },
        { name: 'boolean', value: true },
        { name: 'object', value: {} },
        { name: 'array', value: [] },
        { name: 'null', value: null },
        { name: 'undefined', value: undefined },
        { name: 'nan', value: NaN },
      ];

      for(let i = 0; i < types.length; i++) {
        const type = types[i];

        if(type.name != name) {
          utils.validateSchema(name, type.value, `check ${type.name}`);
        }
      }
    }

    describe('multiple types', () => {
      test('should be true', () => { 
        expect(() => {
          utils.validateSchema([
            {
              type: 'object',
              props: {
                x: [
                  'number',
                  'boolean'
                ]
              }
            },
            'string'
          ], { x: 5 });
        }).not.toThrow();
      });

      test('should be false', () => { 
        expect(() => {
          utils.validateSchema([
            {
              type: 'object',
              props: {
                x: [
                  'number',
                  'boolean'
                ]
              }
            },
            'string'
          ], { x: '1' });
        }).toThrow();
      });
    });

    describe('number', () => {
      test('should verify a number', () => { 
        expect(() => {
          utils.validateSchema('number', 1, 'check integer');
          utils.validateSchema('number', 1.5, 'check float');
        }).not.toThrow();
      });

      test('should not verify a wrong number', () => { 
        expect(() => testFails('number')).toThrow();
      });
    });

    describe('string', () => {
      test('should verify a string', () => { 
        expect(() => {
          utils.validateSchema('string', '1');
        }).not.toThrow();
      });

      test('should not verify a wrong string', () => { 
        expect(() => testFails('string')).toThrow();
      });
    });

    describe('boolean', () => {
      test('should verify a boolean', () => { 
        expect(() => {
          utils.validateSchema('boolean', true);
        }).not.toThrow();
      });

      test('should not verify a wrong boolean', () => { 
        expect(() => testFails('boolean')).toThrow();
      });
    });

    describe('array', () => {
      test('should verify an array', () => { 
        expect(() => {
          utils.validateSchema('array', []);
        }).not.toThrow();
      });

      test('should not verify a wrong array', () => { 
        expect(() => testFails('array')).toThrow();
      });

      test('should verify array items', () => { 
        expect(() => 
          utils.validateSchema({
            type: 'array',
            items: 'number'
          }, [1, 2])).not.toThrow();
      });

      test('should not verify wrong array "minLength"', () => { 
        expect(() => 
          utils.validateSchema({
            type: 'array',
            minLength: 1
          }, [])).toThrow();
      });

      test('should not verify wrong array "maxLength"', () => { 
        expect(() => 
          utils.validateSchema({
            type: 'array',
            maxLength: 1
          }, [1, 2])).toThrow();
      });

      test('should not verify wrong array "uniq"', () => { 
        expect(() => 
          utils.validateSchema({
            type: 'array',
            uniq: true
          }, [1, 1, 2])).toThrow();

        expect(() => 
          utils.validateSchema({
            type: 'array',
            uniq: 'x'
          }, [{ x: 1 }, { x: 1 }, { x: 2 }])).toThrow();
      });
    });

    describe('object', () => {
      test('should verify an object', () => { 
        expect(() => {
          utils.validateSchema('object', {});
        }).not.toThrow();
      });
  
      test('should not verify a wrong object', () => { 
        expect(() => testFails('object')).toThrow();
      });

      test('should check props', () => { 
        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            }
          }, { x: 1 }, 'check one prop');
        }).not.toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            }
          }, { x: 1, y: 3}, 'check all props');
        }).not.toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            }
          }, { x: 1, y: '1'}, 'check wrong props');
        }).toThrow();
      });

      test('should check strict props', () => { 
        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            strict: true
          }, { x: 1 }, 'check the wrong case');
        }).toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            strict: true
          }, { x: 1, y: 1 }, 'check the right case');
        }).not.toThrow();
      });

      test('should check expected props', () => { 
        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            expected: true
          }, { x: 1, z: 1 }, 'check the wrong case');
        }).toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            expected: true
          }, { x: 1 }, 'check the right case');
        }).not.toThrow();
      });

      test('should check required props', () => { 
        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            required: ['x']
          }, { y: 1 }, 'check the wrong case');
        }).toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'object',
            props: {
              x: 'number',
              y: 'number'
            },
            required: ['x']
          }, { x: 1 }, 'check the right case');
        }).not.toThrow();
      });
    });

    describe('check the "value" option', () => {
      test('should verify the right value', () => { 
        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: 1
          }, 1, 'check one value');
        }).not.toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: [1, 2]
          }, 1, 'check a few values');
        }).not.toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: /1|2/
          }, 1, 'check a RegExp');
        }).not.toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: val => val == 1
          }, 1, 'check a function');
        }).not.toThrow();
      });      

      test('should not verify the wrong value', () => { 
        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: 1
          }, 2, 'check one value');
        }).toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: [1, 2]
          }, 3, 'check a few values');
        }).toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: /1|2/
          }, 3, 'check a RegExp');
        }).toThrow();

        expect(() => {
          utils.validateSchema({
            type: 'number',
            value: val => val == 1
          }, 2, 'check a function');
        }).toThrow();
      });
    });
  });

  describe('.getRandomElement()', () => {
    test('should return the list item', () => { 
      const arr = [];

      for(let i = 0; i < 1000; i++) {
        arr.push(i);
      }

      expect(arr).toContain(utils.getRandomElement(arr));
    });
  });

  describe('.getMs()', () => {
    test('should return the same value', () => {
      let val = 1000;
      expect(val).toEqual(utils.getMs(val));
      val = 'auto';
      expect(val).toEqual(utils.getMs(val));
    });

    test('should convert to ms', () => {
      expect(1000).toEqual(utils.getMs('1s'));
    });
  });

  describe('.getBytes()', () => {
    test('should return the same value', () => {
      let val = 1024;
      expect(val).toEqual(utils.getBytes(val));
      val = 'auto';
      expect(val).toEqual(utils.getBytes(val));
      val = '1%';
      expect(val).toEqual(utils.getBytes(val));
    });

    test('should convert to bytes', () => {
      expect(1024).toEqual(utils.getBytes('1kb'));
    });
  });

  describe('.getCpuUsage()', () => {
    test('should return the percentage', async () => {
      for(let i = 0; i < 5; i++) {       
        const result = await utils.getCpuUsage({ timeout: 100 });
        expect(result >= 0 && result <= 100).toBeTruthy();
      }
    });
  });

  describe('.isPortUsed()', () => {
    let port;
    let server;

    beforeAll(async () => {
      port = await getPort();
      server = http.createServer(() => {});
    });

    test('should return false before', async () => {
      expect(await utils.isPortUsed(port)).toBe(false);
    });

    test('should return true', async () => {
      await new Promise(resolve => server.listen(port, resolve));
      expect(await utils.isPortUsed(port)).toBe(true);
    });

    test('should return false after', async () => {
      await new Promise(resolve => server.close(resolve));
      expect(await utils.isPortUsed(port)).toBe(false);
    });
  });

  describe('.getHostIp()', () => {
    test('should return localhost ip', async () => {
      expect(await utils.getHostIp('localhost')).toEqual('127.0.0.1');
    });

    test('should return null for a wrong host', async () => {
      expect(await utils.getHostIp('somewronghostname')).toBeNull();
    });

    test('should return a valid ip address', async () => {
      expect(utils.isValidIp(await utils.getHostIp('example.com'))).toBe(true);
    });

    test('should return the same value for ipv4', async () => {
      const val = '8.8.8.8';
      expect(await utils.getHostIp(val)).toEqual(val);
    });

    test('should return the same value for ipv6', async () => {
      const val = '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]';
      expect(await utils.getHostIp(val)).toEqual(val);
    });
  });

  describe('.getRequestTimer()', () => {
    let timer;
    let timeout;
    let last;

    beforeEach(() => {
      timeout = 200;
      timer = utils.getRequestTimer(timeout);
    });

    test('should return the current timeout', (done) => {
      last = timeout;
      setTimeout(() => {
        timeout = timer();
        expect(timeout < last).toBe(true);
        done();
      });
    });

    test('should return the passed timeout', async () => {
      last = timeout;
      timeout = timer(last / 2);
      expect(timeout).toEqual(last / 2);
    });

    test('should return cut timeout', async () => {
      last = timeout;
      timeout = timer([last, last * 2]);
      expect(timeout < last).toBeTruthy();
    });
  });

  describe('.getRemoteIp()', () => {
    test('should return the right ip', () => {
      const remoteAddress = '127.0.0.1';
      const req = mocks.createRequest({ connection: { remoteAddress } });
      expect(utils.getRemoteIp(req)).toEqual(remoteAddress);
    });

    test('should return the forwarded ip', () => {
      const remoteAddress = '127.0.0.1';
      const clientAddress = '1.1.1.1';
      const req = mocks.createRequest({ 
        connection: { remoteAddress },
        headers: { 'x-forwarded-for': clientAddress }
      });
      expect(utils.getRemoteIp(req)).toEqual(clientAddress);
    });

    test('should return the remote ip with the trustlist', () => {
      const remoteAddress = '127.0.0.1';
      const clientAddress = '1.1.1.1';
      const req = mocks.createRequest({ 
        connection: { remoteAddress },
        headers: { 'x-forwarded-for': clientAddress }
      });
      expect(utils.getRemoteIp(req, { trusted: ['2.2.2.2'] })).toEqual(remoteAddress);
    });

    test('should return the client ip with the trustlist', () => {
      const remoteAddress = '127.0.0.1';
      const clientAddress = '1.1.1.1';
      const trusted = [remoteAddress, '2.2.2.2']
      const req = mocks.createRequest({ 
        connection: { remoteAddress },
        headers: { 'x-forwarded-for': `${clientAddress}, ${ trusted[0] }, ${ trusted[1] }` }
      });
      expect(utils.getRemoteIp(req, { trusted })).toEqual(clientAddress);
    });

    test('should return the remote ip with the trustlist broken chain', () => {
      const remoteAddress = '127.0.0.1';
      const clientAddress = '1.1.1.1';
      const trusted = [remoteAddress, '2.2.2.2']
      const req = mocks.createRequest({ 
        connection: { remoteAddress },
        headers: { 'x-forwarded-for': `${clientAddress}, ${ trusted[0] }, ${ trusted[1] }, 3.3.3.3` }
      });
      expect(utils.getRemoteIp(req, { trusted: ['2.2.2.2'] })).toEqual(remoteAddress);
    });
  });

  describe('.getExternalIp()', () => {
    test('should return a right ip', async () => {
      expect(utils.isValidIp(await utils.getExternalIp())).toBe(true);  
    });
  });

  describe('.getLocalIp()', () => {
    test('should return a right ip', async () => {
      expect(utils.isValidIp(await utils.getLocalIp())).toBe(true);  
    });
  });

  describe('.isValidPort()', () => {
    test('should return true', () => {
      for(let i = 0; i <= 65535; i++) {
        expect(utils.isValidPort(i)).toBe(true);
      }    
      
      expect(utils.isValidPort('1')).toBe(true);
    });

    test('should return false', () => {
      expect(utils.isValidPort(65536)).toBe(false);
      expect(utils.isValidPort(65536 * 2)).toBe(false);
      expect(utils.isValidPort('string')).toBe(false);     
      expect(utils.isValidPort()).toBe(false); 
      expect(utils.isValidPort(null)).toBe(false);
      expect(utils.isValidPort({})).toBe(false);
      expect(utils.isValidPort([])).toBe(false);
    });
  });

  describe('.isValidIp()', () => {
    test('should return true for ipv4', () => {
      for(let i = 0; i < 256; i++) {
        expect(utils.isValidIp(`${i}.${i}.${i}.${i}`)).toBe(true);
      }      
    });

    test('should return true for ipv6', () => {
      expect(utils.isValidIp('::')).toBe(true);
      expect(utils.isValidIp('::1')).toBe(true);
      expect(utils.isValidIp('::192.0.0.1')).toBe(true);    
      expect(utils.isValidIp('ffff::')).toBe(true);
      expect(utils.isValidIp('::ffff:192.0.0.1')).toBe(true);
      expect(utils.isValidIp('::ffff:')).toBe(true);      
      expect(utils.isValidIp('64:ff9b::')).toBe(true);  
      expect(utils.isValidIp('2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d')).toBe(true);  
      expect(utils.isValidIp('[2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d]')).toBe(true); 
      expect(utils.isValidIp('ff00::')).toBe(true);     
    });

    test('should return false', () => {
      expect(utils.isValidIp('256.0.0.0')).toBe(false);
      expect(utils.isValidIp(0)).toBe(false);
      expect(utils.isValidIp(1)).toBe(false);      
      expect(utils.isValidIp('string')).toBe(false);
      expect(utils.isValidIp('[string]')).toBe(false);
      expect(utils.isValidIp()).toBe(false);
      expect(utils.isValidIp(null)).toBe(false);
      expect(utils.isValidIp({})).toBe(false);
      expect(utils.isValidIp([])).toBe(false);
    });
  });

  describe('.ipv4Tov6()', () => {
    test('should convert ipv4 to ipv6 full format', () => {
      expect(utils.ipv4Tov6('192.0.0.1')).toEqual('0000:0000:0000:0000:0000:ffff:c000:0001');      
    });

    test('should throw an error', () => {
      expect(() => utils.ipv4Tov6('0000:0000:0000:0000:0000:ffff:c000:0001')).toThrow();      
    });
  });

  describe('.isIpv6()', () => {
    test('should return true', () => {
      expect(utils.isIpv6('::192.0.0.1')).toBe(true);    
      expect(utils.isIpv6('ffff::')).toBe(true);
      expect(utils.isIpv6('::ffff:192.0.0.1')).toBe(true);
      expect(utils.isIpv6('::ffff:')).toBe(true);
      expect(utils.isIpv6('2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d')).toBe(true);  
      expect(utils.isIpv6('[2001:0db8:11a3:09d7:1f34:8a2e:07a0:765d]')).toBe(true); 
    });

    test('should return false', () => {
      expect(utils.isIpv6('1.0.0.0')).toBe(false); 
    });
  });

  describe('.getFullIpv6()', () => {
    test('should return the right option', () => {
      const value = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff';
      expect(utils.getFullIpv6(value)).toEqual(value);
    });

    test('should convert ipv6 short option to the full format', () => {
      expect(utils.getFullIpv6('ffff::')).toEqual('ffff:0000:0000:0000:0000:0000:0000:0000');      
    });

    test('should convert ipv4 to ipv6 full format', () => {
      expect(utils.getFullIpv6('192.0.0.1')).toEqual('0000:0000:0000:0000:0000:ffff:c000:0001');      
    });

    test('should throw an error', () => {
      expect(() => utils.getFullIpv6('wrong')).toThrow();      
    });
  });

  describe('.isIpEqual()', () => {
    test('should return true', () => {
      expect(utils.isIpEqual('192.0.0.1', '192.0.0.1')).toBe(true);
      expect(utils.isIpEqual('0000:0000:0000:0000:0000:ffff:c000:0001', '192.0.0.1')).toBe(true);
      expect(
        utils.isIpEqual('0000:0000:0000:0000:0000:ffff:c000:0001', '0000:0000:0000:0000:0000:ffff:c000:0001')
      ).toBe(true);
      expect(
        utils.isIpEqual('0000:0000:0000:0000:0000:ffff:c000:0001', '::ffff:c000:0001')
      ).toBe(true);
      expect(utils.isIpEqual('::ffff:c000:0001', '192.0.0.1')).toBe(true);
    });

    test('should return false', () => {
      expect(utils.isIpEqual('192.0.0.1', '192.0.0.2')).toBe(false);
    });
  });

  describe('.createAddress()', () => {
    test('should create ipv4 address', () => {
      const host = '192.0.0.1';
      const port = '1';
      expect(utils.createAddress(host, port)).toEqual(`${host}:${port}`);
    });

    test('should create ipv6 address', () => {
      const host = '0000:0000:0000:0000:0000:ffff:c000:0001';
      const port = '1';
      expect(utils.createAddress(host, port)).toEqual(`[${host}]:${port}`);
    });
  });

  describe('.isValidDomain()', () => {
    test('should return true', () => {
      expect(utils.isValidDomain('localhost')).toBe(true);
      expect(utils.isValidDomain('example.com')).toBe(true);
      expect(utils.isValidDomain('sub.example.com')).toBe(true);
      expect(utils.isValidDomain('sub.sub.example.com')).toBe(true);     
    });

    test('should return false', () => {
      expect(utils.isValidDomain(1)).toBe(false);
      expect(utils.isValidDomain()).toBe(false);
      expect(utils.isValidDomain(null)).toBe(false);
      expect(utils.isValidDomain({})).toBe(false);
      expect(utils.isValidDomain([])).toBe(false);
      expect(utils.isValidDomain('192.0.0.1')).toBe(false);
      expect(utils.isValidDomain('0000:0000:0000:0000:0000:ffff:c000:0001')).toBe(false);
      expect(utils.isValidDomain('[0000:0000:0000:0000:0000:ffff:c000:0001]')).toBe(false);
    });
  });

  describe('.isValidHostname()', () => {
    test('should return true', () => {
      expect(utils.isValidHostname('localhost')).toBe(true);
      expect(utils.isValidHostname('example.com')).toBe(true);
      expect(utils.isValidHostname('sub.example.com')).toBe(true);
      expect(utils.isValidHostname('sub.sub.example.com')).toBe(true);
      expect(utils.isValidHostname('192.0.0.1')).toBe(true);
      expect(utils.isValidHostname('0000:0000:0000:0000:0000:ffff:c000:0001')).toBe(true);
      expect(utils.isValidHostname('[0000:0000:0000:0000:0000:ffff:c000:0001]')).toBe(true);
    });

    test('should return false', () => {
      expect(utils.isValidHostname(1)).toBe(false);
      expect(utils.isValidHostname()).toBe(false);
      expect(utils.isValidHostname(null)).toBe(false);
      expect(utils.isValidHostname({})).toBe(false);
      expect(utils.isValidHostname([])).toBe(false);
    });
  });

  describe('.splitAddress()', () => {
    test('should split ipv4', () => {
      const host = '192.0.0.1';
      const port = 1;
      const res = utils.splitAddress(utils.createAddress(host, port));
      expect(res[0]).toEqual(host);
      expect(res[1]).toEqual(port);
    });

    test('should split ipv6', () => {
      const host = '0000:0000:0000:0000:0000:ffff:c000:0001';
      const port = 1;
      const res = utils.splitAddress(utils.createAddress(host, port));
      expect(res[0]).toEqual(host);
      expect(res[1]).toEqual(port);
    });
  });

  describe('.createDataHash()', () => {
    let data;
    let result;

    beforeAll(() => data = ['1', '2']);

    test('should return a string', () => {
      result = utils.createDataHash(data);
      expect(typeof result).toBe('string');
    });

    test('should return the same string', () => {
      expect(result).toEqual(utils.createDataHash(data));
    });

    test('should return the another string', () => {
      expect(result).not.toHaveProperty(utils.createDataHash(['3']));
    });
  });

  describe('.getClosestPeriodTime()', () => {
    test('should return the right time for 5 minutes', () => {
      const date = utils.getClosestPeriodTime(new Date('2011-10-10T14:48:00').getTime(), 1000 * 60 * 5);
      expect(date).toEqual(new Date('2011-10-10T14:45:00').getTime());
    });

    test('should return the right time for an hour', () => {
      const date = utils.getClosestPeriodTime(new Date('2011-10-10T14:48:00').getTime(), 1000 * 60 * 60);
      expect(date).toEqual(new Date('2011-10-10T14:00:00').getTime());
    });
  });

  describe('.isHexColor()', () => {
    test('should return false', () => {
      expect(utils.isHexColor(1, 'check a number')).toBe(false);
      expect(utils.isHexColor({}, 'check an object')).toBe(false);
      expect(utils.isHexColor('#000', 'check a bad color')).toBe(false);
      expect(utils.isHexColor('#000TT1', 'check a wrong color')).toBe(false);
    });

    test('should return true', () => {
      expect(utils.isHexColor('#FFFFDD')).toBe(true);
    });
  });

  describe('.getRandomHexColor()', () => {
    test('should return a random color', () => {
      const color = utils.getRandomHexColor();
      expect(utils.isHexColor(color)).toBe(true);
    });
  });

  describe('.invertHexColor()', () => {
    test('should invert the color', () => {
      expect(utils.invertHexColor('#ffffdd')).toEqual('#000022');
    });
  });

  describe('.FilesQueue', () => {
    let queue;
    let folderPath;

    beforeAll(() => {
      folderPath = path.join(tools.tmpPath, 'queue');
    });
    
    test('should create an instance', () => {
      queue = new utils.FilesQueue(folderPath, { limit: 3, ext: 'db' });
      expect(queue.folderPath).toEqual(folderPath);
    });

    test('should initialize it', async () => {
      await queue.init();
      expect(await fse.pathExists(folderPath)).toBe(true)
    });

    test('should normalize the queue', async () => {
      for(let i = queue.options.limit; i >= 0; i--) {
        await fse.ensureFile(path.join(folderPath, queue.createName(i + 1)));
      }

      await queue.normalize();
      expect(queue.files.length).toBe(queue.options.limit);
      let index = 0;
      
      for(let i = 0; i < queue.files.length; i++) {
        const file = queue.files[i];
        expect(file.index > index).toBeTruthy();        
        index = file.index;
      }
    });
  });
});