/**
 * Integration: getTestCaseLinks tool handler (GET /testcases/{key}/links).
 * Fake env + nock only.
 */
import nock from 'nock';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getTestCaseLinks } from '../src/tools/test-cases.js';

const ZEPHYR_ORIGIN = 'https://api.zephyrscale.smartbear.com';
const V2 = '/v2';

const INTEGRATION_DUMMY_ENV = {
  JIRA_BASE_URL: 'https://example.atlassian.net',
  JIRA_USERNAME: 'test@example.com',
  JIRA_API_TOKEN: 'test-jira-token',
  ZEPHYR_API_TOKEN: 'test-zephyr-token',
  ZEPHYR_BASE_URL: 'https://api.zephyrscale.smartbear.com/v2',
};

describe('getTestCaseLinks tool (integration, mocked)', () => {
  beforeAll(() => {
    Object.assign(process.env, INTEGRATION_DUMMY_ENV);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('returns GET /testcases/{key}/links payload', async () => {
    const body = {
      issues: [{ issueId: 10100, id: 1, type: 'COVERAGE', target: 'https://example.atlassian.net/rest/api/3/issue/10100' }],
      webLinks: [],
    };
    const scope = nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1/links`).reply(200, body);

    const result = await getTestCaseLinks({ testCaseId: 'PROJ-T1' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(body);
    expect(scope.isDone()).toBe(true);
  });
});
