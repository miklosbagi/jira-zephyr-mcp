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

  async createTestCycle(data: {
    name: string;
    description?: string;
    projectKey: string;
    versionId: string;
    environment?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ZephyrTestCycle> {
    const payload = {
      name: data.name,
      description: data.description,
      projectKey: data.projectKey,
      versionId: data.versionId,
      environment: data.environment,
      plannedStartDate: data.startDate,
      plannedEndDate: data.endDate,
    };

    const response = await this.client.post('/testcycles', payload);
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

  async linkTestCaseToIssue(testCaseId: string, issueKey: string): Promise<void> {
    const payload = {
      issueKeys: [issueKey],
    };

    await this.client.post(`/testcases/${testCaseId}/links`, payload);
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
      type: 'STEP_BY_STEP' | 'PLAIN_TEXT';
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
      payload.priority = data.priority;
    }

    if (data.status) {
      payload.status = data.status;
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

    if (data.testScript) {
      payload.testScript = data.testScript;
    }

    const response = await this.client.post('/testcases', payload);
    return response.data;
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
      type: 'STEP_BY_STEP' | 'PLAIN_TEXT';
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
      type: 'STEP_BY_STEP' | 'PLAIN_TEXT';
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