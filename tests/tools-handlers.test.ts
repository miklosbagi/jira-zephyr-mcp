/**
 * Tool handlers: one happy path per exported tool (nock + fake env).
 * Covers success branches; some error paths via HTTP 500.
 */
import nock from 'nock';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { readJiraIssue, searchJiraIssues } from '../src/tools/jira-issues.js';
import { listProjects } from '../src/tools/projects.js';
import {
  createTestPlan,
  listTestPlans,
  getTestPlan,
  updateTestPlan,
} from '../src/tools/test-plans.js';
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
  getTestExecution,
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
  getTestCaseLinks,
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
import { resetAppConfigCacheForTests } from '../src/utils/config.js';
import { ZephyrClient } from '../src/clients/zephyr-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = resolve(__dirname, 'fixtures/zephyr');
const load = (n: string) => JSON.parse(readFileSync(resolve(FIX, n), 'utf8'));

const ZEPHYR_ORIGIN = 'https://api.zephyrscale.smartbear.com';
const V2 = '/v2';
const JIRA = 'https://example.atlassian.net';
const JIRA_API = '/rest/api/3';

const ENV = {
  JIRA_BASE_URL: JIRA,
  JIRA_USERNAME: 'a@b.com',
  JIRA_API_TOKEN: 'j',
  ZEPHYR_API_TOKEN: 'z',
  ZEPHYR_BASE_URL: 'https://api.zephyrscale.smartbear.com/v2',
};

