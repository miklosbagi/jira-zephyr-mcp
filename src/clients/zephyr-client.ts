import axios, { AxiosInstance } from 'axios';
import { getZephyrBaseUrl, getZephyrHeaders } from '../utils/config.js';
import {
  ZephyrTestPlan,
  ZephyrTestCycle,
  ZephyrTestExecution,
  ZephyrTestCase,
  ZephyrTestReport,
  ZephyrExecutionSummary,
  ZephyrFolder,
  ZephyrPriority,
  ZephyrStatus,
  ZephyrTestStep,
  ZephyrProject,
  ZephyrEnvironment,
  ZephyrCursorPage,
} from '../types/zephyr-types.js';

export class ZephyrClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getZephyrBaseUrl(),
      headers: getZephyrHeaders(),
      timeout: 30000,
    });
  }

  async createTestPlan(data: {
    name: string;
    description?: string;
    projectKey: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ZephyrTestPlan> {
    const payload = {
      name: data.name,
      objective: data.description,
      projectKey: data.projectKey,
      plannedStartDate: data.startDate,
      plannedEndDate: data.endDate,
    };

    const response = await this.client.post('/testplans', payload);
    return response.data;
  }

  async getTestPlans(projectKey: string, limit = 50, offset = 0): Promise<{
    testPlans: ZephyrTestPlan[];
    total: number;
  }> {
    const params = {
      projectKey,
      maxResults: limit,
      startAt: offset,
    };

    const response = await this.client.get('/testplans', { params });
    return {
      testPlans: response.data.values || response.data,
      total: response.data.total || response.data.length,
    };
  }

  async getTestPlan(planKeyOrId: string): Promise<ZephyrTestPlan> {
    const response = await this.client.get(`/testplans/${planKeyOrId}`);
    return response.data;
  }

  /**
   * Update a test plan: GET-merge-PUT. The published OpenAPI does not list PUT /testplans/{key};
   * some tenants still accept it (same pattern as test cases / cycles).
   */
  async updateTestPlan(planKey: string, data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    folderId?: string | number | null;
    ownerAccountId?: string;
    customFields?: Record<string, unknown>;
    labels?: string[];
  }): Promise<ZephyrTestPlan> {
    const existing = (await this.client.get(`/testplans/${planKey}`)).data as Record<string, unknown>;
    const payload: Record<string, unknown> = { ...existing };
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) {
      payload.objective = data.description;
      payload.description = data.description;
    }
    if (data.startDate !== undefined) payload.plannedStartDate = data.startDate;
    if (data.endDate !== undefined) payload.plannedEndDate = data.endDate;
    if (data.status !== undefined) payload.status = { id: Number(data.status) };
    if (data.folderId !== undefined) {
      if (data.folderId === null) {
        payload.folder = null;
      } else {
        payload.folder = { id: Number(data.folderId) };
      }
    }
    if (data.ownerAccountId !== undefined) {
      const prev = existing.owner;
      payload.owner = {
        ...(prev && typeof prev === 'object' ? (prev as Record<string, unknown>) : {}),
        accountId: data.ownerAccountId,
      };
    }
    if (data.customFields !== undefined) {
      const prev = existing.customFields;
      payload.customFields = {
        ...(typeof prev === 'object' && prev !== null ? (prev as Record<string, unknown>) : {}),
        ...data.customFields,
      };
    }
    if (data.labels !== undefined) payload.labels = data.labels;
    const response = await this.client.put(`/testplans/${planKey}`, payload);
    return response.data;
  }

  async createTestCycle(data: {
    name: string;
    description?: string;
    projectKey: string;
    versionId: string;
    folderId?: string | number;
    environment?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ZephyrTestCycle> {
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      projectKey: data.projectKey,
      versionId: data.versionId,
      environment: data.environment,
      plannedStartDate: data.startDate,
      plannedEndDate: data.endDate,
    };
    if (data.folderId != null) {
      payload.folderId = data.folderId;
    }

    const response = await this.client.post('/testcycles', payload);
    return response.data;
  }

  async updateTestCycle(cycleKey: string, data: {
    name?: string;
    description?: string;
    folderId?: string | number | null;
    environment?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    versionId?: string;
    ownerAccountId?: string;
    customFields?: Record<string, unknown>;
  }): Promise<ZephyrTestCycle> {
    const existing = (await this.client.get(`/testcycles/${cycleKey}`)).data as Record<string, unknown>;
    const payload: Record<string, unknown> = { ...existing };
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.startDate !== undefined) payload.plannedStartDate = data.startDate;
    if (data.endDate !== undefined) payload.plannedEndDate = data.endDate;
    if (data.environment !== undefined) payload.environment = data.environment;
    if (data.folderId !== undefined) payload.folderId = data.folderId;
    if (data.status !== undefined) payload.status = { id: Number(data.status) };
    if (data.versionId !== undefined) {
      const vid = Number(data.versionId);
      const jpv = existing.jiraProjectVersion;
      payload.jiraProjectVersion = {
        ...(jpv && typeof jpv === 'object' ? (jpv as Record<string, unknown>) : {}),
        id: vid,
      };
      if (existing.versionId !== undefined) payload.versionId = data.versionId;
    }
    if (data.ownerAccountId !== undefined) {
      const prev = existing.owner;
      payload.owner = {
        ...(prev && typeof prev === 'object' ? (prev as Record<string, unknown>) : {}),
        accountId: data.ownerAccountId,
      };
    }
    if (data.customFields !== undefined) {
      const prev = existing.customFields;
      payload.customFields = {
        ...(typeof prev === 'object' && prev !== null ? (prev as Record<string, unknown>) : {}),
        ...data.customFields,
      };
    }
    const response = await this.client.put(`/testcycles/${cycleKey}`, payload);
    return response.data;
  }

  async getTestCycles(projectKey: string, versionId?: string, limit = 50): Promise<{
    testCycles: ZephyrTestCycle[];
    total: number;
  }> {
    const params = {
      projectKey,
      versionId,
      maxResults: limit,
    };

    const response = await this.client.get('/testcycles', { params });
    const testCycles = Array.isArray(response.data.values) ? response.data.values : (Array.isArray(response.data) ? response.data : []);
    return {
      testCycles,
      total: response.data.total ?? testCycles.length,
    };
  }

  async getTestCycle(cycleKeyOrId: string): Promise<ZephyrTestCycle> {
    const response = await this.client.get(`/testcycles/${cycleKeyOrId}`);
    return response.data;
  }

  async getProjects(limit = 50, startAt = 0): Promise<{ projects: ZephyrProject[]; total: number }> {
    const params = { maxResults: limit, startAt };
    const response = await this.client.get('/projects', { params });
    const projects = Array.isArray(response.data.values)
      ? response.data.values
      : Array.isArray(response.data)
        ? response.data
        : [];
    return {
      projects: projects as ZephyrProject[],
      total: response.data.total ?? projects.length,
    };
  }

  async getFolders(projectKey: string, options?: {
    folderType?: 'TEST_CASE' | 'TEST_CYCLE';
    parentId?: number | null;
    limit?: number;
    startAt?: number;
  }): Promise<{ folders: ZephyrFolder[]; total: number }> {
    const params: Record<string, string | number | undefined> = {
      projectKey,
      maxResults: options?.limit ?? 50,
      startAt: options?.startAt ?? 0,
    };
    if (options?.folderType) {
      params.folderType = options.folderType;
    }
    if (options?.parentId != null) {
      params.parentId = options.parentId;
    }
    const response = await this.client.get('/folders', { params });
    const folders = Array.isArray(response.data.values)
      ? response.data.values
      : Array.isArray(response.data)
        ? response.data
        : [];
    return {
      folders: folders as ZephyrFolder[],
      total: response.data.total ?? folders.length,
    };
  }

  async createFolder(data: {
    projectKey: string;
    name: string;
    parentId?: number | null;
    folderType?: 'TEST_CASE' | 'TEST_CYCLE';
  }): Promise<ZephyrFolder> {
    const payload: Record<string, string | number | null | undefined> = {
      projectKey: data.projectKey,
      name: data.name,
    };
    if (data.parentId != null) {
      payload.parentId = data.parentId;
    }
    if (data.folderType) {
      payload.folderType = data.folderType;
    }
    const response = await this.client.post('/folders', payload);
    return response.data;
  }

  async getPriorities(projectKey?: string): Promise<ZephyrPriority[]> {
    const params = projectKey ? { projectKey } : {};
    const response = await this.client.get('/priorities', { params });
    const list = response.data.values ?? response.data ?? [];
    return Array.isArray(list) ? list : [];
  }

  async getStatuses(projectKey?: string): Promise<ZephyrStatus[]> {
    const params = projectKey ? { projectKey } : {};
    const response = await this.client.get('/statuses', { params });
    const list = response.data.values ?? response.data ?? [];
    return Array.isArray(list) ? list : [];
  }

  async getEnvironments(projectKey: string, limit = 50, startAt = 0): Promise<{
    environments: ZephyrEnvironment[];
    total: number;
  }> {
    const params = {
      projectKey,
      maxResults: limit,
      startAt,
    };
    const response = await this.client.get('/environments', { params });
    const environments = Array.isArray(response.data.values)
      ? response.data.values
      : Array.isArray(response.data)
        ? response.data
        : [];
    return {
      environments: environments as ZephyrEnvironment[],
      total: response.data.total ?? environments.length,
    };
  }

  async getEnvironment(environmentIdOrKey: string): Promise<ZephyrEnvironment> {
    const id = encodeURIComponent(environmentIdOrKey);
    const response = await this.client.get(`/environments/${id}`);
    return response.data;
  }

  async createEnvironment(data: {
    projectKey: string;
    name: string;
    description?: string;
  }): Promise<ZephyrEnvironment> {
    const payload: Record<string, string> = {
      projectKey: data.projectKey,
      name: data.name,
    };
    if (data.description !== undefined) {
      payload.description = data.description;
    }
    const response = await this.client.post('/environments', payload);
    return response.data;
  }

  /**
   * PUT clears unspecified fields on some tenants; we GET first and merge like update_test_case.
   */
  async updateEnvironment(environmentIdOrKey: string, data: {
    name?: string;
    description?: string | null;
  }): Promise<ZephyrEnvironment> {
    const id = encodeURIComponent(environmentIdOrKey);
    const existing = (await this.client.get(`/environments/${id}`)).data as Record<string, unknown>;
    const payload = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
    };
    const response = await this.client.put(`/environments/${id}`, payload);
    return response.data;
  }

  async addTestCasesToCycle(cycleKey: string, testCaseKeys: string[]): Promise<void> {
    const payload = {
      items: testCaseKeys.map(testCaseKey => ({ testCaseKey })),
    };
    await this.client.post(`/testcycles/${cycleKey}/testcases`, payload);
  }

  /**
   * Create a test execution (workaround for adding test cases to a cycle when
   * POST /testcycles/{key}/testcases is not available, e.g. on EU API).
   * Use statusName "Not Executed" to mimic adding a test case to a cycle in the UI.
   */
  async createTestExecution(data: {
    projectKey: string;
    testCaseKey: string;
    testCycleKey: string;
    statusName?: string;
    environmentName?: string;
  }): Promise<ZephyrTestExecution> {
    const payload = {
      projectKey: data.projectKey,
      testCaseKey: data.testCaseKey,
      testCycleKey: data.testCycleKey,
      statusName: data.statusName ?? 'Not Executed',
      ...(data.environmentName && { environmentName: data.environmentName }),
    };
    const response = await this.client.post('/testexecutions', payload);
    return response.data;
  }

  async getTestExecution(executionId: string): Promise<ZephyrTestExecution> {
    const response = await this.client.get(`/testexecutions/${executionId}`);
    return response.data;
  }

  /**
   * Remove a test case from a cycle by deleting its test execution (Scale Cloud v2:
   * DELETE /testexecutions/{id}). Some instances document this poorly; if the API returns
   * 404/405, removal may not be enabled for your tenant.
   */
  async deleteTestExecution(executionIdOrKey: string): Promise<void> {
    const id = encodeURIComponent(executionIdOrKey);
    await this.client.delete(`/testexecutions/${id}`);
  }

  /**
   * Find the execution for testCaseKey in the cycle and delete it (same effect as removing
   * the test case from the cycle in the UI when one execution exists per case).
   */
  async removeTestCaseFromCycle(cycleKey: string, testCaseKey: string): Promise<{ executionId: string }> {
    const { executions } = await this.getTestExecutionsInCycle(cycleKey);
    type ExRow = ZephyrTestExecution & { testCase?: { key?: string }; testCaseKey?: string };
    const rows = executions as ExRow[];
    const matches = rows.filter(ex => {
      const key = ex.testCase?.key ?? ex.testCaseKey;
      return key === testCaseKey;
    });
    if (matches.length === 0) {
      throw new Error(
        `No test execution in cycle "${cycleKey}" for test case "${testCaseKey}". Use list_test_executions_in_cycle to list executions.`
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `Multiple executions for test case "${testCaseKey}" in cycle "${cycleKey}"; pass executionId from list_test_executions_in_cycle.`
      );
    }
    const match = matches[0];
    const rawId = match.id ?? match.key;
    if (rawId == null || rawId === '') {
      throw new Error('Matched execution has no id or key; cannot delete.');
    }
    const executionId = String(rawId);
    await this.deleteTestExecution(executionId);
    return { executionId };
  }

  async updateTestExecution(data: {
    executionId: string;
    status: 'PASS' | 'FAIL' | 'WIP' | 'BLOCKED';
    comment?: string;
    defects?: string[];
  }): Promise<ZephyrTestExecution> {
    const payload = {
      status: data.status,
      comment: data.comment,
      issues: data.defects?.map(key => ({ key })),
    };

    const response = await this.client.put(`/testexecutions/${data.executionId}`, payload);
    return response.data;
  }

  /**
   * GET /testexecutions/nextgen — cursor-paged test executions for large volumes (OpenAPI `listTestExecutionsNextgen`).
   * Use `nextStartAtId` (or the `next` URL) for the following page.
   */
  async listTestExecutionsNextgen(options: {
    projectKey?: string;
    testCycle?: string;
    testCase?: string;
    actualEndDateAfter?: string;
    actualEndDateBefore?: string;
    includeStepLinks?: boolean;
    jiraProjectVersionId?: number;
    onlyLastExecutions?: boolean;
    limit?: number;
    startAtId?: number;
  }): Promise<ZephyrCursorPage & { values: ZephyrTestExecution[] }> {
    const params: Record<string, string | number | boolean> = {
      limit: options.limit ?? 50,
      startAtId: options.startAtId ?? 0,
    };
    if (options.projectKey !== undefined) params.projectKey = options.projectKey;
    if (options.testCycle !== undefined) params.testCycle = options.testCycle;
    if (options.testCase !== undefined) params.testCase = options.testCase;
    if (options.actualEndDateAfter !== undefined) params.actualEndDateAfter = options.actualEndDateAfter;
    if (options.actualEndDateBefore !== undefined) params.actualEndDateBefore = options.actualEndDateBefore;
    if (options.includeStepLinks !== undefined) params.includeStepLinks = options.includeStepLinks;
    if (options.jiraProjectVersionId !== undefined) params.jiraProjectVersionId = options.jiraProjectVersionId;
    if (options.onlyLastExecutions !== undefined) params.onlyLastExecutions = options.onlyLastExecutions;

    const response = await this.client.get('/testexecutions/nextgen', { params });
    const d = response.data as Record<string, unknown>;
    const values = (d.values as ZephyrTestExecution[]) ?? [];
    return {
      values: Array.isArray(values) ? values : [],
      limit: Number(d.limit ?? 0),
      nextStartAtId: d.nextStartAtId != null ? Number(d.nextStartAtId) : null,
      next: d.next != null ? String(d.next) : null,
    };
  }

  /**
   * Sequentially PUT each test execution (same contract as `execute_test`). There is no documented single-request
   * bulk update for executions in the public Scale Cloud API; this helper mirrors `create_multiple_test_cases`.
   */
  async bulkExecuteTests(
    items: Array<{
      executionId: string;
      status: 'PASS' | 'FAIL' | 'WIP' | 'BLOCKED';
      comment?: string;
      defects?: string[];
    }>,
    continueOnError = true
  ): Promise<{
    results: Array<{
      index: number;
      success: boolean;
      data?: ZephyrTestExecution;
      error?: string;
    }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const results: Array<{
      index: number;
      success: boolean;
      data?: ZephyrTestExecution;
      error?: string;
    }> = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
      try {
        const data = await this.updateTestExecution(items[i]);
        results.push({ index: i, success: true, data });
        successful++;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage = err.response?.data?.message || err.message || String(error);
        results.push({ index: i, success: false, error: errorMessage });
        failed++;
        if (!continueOnError) break;
      }
    }

    return {
      results,
      summary: { total: items.length, successful, failed },
    };
  }

  async getTestExecutionsInCycle(cycleId: string): Promise<{
    executions: ZephyrTestExecution[];
    total: number;
  }> {
    // Zephyr Scale Cloud: use query param (path /testcycles/{id}/testexecutions may not exist)
    const response = await this.client.get('/testexecutions', {
      params: { testCycle: cycleId },
    });
    const executions = response.data.values || response.data || [];
    const total = response.data.total ?? (Array.isArray(executions) ? executions.length : 0);
    return { executions: Array.isArray(executions) ? executions : [], total };
  }

  async getTestExecutionSummary(cycleId: string): Promise<ZephyrExecutionSummary> {
    const { executions } = await this.getTestExecutionsInCycle(cycleId);

    const summary = executions.reduce(
      (acc: any, execution: any) => {
        acc.total++;
        switch (execution.status) {
          case 'PASS':
            acc.passed++;
            break;
          case 'FAIL':
            acc.failed++;
            break;
          case 'BLOCKED':
            acc.blocked++;
            break;
          case 'WIP':
            acc.inProgress++;
            break;
          default:
            acc.notExecuted++;
        }
        return acc;
      },
      { total: 0, passed: 0, failed: 0, blocked: 0, inProgress: 0, notExecuted: 0 }
    );

    summary.passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
    return summary;
  }

  /**
   * GET /testcases/{key}/links — Jira issue links and web links for the test case.
   * @see https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cases/operation/getTestCaseLinks
   */
  async getTestCaseLinks(testCaseKeyOrId: string): Promise<unknown> {
    const response = await this.client.get(`/testcases/${testCaseKeyOrId}/links`);
    return response.data;
  }

  /**
   * POST /testcases/{key}/links/issues — link a Jira issue by numeric Cloud issue id.
   * @see https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cases/operation/createTestCaseIssueLink
   */
  async createTestCaseIssueLink(testCaseKeyOrId: string, issueId: number): Promise<unknown> {
    const response = await this.client.post(`/testcases/${testCaseKeyOrId}/links/issues`, {
      issueId,
    });
    return response.data;
  }

  /**
   * GET /testcycles/{key}/links
   * @see https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cycles/operation/getTestCycleLinks
   */
  async getTestCycleLinks(cycleKeyOrId: string): Promise<unknown> {
    const response = await this.client.get(`/testcycles/${cycleKeyOrId}/links`);
    return response.data;
  }

  /**
   * POST /testcycles/{key}/links/issues
   * @see https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cycles/operation/createTestCycleIssueLink
   */
  async createTestCycleIssueLink(cycleKeyOrId: string, issueId: number): Promise<unknown> {
    const response = await this.client.post(`/testcycles/${cycleKeyOrId}/links/issues`, {
      issueId,
    });
    return response.data;
  }

  /**
   * POST /testplans/{key}/links/issues
   * @see https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Plans/operation/createTestPlanIssueLink
   */
  async createTestPlanIssueLink(planKeyOrId: string, issueId: number): Promise<unknown> {
    const response = await this.client.post(`/testplans/${planKeyOrId}/links/issues`, {
      issueId,
    });
    return response.data;
  }

  async generateTestReport(cycleId: string): Promise<ZephyrTestReport> {
    const cycleResponse = await this.client.get(`/testcycles/${cycleId}`);
    const cycle = cycleResponse.data;

    const executionsResponse = await this.client.get(`/testcycles/${cycleId}/testexecutions`);
    const executions = executionsResponse.data.values || executionsResponse.data;

    const summary = await this.getTestExecutionSummary(cycleId);

    return {
      cycleId,
      cycleName: cycle.name,
      projectKey: cycle.projectKey,
      summary,
      executions,
      generatedOn: new Date().toISOString(),
    };
  }

  async getTestCase(testCaseId: string): Promise<ZephyrTestCase> {
    const response = await this.client.get(`/testcases/${testCaseId}`);
    return response.data;
  }

  /**
   * Fetch test script details (type, text) for a test case. GET /testcases/{key} only returns testScript.self.
   */
  async getTestScript(testCaseKey: string): Promise<{ type?: string; text?: string; [k: string]: any } | null> {
    try {
      const response = await this.client.get(`/testcases/${testCaseKey}/testscript`);
      return response.data ?? null;
    } catch {
      return null;
    }
  }

  /** Normalize step from API (step/data/result or description/expectedResult/testData) to unified shape. */
  private normalizeStep(raw: Record<string, any>): ZephyrTestStep {
    return {
      id: raw.id,
      orderId: raw.orderId ?? raw.index,
      index: raw.orderId ?? raw.index,
      description: raw.description ?? raw.step ?? '',
      step: raw.step ?? raw.description,
      testData: raw.testData ?? raw.data,
      data: raw.data ?? raw.testData,
      expectedResult: raw.expectedResult ?? raw.result ?? '',
      result: raw.result ?? raw.expectedResult,
    };
  }

  async getTestSteps(testCaseKey: string): Promise<ZephyrTestStep[]> {
    const response = await this.client.get(`/testcases/${testCaseKey}/teststeps`);
    const rawSteps = response.data?.values ?? response.data ?? [];
    const list = Array.isArray(rawSteps) ? rawSteps : [];
    return list.map((s: Record<string, any>) => this.normalizeStep(s));
  }

  async createTestStep(testCaseKey: string, step: {
    description: string;
    expectedResult: string;
    testData?: string;
    index?: number;
  }): Promise<ZephyrTestStep> {
    const body: Record<string, any> = {
      description: step.description,
      expectedResult: step.expectedResult,
      step: step.description,
      result: step.expectedResult,
    };
    if (step.testData !== undefined && step.testData !== '') {
      body.testData = step.testData;
      body.data = step.testData;
    }
    if (step.index != null) body.index = step.index;
    const response = await this.client.post(`/testcases/${testCaseKey}/teststeps`, body);
    return this.normalizeStep(response.data ?? {});
  }

  async updateTestStep(testCaseKey: string, stepId: number, step: {
    description?: string;
    expectedResult?: string;
    testData?: string;
    index?: number;
  }): Promise<ZephyrTestStep> {
    const body: Record<string, any> = {};
    if (step.description !== undefined) {
      body.description = step.description;
      body.step = step.description;
    }
    if (step.expectedResult !== undefined) {
      body.expectedResult = step.expectedResult;
      body.result = step.expectedResult;
    }
    if (step.testData !== undefined) {
      body.testData = step.testData;
      body.data = step.testData;
    }
    if (step.index !== undefined) body.index = step.index;
    const response = await this.client.put(`/testcases/${testCaseKey}/teststeps/${stepId}`, body);
    return this.normalizeStep(response.data ?? {});
  }

  async deleteTestStep(testCaseKey: string, stepId: number): Promise<void> {
    await this.client.delete(`/testcases/${testCaseKey}/teststeps/${stepId}`);
  }

  async searchTestCases(projectKey: string, query?: string, limit = 50): Promise<{
    testCases: ZephyrTestCase[];
    total: number;
  }> {
    const params = {
      projectKey,
      query,
      maxResults: limit,
    };

    const response = await this.client.get('/testcases/search', { params });
    return {
      testCases: response.data.values || response.data,
      total: response.data.total || response.data.length,
    };
  }

  /**
   * GET /testcases/nextgen — cursor-paged test cases for large volumes (OpenAPI `listTestCasesCursorPaginated`).
   */
  async listTestCasesNextgen(options: {
    projectKey?: string;
    folderId?: number;
    limit?: number;
    startAtId?: number;
  }): Promise<ZephyrCursorPage & { values: ZephyrTestCase[] }> {
    const params: Record<string, string | number> = {
      limit: options.limit ?? 50,
      startAtId: options.startAtId ?? 0,
    };
    if (options.projectKey !== undefined) params.projectKey = options.projectKey;
    if (options.folderId !== undefined) params.folderId = options.folderId;

    const response = await this.client.get('/testcases/nextgen', { params });
    const d = response.data as Record<string, unknown>;
    const values = (d.values as ZephyrTestCase[]) ?? [];
    return {
      values: Array.isArray(values) ? values : [],
      limit: Number(d.limit ?? 0),
      nextStartAtId: d.nextStartAtId != null ? Number(d.nextStartAtId) : null,
      next: d.next != null ? String(d.next) : null,
    };
  }

  async createTestCase(data: {
    projectKey: string;
    name: string;
    objective?: string;
    precondition?: string;
    estimatedTime?: number;
    priority?: string;
    status?: string;
    folderId?: string;
    labels?: string[];
    componentId?: string;
    customFields?: Record<string, any>;
    testScript?: {
      type?: 'STEP_BY_STEP' | 'PLAIN_TEXT' | 'CUCUMBER';
      steps?: Array<{
        index: number;
        description: string;
        testData?: string;
        expectedResult: string;
      }>;
      text?: string;
    };
  }): Promise<ZephyrTestCase> {
    const payload: any = {
      projectKey: data.projectKey,
      name: data.name,
      objective: data.objective,
      precondition: data.precondition,
      estimatedTime: data.estimatedTime,
    };

    if (data.priority) {
      payload.priority = typeof data.priority === 'object' && data.priority !== null && 'id' in data.priority
        ? data.priority
        : { id: Number(data.priority) || data.priority };
    }

    if (data.status) {
      payload.status = typeof data.status === 'object' && data.status !== null && 'id' in data.status
        ? data.status
        : { id: Number(data.status) || data.status };
    }

    if (data.folderId) {
      payload.folderId = data.folderId;
    }

    if (data.labels && data.labels.length > 0) {
      payload.labels = data.labels;
    }

    if (data.componentId) {
      payload.componentId = data.componentId;
    }

    if (data.customFields) {
      payload.customFields = data.customFields;
    }

    const script = data.testScript;
    const isPlainOrCucumber = script && (script.type === 'PLAIN_TEXT' || script.type === 'CUCUMBER') && script.text;
    if (isPlainOrCucumber) {
      const apiType = script!.type === 'PLAIN_TEXT' ? 'plain' : 'bdd';
      payload.testScript = { type: apiType, text: script!.text };
    }

    const response = await this.client.post('/testcases', payload);
    const created = response.data;
    if (script && created?.key) {
      await this._applyTestScriptAfterCreate(created, script);
    }
    return created;
  }

  /**
   * Apply test script after create. Cloud API often ignores inline testScript on POST /testcases.
   * BDD script type cannot be set via public API (see docs Known issues).
   */
  private async _applyTestScriptAfterCreate(created: ZephyrTestCase | { key: string; id?: number; project?: { id: number }; projectId?: number }, script: {
    type?: 'STEP_BY_STEP' | 'PLAIN_TEXT' | 'CUCUMBER';
    steps?: Array<{ index: number; description: string; testData?: string; expectedResult: string }>;
    text?: string;
  }): Promise<void> {
    const testCaseKey = created.key;
    const baseUrl = (this.client.defaults.baseURL ?? '').replace(/\/$/, '');
    const scriptType = script.type ?? (script.steps?.length ? 'STEP_BY_STEP' : 'PLAIN_TEXT');

    if ((scriptType === 'PLAIN_TEXT' || scriptType === 'CUCUMBER') && script.text) {
      const path = `/testcases/${testCaseKey}/testscript`;
      const payload = scriptType === 'PLAIN_TEXT'
        ? { plainScript: { text: script.text } }
        : { bddScript: { text: script.text } };
      let done = false;

      const existing = await this.getTestScript(testCaseKey).catch(() => null);
      if (existing && typeof existing === 'object') {
        const key = scriptType === 'PLAIN_TEXT' ? 'plainScript' : 'bddScript';
        const existingBlock = (existing as any)[key];
        const putBody = existingBlock
          ? { ...(existing as object), [key]: { ...(existingBlock as object), text: script.text } }
          : payload;
        try {
          await this.client.put(path, putBody);
          done = true;
        } catch {
          // continue to fallbacks
        }
      }
      if (!done) {
        try {
          await this.client.put(path, payload);
          done = true;
        } catch {
          // continue
        }
      }
      if (!done) {
        try {
          await this.client.post(path, payload);
          done = true;
        } catch {
          // continue
        }
      }
      if (!done && scriptType === 'PLAIN_TEXT') {
        const alt = { type: 'plain', text: script.text };
        try {
          await this.client.put(path, alt);
          done = true;
        } catch {
          try {
            await this.client.post(path, alt);
            done = true;
          } catch {
            // ignore
          }
        }
      }
      if (!done && scriptType === 'CUCUMBER') {
        for (const typeVal of ['bdd', 'bddScript']) {
          try {
            await this.client.put(path, { type: typeVal, bddScript: { text: script.text } });
            done = true;
            break;
          } catch {
            try {
              await this.client.put(path, { type: typeVal, text: script.text });
              done = true;
              break;
            } catch {
              // continue
            }
          }
        }
      }
      return;
    }

    if (scriptType === 'STEP_BY_STEP' && script.steps?.length) {
      const steps = script.steps.sort((a, b) => a.index - b.index);
      const selfUrl = `${baseUrl}/testcases/${testCaseKey}/teststeps`;
      for (const s of steps) {
        await this._addOneTestStep(testCaseKey, selfUrl, s);
      }
    }
  }

  /**
   * Add a single step. Tries flat body first (createTestStep); if API returns createTestCaseTestSteps error, retries with bulk wrapper (one item).
   */
  private async _addOneTestStep(
    testCaseKey: string,
    _selfUrl: string,
    s: { index: number; description: string; testData?: string; expectedResult: string },
  ): Promise<void> {
    try {
      await this.createTestStep(testCaseKey, {
        description: s.description,
        expectedResult: s.expectedResult,
        testData: s.testData ?? '',
        index: s.index,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? '';
      if (err.response?.status !== 400 || !String(msg).includes('createTestCaseTestSteps')) {
        throw err;
      }
      // Inline step only: do not send testCase in item (API: "inline or call to test, not both").
      const oneItem = {
        inline: {
          description: s.description,
          testData: s.testData ?? '',
          expectedResult: s.expectedResult,
          customFields: null,
        },
      };
      try {
        await this.client.post(`/testcases/${testCaseKey}/teststeps`, {
          createTestCaseTestSteps: { mode: 'APPEND', items: [oneItem] },
        });
      } catch {
        await this.client.post(`/testcases/${testCaseKey}/teststeps`, {
          mode: 'APPEND',
          items: [oneItem],
        });
      }
    }
  }

  async updateTestCase(testCaseKey: string, data: {
    name?: string;
    objective?: string;
    precondition?: string;
    estimatedTime?: number;
    priority?: string;
    status?: string;
    folderId?: string;
    labels?: string[];
    componentId?: string;
    customFields?: Record<string, any>;
    testScript?: {
      type?: 'STEP_BY_STEP' | 'PLAIN_TEXT' | 'CUCUMBER';
      steps?: Array<{
        index: number;
        description: string;
        testData?: string;
        expectedResult: string;
      }>;
      text?: string;
    };
  }): Promise<ZephyrTestCase> {
    const existing = await this.getTestCase(testCaseKey);
    const projectId = existing.project?.id ?? (existing as any).projectKey;
    const priorityId = existing.priority?.id ?? (existing as any).priority;
    const statusId = existing.status?.id ?? (existing as any).status;
    const payload: Record<string, any> = {
      id: existing.id,
      key: existing.key,
      name: data.name !== undefined ? data.name : existing.name,
      project: { id: projectId },
      priority: { id: data.priority !== undefined ? data.priority : priorityId },
      status: { id: data.status !== undefined ? data.status : statusId },
      objective: data.objective !== undefined ? data.objective : existing.objective,
      precondition: data.precondition !== undefined ? data.precondition : existing.precondition,
      estimatedTime: data.estimatedTime !== undefined ? data.estimatedTime : existing.estimatedTime,
      folderId: data.folderId !== undefined ? data.folderId : existing.folder?.id,
      labels: data.labels !== undefined ? data.labels : existing.labels ?? [],
      componentId: data.componentId !== undefined ? data.componentId : existing.component?.id,
      customFields: {
        ...(existing.customFields ?? {}),
        ...(data.customFields ?? {}),
      },
    };
    if (data.testScript !== undefined) payload.testScript = data.testScript;

    const response = await this.client.put(`/testcases/${testCaseKey}`, payload);
    return response.data;
  }

  /**
   * Set test case archived flag via PUT /testcases/{key} with full body.
   * Official docs vary; some tenants accept `archived` on the entity, others return 400.
   */
  async setTestCaseArchived(testCaseKey: string, archived: boolean): Promise<ZephyrTestCase> {
    const existing = await this.getTestCase(testCaseKey);
    const projectId = existing.project?.id ?? (existing as any).projectKey;
    const priorityId = existing.priority?.id ?? (existing as any).priority;
    const statusId = existing.status?.id ?? (existing as any).status;
    const payload: Record<string, any> = {
      id: existing.id,
      key: existing.key,
      name: existing.name,
      project: { id: projectId },
      priority: { id: priorityId },
      status: { id: statusId },
      objective: existing.objective,
      precondition: existing.precondition,
      estimatedTime: existing.estimatedTime,
      folderId: existing.folder?.id,
      labels: existing.labels ?? [],
      componentId: existing.component?.id,
      customFields: { ...(existing.customFields ?? {}) },
      archived,
    };
    const response = await this.client.put(`/testcases/${testCaseKey}`, payload);
    return response.data;
  }

  /**
   * Permanently delete a test case (DELETE /testcases/{key}).
   * Not all instances document or enable this; you may need to archive in the UI first.
   */
  async deleteTestCase(testCaseKey: string): Promise<void> {
    const id = encodeURIComponent(testCaseKey);
    await this.client.delete(`/testcases/${id}`);
  }

  async createMultipleTestCases(testCases: Array<{
    projectKey: string;
    name: string;
    objective?: string;
    precondition?: string;
    estimatedTime?: number;
    priority?: string;
    status?: string;
    folderId?: string;
    labels?: string[];
    componentId?: string;
    customFields?: Record<string, any>;
    testScript?: {
      type?: 'STEP_BY_STEP' | 'PLAIN_TEXT' | 'CUCUMBER';
      steps?: Array<{
        index: number;
        description: string;
        testData?: string;
        expectedResult: string;
      }>;
      text?: string;
    };
  }>, continueOnError = true): Promise<{
    results: Array<{
      index: number;
      success: boolean;
      data?: ZephyrTestCase;
      error?: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < testCases.length; i++) {
      try {
        const testCase = await this.createTestCase(testCases[i]);
        results.push({
          index: i,
          success: true,
          data: testCase,
        });
        successful++;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        results.push({
          index: i,
          success: false,
          error: errorMessage,
        });
        failed++;

        if (!continueOnError) {
          break;
        }
      }
    }

    return {
      results,
      summary: {
        total: testCases.length,
        successful,
        failed,
      },
    };
  }
}