/**
 * Exercise catch branches on tool handlers (HTTP 500 from Zephyr/Jira).
 */
import nock from 'nock';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readJiraIssue, searchJiraIssues } from '../src/tools/jira-issues.js';
import { listProjects } from '../src/tools/projects.js';
import { createTestPlan, listTestPlans, getTestPlan, updateTestPlan } from '../src/tools/test-plans.js';
import {
  createTestCycle,
  listTestCycles,
  getTestCycle,
  addTestCasesToCycle,
  updateTestCycle,
} from '../src/tools/test-cycles.js';
import {
  executeTest,
  getTestExecutionStatus,
  listTestExecutionsInCycle,
  listTestExecutionsNextgen,
  bulkExecuteTests,
  generateTestReport,
  createTestExecution,
  removeTestCaseFromCycle,
} from '../src/tools/test-execution.js';
import {
  createTestCase,
  searchTestCases,
  listTestCasesNextgen,
  getTestCase,
  updateTestCase,
  archiveTestCase,
  unarchiveTestCase,
  deleteTestCase,
  createMultipleTestCases,
} from '../src/tools/test-cases.js';
import { listTestSteps, createTestStep, updateTestStep, deleteTestStep } from '../src/tools/test-steps.js';
import { listFolders, createFolder } from '../src/tools/folders.js';
import {
  listEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
} from '../src/tools/environments.js';
import { listPriorities, listStatuses } from '../src/tools/priorities-statuses.js';

const Z = 'https://api.zephyrscale.smartbear.com';
const V2 = '/v2';
const JIRA = 'https://example.atlassian.net';
const API = '/rest/api/3';

const ENV = {
  JIRA_BASE_URL: JIRA,
  JIRA_USERNAME: 'a@b.com',
  JIRA_API_TOKEN: 'j',
  ZEPHYR_API_TOKEN: 'z',
  ZEPHYR_BASE_URL: 'https://api.zephyrscale.smartbear.com/v2',
};

