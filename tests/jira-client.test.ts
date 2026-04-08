/**
 * Jira REST client: nock HTTP; fake env only.
 */
import nock from 'nock';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { JiraClient } from '../src/clients/jira-client.js';
import { resetAppConfigCacheForTests } from '../src/utils/config.js';

const JIRA = 'https://example.atlassian.net';
const API = '/rest/api/3';

const ENV = {
  JIRA_BASE_URL: JIRA,
  JIRA_USERNAME: 'a@b.com',
  JIRA_API_TOKEN: 'tok',
  ZEPHYR_API_TOKEN: 'zt',
  ZEPHYR_BASE_URL: 'https://api.zephyrscale.smartbear.com/v2',
};

describe('JiraClient (mocked)', () => {
  let client: JiraClient;

  beforeAll(() => {
    resetAppConfigCacheForTests();
    Object.assign(process.env, ENV);
    client = new JiraClient();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('getIssue', async () => {
    const scope = nock(JIRA)
      .get(`${API}/issue/PROJ-1`)
      .query({ fields: 'summary,status' })
      .reply(200, {
        key: 'PROJ-1',
        fields: {
          summary: 'Hi',
          status: { name: 'Open', statusCategory: { name: 'To Do' } },
        },
      });

    const issue = await client.getIssue('PROJ-1', ['summary', 'status']);
    expect(issue.key).toBe('PROJ-1');
    expect(scope.isDone()).toBe(true);
  });

  it('getIssue without fields', async () => {
    nock(JIRA).get(`${API}/issue/PROJ-2`).reply(200, { key: 'PROJ-2', fields: {} });
    await client.getIssue('PROJ-2');
  });

  it('getProject', async () => {
    nock(JIRA).get(`${API}/project/P`).reply(200, { key: 'P', name: 'Proj' });
    const p = await client.getProject('P');
    expect(p.key).toBe('P');
  });

  it('getProjectVersions', async () => {
    nock(JIRA).get(`${API}/project/P/versions`).reply(200, [{ id: '1', name: 'v1' }]);
    const v = await client.getProjectVersions('P');
    expect(v).toHaveLength(1);
  });

  it('searchIssues', async () => {
    nock(JIRA)
      .get(`${API}/search`)
      .query({ jql: 'project=P', fields: '*all', maxResults: 50 })
      .reply(200, { issues: [{ key: 'P-1' }], total: 1 });

    const r = await client.searchIssues('project=P');
    expect(r.total).toBe(1);
    expect(r.issues[0].key).toBe('P-1');
  });

  it('createIssue then getIssue', async () => {
    nock(JIRA).post(`${API}/issue`).reply(200, { key: 'P-99' });
    nock(JIRA).get(`${API}/issue/P-99`).reply(200, {
      key: 'P-99',
      fields: { summary: 'New' },
    });

    const issue = await client.createIssue({
      projectKey: 'P',
      summary: 'New',
      description: 'Desc',
      issueType: 'Task',
      labels: ['l'],
      components: ['c'],
    });
    expect(issue.key).toBe('P-99');
  });

  it('linkIssues', async () => {
    const scope = nock(JIRA).post(`${API}/issueLink`).reply(200, {});
    await client.linkIssues('P-1', 'P-2', 'Relates');
    expect(scope.isDone()).toBe(true);
  });
});
