/**
 * Service tests for ZephyrClient: mock Zephyr API responses and assert client behaviour.
 * Import nock first so it patches http before the client's axios is used.
 */
import nock from 'nock';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { ZephyrClient } from '../src/clients/zephyr-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, 'fixtures/zephyr');

function loadFixture(name: string): unknown {
  const raw = readFileSync(resolve(FIXTURES, name), 'utf8');
  return JSON.parse(raw);
}

const ZEPHYR_ORIGIN = 'https://api.zephyrscale.smartbear.com';

describe('ZephyrClient', () => {
  let client: ZephyrClient;

  beforeAll(() => {
    client = new ZephyrClient();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getTestPlans', () => {
    it('returns normalized testPlans and total from API', async () => {
      const body = loadFixture('testplans-list.json');
      nock(ZEPHYR_ORIGIN)
        .get('/v2/testplans')
        .query({ projectKey: 'CP', maxResults: 50, startAt: 0 })
        .reply(200, body);

      const result = await client.getTestPlans('CP');

      expect(result.total).toBe(1);
      expect(result.testPlans).toHaveLength(1);
      expect(result.testPlans[0].key).toBe('TP-1');
      expect(result.testPlans[0].name).toBe('Test Plan 1');
    });
  });

  describe('searchTestCases', () => {
    it('returns normalized testCases and total from search', async () => {
      const body = loadFixture('testcases-search.json');
      nock(ZEPHYR_ORIGIN)
        .get('/v2/testcases/search')
        .query({ projectKey: 'CP', maxResults: 50 })
        .reply(200, body);

      const result = await client.searchTestCases('CP', undefined, 50);

      expect(result.total).toBe(1);
      expect(result.testCases).toHaveLength(1);
      expect(result.testCases[0].key).toBe('CP-T1');
      expect(result.testCases[0].name).toBe('Sample test case');
    });
  });

  describe('createTestCase', () => {
    it('posts payload and returns created test case', async () => {
      const body = loadFixture('testcase-create.json');
      nock(ZEPHYR_ORIGIN)
        .post('/v2/testcases', (reqBody: Record<string, unknown>) => {
          return reqBody.name === 'New case' && reqBody.projectKey === 'CP';
        })
        .reply(200, body);

      const result = await client.createTestCase({
        projectKey: 'CP',
        name: 'New case',
      });

      expect(result.key).toBe('CP-T2');
      expect(result.name).toBe('Created test case');
      expect(result.id).toBe(1002);
    });
  });

  describe('getTestSteps', () => {
    it('returns normalized steps from API', async () => {
      const body = loadFixture('teststeps-list.json');
      nock(ZEPHYR_ORIGIN)
        .get('/v2/testcases/CP-T1/teststeps')
        .reply(200, body);

      const result = await client.getTestSteps('CP-T1');

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Step one');
      expect(result[0].expectedResult).toBe('Result one');
      expect(result[0].id).toBe(1);
    });
  });
});
