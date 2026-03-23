/**
 * Integration tests for ZephyrClient: mocked responses for all Zephyr API calls (nock).
 * Asserts request shape (method, path, query, body) and response handling.
 * No real credentials or .env needed — uses fake Jira endpoint, fake tokens, and fixtures only.
 * All fixtures are sanitized (no real account IDs, names, or tenant URLs). See docs/FIXTURE-SANITIZATION.md.
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
const V2 = '/v2';

/** Fake env for integration tests only; no real credentials or .env required. */
const INTEGRATION_DUMMY_ENV = {
  JIRA_BASE_URL: 'https://example.atlassian.net',
  JIRA_USERNAME: 'test@example.com',
  JIRA_API_TOKEN: 'test-jira-token',
  ZEPHYR_API_TOKEN: 'test-zephyr-token',
  ZEPHYR_BASE_URL: 'https://api.zephyrscale.smartbear.com/v2',
};

describe('ZephyrClient (integration, mocked)', () => {
  let client: ZephyrClient;

  beforeAll(() => {
    Object.assign(process.env, INTEGRATION_DUMMY_ENV);
    client = new ZephyrClient();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getTestPlans', () => {
    it('sends GET /v2/testplans with projectKey and pagination, returns normalized list', async () => {
      const body = loadFixture('testplans-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testplans`)
        .query({ projectKey: 'CP', maxResults: 50, startAt: 0 })
        .reply(200, body);

      const result = await client.getTestPlans('CP');

      expect(result.total).toBe(1);
      expect(result.testPlans).toHaveLength(1);
      expect(result.testPlans[0].key).toBe('TP-1');
      expect(result.testPlans[0].name).toBe('Test Plan 1');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getTestPlan', () => {
    it('sends GET /v2/testplans/{key} and returns single plan', async () => {
      const body = loadFixture('testplan-get.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testplans/TP-1`)
        .reply(200, body);

      const result = await client.getTestPlan('TP-1');

      expect(result.key).toBe('TP-1');
      expect(result.name).toBe('Test Plan 1');
      expect(result.id).toBe(100);
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getTestCycles', () => {
    it('sends GET /v2/testcycles with projectKey and optional versionId, returns list', async () => {
      const body = loadFixture('testcycles-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testcycles`)
        .query({ projectKey: 'PROJ', maxResults: 50 })
        .reply(200, body);

      const result = await client.getTestCycles('PROJ');

      expect(result.total).toBe(1);
      expect(result.testCycles[0].key).toBe('PROJ-R1');
      expect(result.testCycles[0].name).toBe('Cycle 1');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getTestCycle', () => {
    it('sends GET /v2/testcycles/{key} and returns single cycle', async () => {
      const body = loadFixture('testcycle-get.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testcycles/PROJ-R1`)
        .reply(200, body);

      const result = await client.getTestCycle('PROJ-R1');

      expect(result.key).toBe('PROJ-R1');
      expect(result.name).toBe('Sample cycle');
      expect(result.executionSummary.total).toBe(5);
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getProjects', () => {
    it('sends GET /v2/projects with maxResults and startAt, returns list', async () => {
      const body = loadFixture('projects-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/projects`)
        .query({ maxResults: 20, startAt: 0 })
        .reply(200, body);

      const result = await client.getProjects(20, 0);

      expect(result.total).toBe(2);
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].key).toBe('CR');
      expect(result.projects[1].key).toBe('CP');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getFolders', () => {
    it('sends GET /v2/folders with projectKey and pagination', async () => {
      const body = loadFixture('folders-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/folders`)
        .query({ projectKey: 'PROJ', maxResults: 50, startAt: 0 })
        .reply(200, body);

      const result = await client.getFolders('PROJ');

      expect(result.folders).toHaveLength(2);
      expect(result.folders[0].name).toBe('Folder A');
      expect(result.total).toBe(2);
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getPriorities', () => {
    it('sends GET /v2/priorities with optional projectKey', async () => {
      const body = loadFixture('priorities-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/priorities`)
        .query({ projectKey: 'PROJ' })
        .reply(200, body);

      const result = await client.getPriorities('PROJ');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('High');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getStatuses', () => {
    it('sends GET /v2/statuses with optional projectKey', async () => {
      const body = loadFixture('statuses-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/statuses`)
        .query({ projectKey: 'PROJ' })
        .reply(200, body);

      const result = await client.getStatuses('PROJ');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Draft');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getEnvironments', () => {
    it('sends GET /v2/environments with projectKey and pagination', async () => {
      const body = loadFixture('environments-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/environments`)
        .query({ projectKey: 'PROJ', maxResults: 50, startAt: 0 })
        .reply(200, body);

      const result = await client.getEnvironments('PROJ');

      expect(result.environments).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.environments[0].name).toBe('Production');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getEnvironment', () => {
    it('sends GET /v2/environments/{id}', async () => {
      const body = loadFixture('environment-get.json');
      const scope = nock(ZEPHYR_ORIGIN).get(`${V2}/environments/101`).reply(200, body);

      const result = await client.getEnvironment('101');

      expect(result.id).toBe(101);
      expect(result.name).toBe('Production');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('createEnvironment', () => {
    it('sends POST /v2/environments with projectKey and name', async () => {
      const body = loadFixture('environment-create.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .post(`${V2}/environments`, (reqBody: Record<string, unknown>) => {
          return reqBody.projectKey === 'PROJ' && reqBody.name === 'QA' && reqBody.description === 'QA stack';
        })
        .reply(200, body);

      const result = await client.createEnvironment({
        projectKey: 'PROJ',
        name: 'QA',
        description: 'QA stack',
      });

      expect(result.id).toBe(103);
      expect(result.name).toBe('QA');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('updateEnvironment', () => {
    it('GETs then PUTs merged environment body', async () => {
      const existing = loadFixture('environment-get.json') as Record<string, unknown>;
      const updated = { ...existing, name: 'Production EU' };
      const getScope = nock(ZEPHYR_ORIGIN).get(`${V2}/environments/101`).reply(200, existing);
      const putScope = nock(ZEPHYR_ORIGIN)
        .put(`${V2}/environments/101`, (reqBody: Record<string, unknown>) => reqBody.name === 'Production EU')
        .reply(200, updated);

      const result = await client.updateEnvironment('101', { name: 'Production EU' });

      expect(result.name).toBe('Production EU');
      expect(getScope.isDone()).toBe(true);
      expect(putScope.isDone()).toBe(true);
    });
  });

  describe('searchTestCases', () => {
    it('sends GET /v2/testcases/search with projectKey and maxResults', async () => {
      const body = loadFixture('testcases-search.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testcases/search`)
        .query({ projectKey: 'CP', maxResults: 50 })
        .reply(200, body);

      const result = await client.searchTestCases('CP', undefined, 50);

      expect(result.total).toBe(1);
      expect(result.testCases[0].key).toBe('CP-T1');
      expect(result.testCases[0].name).toBe('Sample test case');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getTestCase', () => {
    it('sends GET /v2/testcases/{key} and returns single test case', async () => {
      const body = loadFixture('testcase-get.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testcases/PROJ-T1`)
        .reply(200, body);

      const result = await client.getTestCase('PROJ-T1');

      expect(result.key).toBe('PROJ-T1');
      expect(result.name).toBe('Sample test case');
      expect(result.id).toBe(1001);
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('createTestCase', () => {
    it('sends POST /v2/testcases with expected body and returns created case', async () => {
      const body = loadFixture('testcase-create.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .post(`${V2}/testcases`, (reqBody: Record<string, unknown>) => {
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
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getTestSteps', () => {
    it('sends GET /v2/testcases/{key}/teststeps and returns normalized steps', async () => {
      const body = loadFixture('teststeps-list.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testcases/CP-T1/teststeps`)
        .reply(200, body);

      const result = await client.getTestSteps('CP-T1');

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Step one');
      expect(result[0].expectedResult).toBe('Result one');
      expect(result[0].id).toBe(1);
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('createTestExecution', () => {
    it('sends POST /v2/testexecutions with projectKey, testCaseKey, testCycleKey, statusName', async () => {
      const body = loadFixture('testexecution-create.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .post(`${V2}/testexecutions`, (reqBody: Record<string, unknown>) => {
          return (
            reqBody.projectKey === 'PROJ' &&
            reqBody.testCaseKey === 'PROJ-T1' &&
            reqBody.testCycleKey === 'PROJ-R1' &&
            (reqBody.statusName === 'Not Executed' || reqBody.statusName === undefined)
          );
        })
        .reply(200, body);

      const result = await client.createTestExecution({
        projectKey: 'PROJ',
        testCaseKey: 'PROJ-T1',
        testCycleKey: 'PROJ-R1',
        statusName: 'Not Executed',
      });

      expect(result.id).toBe(5001);
      expect(result.key).toBe('PROJ-E1');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('getTestExecutionsInCycle', () => {
    it('sends GET /v2/testexecutions with query testCycle', async () => {
      const body = loadFixture('testexecutions-in-cycle.json');
      const scope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testexecutions`)
        .query({ testCycle: 'PROJ-R1' })
        .reply(200, body);

      const result = await client.getTestExecutionsInCycle('PROJ-R1');

      expect(result.total).toBe(2);
      expect(result.executions).toHaveLength(2);
      expect(result.executions[0].key).toBe('PROJ-E1');
      expect(scope.isDone()).toBe(true);
    });
  });

  describe('deleteTestExecution', () => {
    it('sends DELETE /v2/testexecutions/{id}', async () => {
      const scope = nock(ZEPHYR_ORIGIN).delete(`${V2}/testexecutions/5001`).reply(204);

      await client.deleteTestExecution('5001');

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('removeTestCaseFromCycle', () => {
    it('lists cycle executions then DELETEs the matching test case execution', async () => {
      const listBody = loadFixture('testexecutions-in-cycle.json');
      const listScope = nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testexecutions`)
        .query({ testCycle: 'PROJ-R1' })
        .reply(200, listBody);
      const delScope = nock(ZEPHYR_ORIGIN).delete(`${V2}/testexecutions/5002`).reply(204);

      const result = await client.removeTestCaseFromCycle('PROJ-R1', 'PROJ-T2');

      expect(result.executionId).toBe('5002');
      expect(listScope.isDone()).toBe(true);
      expect(delScope.isDone()).toBe(true);
    });

    it('throws when no execution matches test case key', async () => {
      const listBody = loadFixture('testexecutions-in-cycle.json');
      nock(ZEPHYR_ORIGIN)
        .get(`${V2}/testexecutions`)
        .query({ testCycle: 'PROJ-R1' })
        .reply(200, listBody);

      await expect(client.removeTestCaseFromCycle('PROJ-R1', 'PROJ-T99')).rejects.toThrow(
        'No test execution in cycle'
      );
    });
  });

  describe('linkTestCaseToIssue', () => {
    it('sends POST /v2/testcases/{id}/links with issueKeys array', async () => {
      const scope = nock(ZEPHYR_ORIGIN)
        .post(`${V2}/testcases/PROJ-T1/links`, (reqBody: Record<string, unknown>) => {
          return Array.isArray(reqBody.issueKeys) && reqBody.issueKeys.includes('PROJ-123');
        })
        .reply(204);

      await client.linkTestCaseToIssue('PROJ-T1', 'PROJ-123');

      expect(scope.isDone()).toBe(true);
    });
  });
});