describe('tool handlers — HTTP error paths', () => {
  beforeAll(() => Object.assign(process.env, ENV));
  afterEach(() => nock.cleanAll());

  it('readJiraIssue / searchJiraIssues', async () => {
    nock(JIRA).get(`${API}/issue/X-1`).query(true).reply(500, { errorMessages: ['fail'] });
    expect((await readJiraIssue({ issueKey: 'X-1' })).success).toBe(false);

    nock(JIRA).get(`${API}/search`).query(true).reply(500, { errorMessages: ['fail'] });
    expect((await searchJiraIssues({ jql: 'x' })).success).toBe(false);
  });

  it('listProjects', async () => {
    nock(Z).get(`${V2}/projects`).query(true).reply(500, { message: 'z' });
    expect((await listProjects({})).success).toBe(false);
  });

  it('test-plans', async () => {
    nock(Z).post(`${V2}/testplans`).reply(500, { message: 'x' });
    expect((await createTestPlan({ name: 'n', projectKey: 'p' })).success).toBe(false);

    nock(Z).get(`${V2}/testplans`).query(true).reply(500);
    expect((await listTestPlans({ projectKey: 'p' })).success).toBe(false);

    nock(Z).get(`${V2}/testplans/k`).reply(500);
    expect((await getTestPlan({ planKey: 'k' })).success).toBe(false);

    nock(Z).get(`${V2}/testplans/k`).reply(200, { id: 1, key: 'k' });
    nock(Z).put(`${V2}/testplans/k`).reply(500);
    expect((await updateTestPlan({ planKey: 'k', name: 'n' })).success).toBe(false);
  });

  it('test-cycles', async () => {
    nock(Z).post(`${V2}/testcycles`).reply(500);
    expect(
      (await createTestCycle({ name: 'c', projectKey: 'p', versionId: '1' })).success
    ).toBe(false);

    nock(Z).get(`${V2}/testcycles`).query(true).reply(500);
    expect((await listTestCycles({ projectKey: 'p' })).success).toBe(false);

    nock(Z).get(`${V2}/testcycles/c`).reply(500);
    expect((await getTestCycle({ cycleKey: 'c' })).success).toBe(false);

    nock(Z).post(`${V2}/testcycles/c/testcases`).reply(500);
    expect(
      (await addTestCasesToCycle({ cycleKey: 'c', testCaseKeys: ['t'] })).success
    ).toBe(false);

    nock(Z).get(`${V2}/testcycles/c`).reply(200, { id: 1 });
    nock(Z).put(`${V2}/testcycles/c`).reply(500);
    expect((await updateTestCycle({ cycleKey: 'c', name: 'x' })).success).toBe(false);
  });

  it('test-execution', async () => {
    nock(Z).put(`${V2}/testexecutions/e`).reply(500);
    expect(
      (await executeTest({ executionId: 'e', status: 'PASS' })).success
    ).toBe(false);

    nock(Z).get(`${V2}/testexecutions`).query({ testCycle: 'c' }).reply(500);
    expect((await getTestExecutionStatus({ cycleId: 'c' })).success).toBe(false);

    nock(Z).get(`${V2}/testexecutions`).query({ testCycle: 'c' }).reply(500);
    expect((await listTestExecutionsInCycle({ cycleId: 'c' })).success).toBe(false);

    nock(Z).get(`${V2}/testexecutions/nextgen`).query(true).reply(500);
    expect((await listTestExecutionsNextgen({ projectKey: 'p' })).success).toBe(false);

    nock(Z).put(`${V2}/testexecutions/x`).reply(500);
    const bulk = await bulkExecuteTests({
      executions: [{ executionId: 'x', status: 'PASS' }],
    });
    expect(bulk.success).toBe(true);
    expect(bulk.data?.results?.[0]?.success).toBe(false);

    nock(Z).get(`${V2}/testcycles/c`).reply(500);
    expect((await generateTestReport({ cycleId: 'c' })).success).toBe(false);

    nock(Z).post(`${V2}/testexecutions`).reply(500);
    expect(
      (
        await createTestExecution({
          projectKey: 'p',
          testCaseKey: 't',
          testCycleKey: 'c',
        })
      ).success
    ).toBe(false);

    nock(Z).delete(`${V2}/testexecutions/e`).reply(500);
    expect((await removeTestCaseFromCycle({ executionId: 'e' })).success).toBe(false);
  });

  it('test-cases', async () => {
    nock(Z).post(`${V2}/testcases`).reply(500);
    expect((await createTestCase({ projectKey: 'p', name: 'n' })).success).toBe(false);

    nock(Z).get(`${V2}/testcases/search`).query(true).reply(500);
    expect((await searchTestCases({ projectKey: 'p' })).success).toBe(false);

    nock(Z).get(`${V2}/testcases/nextgen`).query(true).reply(500);
    expect((await listTestCasesNextgen({ projectKey: 'p' })).success).toBe(false);

    nock(Z).get(`${V2}/testcases/t`).reply(500);
    expect((await getTestCase({ testCaseId: 't' })).success).toBe(false);

    nock(Z).get(`${V2}/testcases/t`).reply(200, { id: 1, key: 't', name: 'n', project: { id: 1 }, priority: { id: 1 }, status: { id: 1 }, labels: [] });
    nock(Z).put(`${V2}/testcases/t`).reply(500);
    expect((await updateTestCase({ testCaseId: 't', name: 'u' })).success).toBe(false);

    nock(Z).get(`${V2}/testcases/t`).reply(200, { id: 1, key: 't', name: 'n', project: { id: 1 }, priority: { id: 1 }, status: { id: 1 }, labels: [] });
    nock(Z).put(`${V2}/testcases/t`).reply(500);
    expect((await archiveTestCase({ testCaseKey: 't' })).success).toBe(false);

    nock(Z).get(`${V2}/testcases/t`).reply(200, { id: 1, key: 't', name: 'n', project: { id: 1 }, priority: { id: 1 }, status: { id: 1 }, labels: [] });
    nock(Z).put(`${V2}/testcases/t`).reply(500);
    expect((await unarchiveTestCase({ testCaseKey: 't' })).success).toBe(false);

    nock(Z).delete(`${V2}/testcases/t`).reply(500);
    expect((await deleteTestCase({ testCaseKey: 't' })).success).toBe(false);

    nock(Z).post(`${V2}/testcases`).reply(500);
    const multi = await createMultipleTestCases({
      testCases: [{ projectKey: 'p', name: 'n' }],
    });
    expect(multi.success).toBe(true);
    expect(multi.data?.results?.[0]?.success).toBe(false);
  });

  it('test-steps', async () => {
    nock(Z).get(`${V2}/testcases/t/teststeps`).reply(500);
    expect((await listTestSteps({ testCaseKey: 't' })).success).toBe(false);

    nock(Z).post(`${V2}/testcases/t/teststeps`).reply(500);
    expect(
      (
        await createTestStep({
          testCaseKey: 't',
          description: 'd',
          expectedResult: 'e',
        })
      ).success
    ).toBe(false);

    nock(Z).put(`${V2}/testcases/t/teststeps/1`).reply(500);
    expect(
      (
        await updateTestStep({
          testCaseKey: 't',
          stepId: 1,
          description: 'd',
        })
      ).success
    ).toBe(false);

    nock(Z).delete(`${V2}/testcases/t/teststeps/1`).reply(500);
    expect((await deleteTestStep({ testCaseKey: 't', stepId: 1 })).success).toBe(false);
  });

  it('folders', async () => {
    nock(Z).get(`${V2}/folders`).query(true).reply(500);
    expect((await listFolders({ projectKey: 'p' })).success).toBe(false);

    nock(Z).post(`${V2}/folders`).reply(500);
    expect((await createFolder({ projectKey: 'p', name: 'f' })).success).toBe(false);
  });

  it('environments', async () => {
    nock(Z).get(`${V2}/environments`).query(true).reply(500);
    expect((await listEnvironments({ projectKey: 'p' })).success).toBe(false);

    nock(Z).get(`${V2}/environments/e`).reply(500);
    expect((await getEnvironment({ environmentId: 'e' })).success).toBe(false);

    nock(Z).post(`${V2}/environments`).reply(500);
    expect(
      (await createEnvironment({ projectKey: 'p', name: 'e' })).success
    ).toBe(false);

    nock(Z).get(`${V2}/environments/e`).reply(200, { id: 'e', name: 'x' });
    nock(Z).put(`${V2}/environments/e`).reply(500);
    expect((await updateEnvironment({ environmentId: 'e', name: 'y' })).success).toBe(false);
  });

  it('priorities / statuses', async () => {
    nock(Z).get(`${V2}/priorities`).query(true).reply(500);
    expect((await listPriorities({})).success).toBe(false);

    nock(Z).get(`${V2}/statuses`).query(true).reply(500);
    expect((await listStatuses({})).success).toBe(false);
  });
});
