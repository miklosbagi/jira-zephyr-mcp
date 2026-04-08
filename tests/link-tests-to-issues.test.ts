/**
 * Integration: linkTestsToIssues orchestrates Jira GET issue + Zephyr POST .../links/issues.
 * Fake env + nock only; no real credentials.
 */
import nock from 'nock';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { linkTestsToIssues, linkTestCycleToIssues, linkTestPlanToIssues } from '../src/tools/test-execution.js';

const ZEPHYR_ORIGIN = 'https://api.zephyrscale.smartbear.com';
const V2 = '/v2';

const INTEGRATION_DUMMY_ENV = {
  JIRA_BASE_URL: 'https://example.atlassian.net',
  JIRA_USERNAME: 'test@example.com',
  JIRA_API_TOKEN: 'test-jira-token',
  ZEPHYR_API_TOKEN: 'test-zephyr-token',
  ZEPHYR_BASE_URL: 'https://api.zephyrscale.smartbear.com/v2',
};

describe('linkTestsToIssues (integration, mocked)', () => {
  beforeAll(() => {
    Object.assign(process.env, INTEGRATION_DUMMY_ENV);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('calls Jira GET /issue/{key} then Zephyr POST .../links/issues with issueId', async () => {
    nock('https://example.atlassian.net')
      .get('/rest/api/3/issue/PROJ-123')
      .query({ fields: 'id' })
      .reply(200, {
        id: '10100',
        key: 'PROJ-123',
        self: 'https://example.atlassian.net/rest/api/3/issue/10100',
      });

    const zephyrScope = nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcases/PROJ-T1/links/issues`, (body: Record<string, unknown>) => body.issueId === 10100)
      .reply(201, { id: 1 });

    const result = await linkTestsToIssues({
      testCaseId: 'PROJ-T1',
      issueKeys: ['PROJ-123'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.successCount).toBe(1);
    expect(result.data?.failureCount).toBe(0);
    expect(result.data?.linkResults?.[0]).toMatchObject({
      issueKey: 'PROJ-123',
      issueId: 10100,
      success: true,
    });
    expect(zephyrScope.isDone()).toBe(true);
  });

  it('fails when Jira issue id is not a positive safe integer', async () => {
    nock('https://example.atlassian.net')
      .get('/rest/api/3/issue/PROJ-BAD')
      .query({ fields: 'id' })
      .reply(200, { id: 'not-a-number', key: 'PROJ-BAD', self: 'https://example.atlassian.net/rest/api/3/issue/x' });

    const result = await linkTestsToIssues({
      testCaseId: 'PROJ-T1',
      issueKeys: ['PROJ-BAD'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.failureCount).toBe(1);
    expect(result.data?.linkResults?.[0]?.success).toBe(false);
    expect(String(result.data?.linkResults?.[0]?.error)).toMatch(/numeric Jira issue id|not-a-number/);
  });

  it('records per-issue failure when Zephyr returns an error', async () => {
    nock('https://example.atlassian.net')
      .get('/rest/api/3/issue/PROJ-999')
      .query({ fields: 'id' })
      .reply(200, { id: '99999', key: 'PROJ-999', self: 'https://example.atlassian.net/rest/api/3/issue/99999' });

    nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcases/PROJ-T1/links/issues`)
      .reply(400, { message: 'Invalid issue link' });

    const result = await linkTestsToIssues({
      testCaseId: 'PROJ-T1',
      issueKeys: ['PROJ-999'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.successCount).toBe(0);
    expect(result.data?.failureCount).toBe(1);
    expect(result.data?.linkResults?.[0]?.success).toBe(false);
    expect(String(result.data?.linkResults?.[0]?.error)).toMatch(/400|Invalid issue link/);
  });

  it('linkTestCycleToIssues uses POST .../testcycles/{key}/links/issues', async () => {
    nock('https://example.atlassian.net')
      .get('/rest/api/3/issue/PROJ-456')
      .query({ fields: 'id' })
      .reply(200, { id: '20200', key: 'PROJ-456', self: 'https://example.atlassian.net/rest/api/3/issue/20200' });

    const scope = nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcycles/PROJ-R9/links/issues`, (body: Record<string, unknown>) => body.issueId === 20200)
      .reply(201, { id: 2 });

    const result = await linkTestCycleToIssues({
      cycleKey: 'PROJ-R9',
      issueKeys: ['PROJ-456'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.cycleKey).toBe('PROJ-R9');
    expect(result.data?.linkResults?.[0]).toMatchObject({ issueKey: 'PROJ-456', issueId: 20200, success: true });
    expect(scope.isDone()).toBe(true);
  });

  it('linkTestPlanToIssues uses POST .../testplans/{key}/links/issues', async () => {
    nock('https://example.atlassian.net')
      .get('/rest/api/3/issue/PROJ-789')
      .query({ fields: 'id' })
      .reply(200, { id: '30300', key: 'PROJ-789', self: 'https://example.atlassian.net/rest/api/3/issue/30300' });

    const scope = nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testplans/PROJ-P3/links/issues`, (body: Record<string, unknown>) => body.issueId === 30300)
      .reply(201, { id: 3 });

    const result = await linkTestPlanToIssues({
      planKey: 'PROJ-P3',
      issueKeys: ['PROJ-789'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.planKey).toBe('PROJ-P3');
    expect(result.data?.linkResults?.[0]).toMatchObject({ issueKey: 'PROJ-789', issueId: 30300, success: true });
    expect(scope.isDone()).toBe(true);
  });
});
