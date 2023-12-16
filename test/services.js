import {afterAll, beforeAll, expect, test, describe } from "bun:test";
import NodeFactory from '../src/node';
const Node = NodeFactory();
import tools from './tools';

describe('services', () => {
  let testContext;

  beforeAll(() => {
    testContext = {};
  });

  beforeAll(async () => {
    testContext.node = new Node(await tools.createNodeOptions({ server: false }));
    await testContext.node.init();
  });

  afterAll(async () => {
    await testContext.node.destroy();
  });

  describe('db', () => {
    require('./db/database');
    require('./db/loki');    
  });

  describe('behavior', () => {
    require('./behavior/behavior');
    require('./behavior/fail'); 
  });

  describe('approval', () => {
    require('./approval/approval');
    require('./approval/client'); 
    require('./approval/captcha'); 
  });

  describe('cache', () => {
    require('./cache/cache');
    require('./cache/database');
  });

  describe('logger', () => {
    require('./logger/logger');
    require('./logger/console');
    require('./logger/file');
    require('./logger/adapter');
  });

  describe('task', () => {
    require('./task/task');
    require('./task/interval');
    require('./task/cron');
  });

  describe('server', () => {
    require('./server/server');
    require('./server/express');    
  });
});