describe('tool handlers (smoke, mocked)', () => {
  beforeAll(() => {
    resetAppConfigCacheForTests();
    Object.assign(process.env, ENV);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('readJiraIssue', async () => {
    nock(JIRA)
      .get(`${JIRA_API}/issue/P-1`)
      .query(true)
      .reply(200, {
        key: 'P-1',
        fields: {
          summary: 'S',
          issuetype: { name: 'Bug' },
          project: { key: 'P', name: 'P' },
          labels: ['l1'],
          components: [{ name: 'Comp A' }],
          fixVersions: [{ name: '1.0.0' }],
        },
      });
    const r = await readJiraIssue({ issueKey: 'P-1' });
    expect(r.success).toBe(true);
    expect(r.data?.key).toBe('P-1');
  });

  it('readJiraIssue maps customfield_* into customFields', async () => {
    nock(JIRA)
      .get(`${JIRA_API}/issue/P-99`)
      .query(true)
      .reply(200, {
        key: 'P-99',
        fields: {
          summary: 'S',
          customfield_10000: { value: 'custom' },
        },
      });
    const r = await readJiraIssue({
      issueKey: 'P-99',
      fields: ['summary', 'customfield_10000'],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.customFields).toEqual({ customfield_10000: { value: 'custom' } });
    }
  });

  it('searchJiraIssues', async () => {
    nock(JIRA)
      .get(`${JIRA_API}/search`)
      .query(true)
      .reply(200, {
        issues: [
          {
            key: 'P-1',
            fields: {
              summary: 'S',
              status: { name: 'Open' },
              project: { key: 'P' },
              issuetype: { name: 'T' },
            },
          },
        ],
        total: 1,
      });
    const r = await searchJiraIssues({ jql: 'project=P' });
    expect(r.success).toBe(true);
    expect(r.data?.total).toBe(1);
  });

  it('listProjects', async () => {
    const body = load('projects-list.json');
    nock(ZEPHYR_ORIGIN).get(`${V2}/projects`).query(true).reply(200, body);
    const r = await listProjects({});
    expect(r.success).toBe(true);
  });

  it('test-plans CRUD', async () => {
    nock(ZEPHYR_ORIGIN).post(`${V2}/testplans`).reply(201, load('testplan-get.json'));
    expect((await createTestPlan({ name: 'N', projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testplans`)
      .query(true)
      .reply(200, {
        values: [
          {
            id: 100,
            key: 'TP-1',
            name: 'Test Plan 1',
            description: null,
            status: null,
            createdOn: null,
            updatedOn: null,
            createdBy: { displayName: 'Tester' },
          },
        ],
        total: 1,
      });
    expect((await listTestPlans({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testplans/TP-1`).reply(200, load('testplan-get.json'));
    expect((await getTestPlan({ planKey: 'TP-1' })).success).toBe(true);

    const plan = load('testplan-get.json');
    nock(ZEPHYR_ORIGIN).get(`${V2}/testplans/TP-1`).reply(200, plan);
    nock(ZEPHYR_ORIGIN).put(`${V2}/testplans/TP-1`).reply(200, { ...plan, name: 'U' });
    expect((await updateTestPlan({ planKey: 'TP-1', name: 'U' })).success).toBe(true);
  });

  it('test-cycles', async () => {
    nock(ZEPHYR_ORIGIN).post(`${V2}/testcycles`).reply(201, load('testcycle-get.json'));
    expect(
      (
        await createTestCycle({
          name: 'C',
          projectKey: 'CP',
          versionId: '1',
        })
      ).success
    ).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcycles`).query(true).reply(200, load('testcycles-list.json'));
    expect((await listTestCycles({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcycles/TC-1`).reply(200, load('testcycle-get.json'));
    expect((await getTestCycle({ cycleKey: 'TC-1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).post(`${V2}/testcycles/TC-1/testcases`).reply(200);
    expect(
      (await addTestCasesToCycle({ cycleKey: 'TC-1', testCaseKeys: ['T-1'] })).success
    ).toBe(true);

    const cyc = load('testcycle-get.json');
    nock(ZEPHYR_ORIGIN).get(`${V2}/testcycles/TC-1`).reply(200, cyc);
    nock(ZEPHYR_ORIGIN).put(`${V2}/testcycles/TC-1`).reply(200, cyc);
    expect((await updateTestCycle({ cycleKey: 'TC-1', name: 'X' })).success).toBe(true);
  });

  it('test-execution helpers', async () => {
    const ex = {
      id: 1,
      key: 'E1',
      cycleId: 1,
      testCaseId: 1,
      status: 'PASS',
      comment: null,
      executedOn: null,
      executedBy: null,
      defects: [{ key: 'BUG-1', summary: 'Defect summary' }],
    };
    nock(ZEPHYR_ORIGIN).put(`${V2}/testexecutions/e1`).reply(200, ex);
    const execOut = await executeTest({
      executionId: 'e1',
      status: 'PASS',
    });
    expect(execOut.success).toBe(true);
    if (execOut.success) {
      expect(execOut.data?.defects).toEqual([{ key: 'BUG-1', summary: 'Defect summary' }]);
    }

    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions`).query({ testCycle: 'C1' }).reply(200, {
      values: [{ status: 'PASS' }],
      total: 1,
    });
    expect((await getTestExecutionStatus({ cycleId: 'C1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions`).query({ testCycle: 'C1' }).reply(200, {
      values: [],
      total: 0,
    });
    expect((await listTestExecutionsInCycle({ cycleId: 'C1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions/nextgen`).query(true).reply(200, {
      values: [],
      limit: 50,
      nextStartAtId: null,
      next: null,
    });
    expect((await listTestExecutionsNextgen({ projectKey: 'P' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).put(`${V2}/testexecutions/a`).reply(200, {
      ...ex,
      defects: [],
    });
    expect(
      (
        await bulkExecuteTests({
          executions: [{ executionId: 'a', status: 'PASS' }],
        })
      ).success
    ).toBe(true);

    nock(ZEPHYR_ORIGIN).put(`${V2}/testexecutions/ok1`).reply(200, ex);
    nock(ZEPHYR_ORIGIN)
      .put(`${V2}/testexecutions/bad1`)
      .reply(400, { message: 'cannot update' });
    const bulk = await bulkExecuteTests({
      executions: [
        { executionId: 'ok1', status: 'PASS' },
        { executionId: 'bad1', status: 'PASS' },
      ],
      continueOnError: true,
    });
    expect(bulk.success).toBe(true);
    if (bulk.success && bulk.data) {
      expect(bulk.data.results).toHaveLength(2);
      expect(bulk.data.results[0]?.success).toBe(true);
      expect(bulk.data.results[0]?.execution?.id).toBe(1);
      expect(bulk.data.results[1]?.success).toBe(false);
      expect(bulk.data.results[1]?.execution).toBeUndefined();
      expect(String(bulk.data.results[1]?.error)).toMatch(/cannot update/);
    }

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcycles/C1`).reply(200, { name: 'n', projectKey: 'P' });
    nock(ZEPHYR_ORIGIN).get(`${V2}/testcycles/C1/testexecutions`).reply(200, { values: [] });
    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions`).query({ testCycle: 'C1' }).reply(200, {
      values: [],
      total: 0,
    });
    const rep = await generateTestReport({ cycleId: 'C1', format: 'JSON' });
    expect(rep.success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcycles/C1`).reply(200, { name: 'n', projectKey: 'P' });
    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testcycles/C1/testexecutions`)
      .reply(200, {
        values: [
          {
            key: 'E1',
            status: 'PASS',
            comment: 'note',
            defects: [{ key: 'BUG-1' }],
          },
        ],
      });
    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions`).query({ testCycle: 'C1' }).reply(200, {
      values: [{ status: 'PASS' }],
      total: 1,
    });
    const repHtml = await generateTestReport({ cycleId: 'C1', format: 'HTML' });
    expect(repHtml.success).toBe(true);
    expect(repHtml.data?.format).toBe('HTML');
    expect(String(repHtml.data?.content)).toContain('<!DOCTYPE html>');

    nock(ZEPHYR_ORIGIN).post(`${V2}/testexecutions`).reply(201, load('testexecution-create.json'));
    expect(
      (
        await createTestExecution({
          projectKey: 'P',
          testCaseKey: 'T',
          testCycleKey: 'C',
        })
      ).success
    ).toBe(true);

    nock(ZEPHYR_ORIGIN).delete(`${V2}/testexecutions/ex1`).reply(204);
    expect((await removeTestCaseFromCycle({ executionId: 'ex1' })).success).toBe(true);
  });

  it('test-cases', async () => {
    nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcases`)
      .reply(201, load('testcase-create.json'));
    expect(
      (
        await createTestCase({
          projectKey: 'CP',
          name: 'N',
        })
      ).success
    ).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/search`).query(true).reply(200, load('testcases-search.json'));
    expect((await searchTestCases({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/nextgen`).query(true).reply(200, {
      values: [load('testcase-get.json')],
      limit: 50,
      nextStartAtId: null,
      next: null,
    });
    expect((await listTestCasesNextgen({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testcases/PROJ-T1/links`)
      .reply(200, { issueLinks: [], webLinks: [] });
    expect((await getTestCaseLinks({ testCaseId: 'PROJ-T1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1`).reply(200, load('testcase-get.json'));
    expect((await getTestCase({ testCaseId: 'PROJ-T1' })).success).toBe(true);

    const withScript = {
      ...load('testcase-get.json'),
      testScript: { self: `${ZEPHYR_ORIGIN}${V2}/testcases/PROJ-T1/testscript`, type: 'PLAIN_TEXT' },
    };
    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1`).reply(200, withScript);
    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testcases/PROJ-T1/testscript`)
      .reply(200, { type: 'PLAIN_TEXT', plainScript: { text: 'merged' } });
    const withMerged = await getTestCase({ testCaseId: 'PROJ-T1' });
    expect(withMerged.success).toBe(true);
    if (withMerged.success && withMerged.data?.testScript && typeof withMerged.data.testScript === 'object') {
      expect(withMerged.data.testScript).toMatchObject({
        plainScript: { text: 'merged' },
        self: `${ZEPHYR_ORIGIN}${V2}/testcases/PROJ-T1/testscript`,
      });
    }

    const tc = load('testcase-get.json');
    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1`).reply(200, tc);
    nock(ZEPHYR_ORIGIN).put(`${V2}/testcases/PROJ-T1`).reply(200, { ...tc, name: 'U' });
    expect((await updateTestCase({ testCaseId: 'PROJ-T1', name: 'U' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1`).reply(200, tc);
    nock(ZEPHYR_ORIGIN)
      .put(`${V2}/testcases/PROJ-T1`)
      .reply(400, { message: 'Zephyr rejected update' });
    const updErr = await updateTestCase({ testCaseId: 'PROJ-T1', name: 'Bad' });
    expect(updErr.success).toBe(false);
    expect(String(updErr.error)).toMatch(/Zephyr rejected/);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1`).reply(200, tc);
    nock(ZEPHYR_ORIGIN).put(`${V2}/testcases/PROJ-T1`).reply(200, tc);
    expect((await archiveTestCase({ testCaseKey: 'PROJ-T1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/PROJ-T1`).reply(200, tc);
    nock(ZEPHYR_ORIGIN).put(`${V2}/testcases/PROJ-T1`).reply(200, tc);
    expect((await unarchiveTestCase({ testCaseKey: 'PROJ-T1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).delete(`${V2}/testcases/PROJ-T1`).reply(204);
    expect((await deleteTestCase({ testCaseKey: 'PROJ-T1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcases`)
      .reply(201, load('testcase-create.json'));
    expect(
      (
        await createMultipleTestCases({
          testCases: [{ projectKey: 'CP', name: 'One' }],
        })
      ).success
    ).toBe(true);
  });

  it('test-steps', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/T1/teststeps`).reply(200, load('teststeps-list.json'));
    expect((await listTestSteps({ testCaseKey: 'T1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcases/T1/teststeps`)
      .reply(200, { id: 1, description: 'd', expectedResult: 'e', orderId: 1 });
    expect(
      (
        await createTestStep({
          testCaseKey: 'T1',
          description: 'd',
          expectedResult: 'e',
        })
      ).success
    ).toBe(true);

    nock(ZEPHYR_ORIGIN)
      .put(`${V2}/testcases/T1/teststeps/1`)
      .reply(200, { id: 1, description: 'd2', expectedResult: 'e', orderId: 1 });
    expect(
      (
        await updateTestStep({
          testCaseKey: 'T1',
          stepId: 1,
          description: 'd2',
        })
      ).success
    ).toBe(true);

    nock(ZEPHYR_ORIGIN).delete(`${V2}/testcases/T1/teststeps/1`).reply(204);
    expect((await deleteTestStep({ testCaseKey: 'T1', stepId: 1 })).success).toBe(true);
  });

  it('folders', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/folders`).query(true).reply(200, load('folders-list.json'));
    expect((await listFolders({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).post(`${V2}/folders`).reply(201, { id: 1, name: 'F' });
    expect(
      (
        await createFolder({
          projectKey: 'CP',
          name: 'F',
        })
      ).success
    ).toBe(true);
  });

  it('environments', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/environments`).query(true).reply(200, load('environments-list.json'));
    expect((await listEnvironments({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/environments/e1`).reply(200, load('environment-get.json'));
    expect((await getEnvironment({ environmentId: 'e1' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).post(`${V2}/environments`).reply(201, load('environment-create.json'));
    expect(
      (
        await createEnvironment({
          projectKey: 'CP',
          name: 'Env',
        })
      ).success
    ).toBe(true);

    const env = load('environment-get.json');
    nock(ZEPHYR_ORIGIN).get(`${V2}/environments/e1`).reply(200, env);
    nock(ZEPHYR_ORIGIN).put(`${V2}/environments/e1`).reply(200, env);
    expect(
      (
        await updateEnvironment({
          environmentId: 'e1',
          name: 'E2',
        })
      ).success
    ).toBe(true);
  });

  it('priorities and statuses', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/priorities`).query(true).reply(200, load('priorities-list.json'));
    expect((await listPriorities({ projectKey: 'CP' })).success).toBe(true);

    nock(ZEPHYR_ORIGIN).get(`${V2}/statuses`).query(true).reply(200, load('statuses-list.json'));
    expect((await listStatuses({ projectKey: 'CP' })).success).toBe(true);
  });

  it('listTestExecutionsInCycle returns error when Zephyr fails', async () => {
    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testexecutions`)
      .query((qs: Record<string, string>) => qs.testCycle === 'C-ERR')
      .reply(503, { message: 'Service unavailable' });
    const r = await listTestExecutionsInCycle({ cycleId: 'C-ERR' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(String(r.error)).toMatch(/Service unavailable|503/);
    }
  });

  it('listTestExecutionsNextgen maps execution rows including defects', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions/nextgen`).query(true).reply(200, {
      values: [
        {
          id: 10,
          key: 'EX-10',
          cycleId: 1,
          testCaseId: 100,
          testCase: { key: 'CP-T9' },
          status: 'PASS',
          comment: 'done',
          executedOn: '2025-01-01',
          executedBy: { displayName: 'QA' },
          defects: [{ key: 'BUG-9', summary: 'S9' }],
        },
      ],
      limit: 50,
      nextStartAtId: null,
      next: null,
    });
    const r = await listTestExecutionsNextgen({ projectKey: 'CP' });
    expect(r.success).toBe(true);
    if (r.success && r.data?.executions?.[0]) {
      const row = r.data.executions[0];
      expect(row.testCaseKey).toBe('CP-T9');
      expect(row.testCaseId).toBe(100);
      expect(row.executedBy).toBe('QA');
      expect(row.defects).toEqual([{ key: 'BUG-9', summary: 'S9' }]);
    }
  });

  it('removeTestCaseFromCycle deletes via cycle and test case key', async () => {
    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testexecutions`)
      .query((qs: Record<string, string>) => qs.testCycle === 'TC-RM')
      .reply(200, {
        values: [
          {
            id: 'exec-rm-1',
            key: 'ERM-1',
            testCase: { key: 'CP-TARGET' },
            status: 'PASS',
          },
        ],
        total: 1,
      });
    nock(ZEPHYR_ORIGIN).delete(`${V2}/testexecutions/exec-rm-1`).reply(204);
    const r = await removeTestCaseFromCycle({
      cycleKey: 'TC-RM',
      testCaseKey: 'CP-TARGET',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toMatchObject({
        cycleKey: 'TC-RM',
        testCaseKey: 'CP-TARGET',
        executionId: 'exec-rm-1',
        removed: true,
      });
    }
  });

  it('getTestCaseLinks returns error when Zephyr fails', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/testcases/MISS-T1/links`).reply(404, { message: 'No links' });
    const r = await getTestCaseLinks({ testCaseId: 'MISS-T1' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(String(r.error)).toMatch(/No links|404/);
    }
  });

  it('createTestCase exposes count of linked Jira issues', async () => {
    nock(ZEPHYR_ORIGIN)
      .post(`${V2}/testcases`)
      .reply(201, {
        ...load('testcase-create.json'),
        links: { issues: [{ issueId: 1 }, { issueId: 2 }] },
      });
    const r = await createTestCase({ projectKey: 'CP', name: 'With links' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data?.links?.issues).toBe(2);
    }
  });

  it('createMultipleTestCases surfaces error when client throws unexpectedly', async () => {
    const spy = vi
      .spyOn(ZephyrClient.prototype, 'createMultipleTestCases')
      .mockRejectedValueOnce(new Error('unexpected bulk failure'));
    const r = await createMultipleTestCases({
      testCases: [{ projectKey: 'CP', name: 'One' }],
    });
    spy.mockRestore();
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toBe('unexpected bulk failure');
    }
  });

  it('get_test_execution returns a single execution row', async () => {
    nock(ZEPHYR_ORIGIN).get(`${V2}/testexecutions/e1`).reply(200, {
      id: 1,
      key: 'E1',
      cycleId: 1,
      testCaseId: 1,
      testCase: { key: 'CP-T1' },
      status: 'PASS',
      comment: null,
      executedOn: null,
      executedBy: null,
      defects: [],
    });
    const r = await getTestExecution({ executionId: 'e1' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data?.testCaseKey).toBe('CP-T1');
      expect(r.data?.testCaseId).toBe(1);
      expect(r.data?.status).toBe('PASS');
    }
  });

  it('get_test_execution enriches testCaseKey when API omits key', async () => {
    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testexecutions/99`)
      .reply(200, {
        id: 99,
        key: 'E99',
        testCase: { id: 1001 },
        status: 'PASS',
        defects: [],
      });
    nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testcases/1001`)
      .reply(200, { id: 1001, key: 'CP-T55', name: 'n', project: { id: 1 } });
    const r = await getTestExecution({ executionId: '99' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data?.testCaseKey).toBe('CP-T55');
  });

  it('listTestExecutionsInCycle enriches testCaseKey when API omits key', async () => {
    const listScope = nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testexecutions`)
      .query((qs: Record<string, string>) => qs.testCycle === 'C1')
      .reply(200, {
        values: [{ id: 1, key: 'E1', testCase: { id: 1001 }, status: 'PASS' }],
        total: 1,
      });
    const tcScope = nock(ZEPHYR_ORIGIN)
      .get(`${V2}/testcases/1001`)
      .reply(200, { id: 1001, key: 'CP-T55', name: 'n', project: { id: 1 } });
    const r = await listTestExecutionsInCycle({ cycleId: 'C1' });
    expect(r.success).toBe(true);
    expect(listScope.isDone()).toBe(true);
    expect(r.data && 'executions' in r.data && r.data.executions).toHaveLength(1);
    const row = (r as { success: true; data: { executions: Array<{ testCaseKey?: string; testCaseId?: number }> } })
      .data.executions[0];
    expect(row.testCaseId).toBe(1001);
    expect(tcScope.isDone()).toBe(true);
    expect(row.testCaseKey).toBe('CP-T55');
  });
});
