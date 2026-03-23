import { ZephyrClient } from '../clients/zephyr-client.js';
import { getZephyrBaseUrl } from '../utils/config.js';
import {
  createTestCaseSchema,
  searchTestCasesSchema,
  createMultipleTestCasesSchema,
  updateTestCaseSchema,
  archiveTestCaseSchema,
  unarchiveTestCaseSchema,
  deleteTestCaseSchema,
  CreateTestCaseInput,
  SearchTestCasesInput,
  CreateMultipleTestCasesInput,
  UpdateTestCaseInput,
  ArchiveTestCaseInput,
  UnarchiveTestCaseInput,
  DeleteTestCaseInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const createTestCase = async (input: CreateTestCaseInput) => {
  const validatedInput = createTestCaseSchema.parse(input);
  
  try {
    const testCase = await getZephyrClient().createTestCase({
      projectKey: validatedInput.projectKey,
      name: validatedInput.name,
      objective: validatedInput.objective,
      precondition: validatedInput.precondition,
      estimatedTime: validatedInput.estimatedTime,
      priority: validatedInput.priority,
      status: validatedInput.status,
      folderId: validatedInput.folderId,
      labels: validatedInput.labels,
      componentId: validatedInput.componentId,
      customFields: validatedInput.customFields,
      testScript: validatedInput.testScript,
    });
    
    return {
      success: true,
      data: {
        id: testCase.id,
        key: testCase.key,
        name: testCase.name,
        projectKey: testCase.project?.id,
        objective: testCase.objective,
        precondition: testCase.precondition,
        estimatedTime: testCase.estimatedTime,
        priority: testCase.priority?.id,
        status: testCase.status?.id,
        folder: testCase.folder?.id,
        labels: testCase.labels || [],
        component: testCase.component?.id,
        owner: testCase.owner?.accountId,
        createdOn: testCase.createdOn,
        links: {
          self: `${getZephyrBaseUrl().replace(/\/$/, '')}/testcases/${testCase.key}`,
          issues: testCase.links?.issues?.length || 0,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const searchTestCases = async (input: SearchTestCasesInput) => {
  const validatedInput = searchTestCasesSchema.parse(input);
  
  try {
    const result = await getZephyrClient().searchTestCases(
      validatedInput.projectKey,
      validatedInput.query,
      validatedInput.limit
    );
    
    return {
      success: true,
      data: {
        testCases: result.testCases.map(testCase => ({
          id: testCase.id,
          key: testCase.key,
          name: testCase.name,
          objective: testCase.objective,
          precondition: testCase.precondition,
          estimatedTime: testCase.estimatedTime,
          priority: testCase.priority?.id,
          status: testCase.status?.id,
          folder: testCase.folder?.id,
          labels: testCase.labels || [],
          component: testCase.component?.id,
          owner: testCase.owner?.accountId,
          createdOn: testCase.createdOn,
          linkedIssues: testCase.links?.issues?.length || 0,
        })),
        total: result.total,
        projectKey: validatedInput.projectKey,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const getTestCase = async (input: { testCaseId: string }) => {
  try {
    const testCase = await getZephyrClient().getTestCase(input.testCaseId);
    let testScript = testCase.testScript as Record<string, unknown> | undefined;
    if (testCase.key && testScript?.self) {
      const scriptDetails = await getZephyrClient().getTestScript(testCase.key);
      if (scriptDetails && typeof scriptDetails === 'object') {
        testScript = { ...testScript, ...scriptDetails };
      }
    }
    return {
      success: true,
      data: {
        id: testCase.id,
        key: testCase.key,
        name: testCase.name,
        projectKey: testCase.project?.id,
        objective: testCase.objective,
        precondition: testCase.precondition,
        estimatedTime: testCase.estimatedTime,
        priority: testCase.priority,
        status: testCase.status,
        folder: testCase.folder,
        labels: testCase.labels || [],
        component: testCase.component,
        owner: testCase.owner,
        createdOn: testCase.createdOn,
        customFields: testCase.customFields,
        links: testCase.links,
        testScript,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const updateTestCase = async (input: UpdateTestCaseInput) => {
  const validatedInput = updateTestCaseSchema.parse(input);
  const { testCaseId, ...updates } = validatedInput;
  try {
    const testCase = await getZephyrClient().updateTestCase(testCaseId, updates);
    return {
      success: true,
      data: {
        id: testCase.id,
        key: testCase.key,
        name: testCase.name,
        customFields: testCase.customFields,
        links: {
          self: `${getZephyrBaseUrl().replace(/\/$/, '')}/testcases/${testCase.key}`,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const archiveTestCase = async (input: ArchiveTestCaseInput) => {
  const validatedInput = archiveTestCaseSchema.parse(input);
  try {
    const testCase = await getZephyrClient().setTestCaseArchived(validatedInput.testCaseKey, true);
    return {
      success: true,
      data: {
        id: testCase.id,
        key: testCase.key,
        name: testCase.name,
        archived: (testCase as any).archived ?? true,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const unarchiveTestCase = async (input: UnarchiveTestCaseInput) => {
  const validatedInput = unarchiveTestCaseSchema.parse(input);
  try {
    const testCase = await getZephyrClient().setTestCaseArchived(validatedInput.testCaseKey, false);
    return {
      success: true,
      data: {
        id: testCase.id,
        key: testCase.key,
        name: testCase.name,
        archived: (testCase as any).archived ?? false,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const deleteTestCase = async (input: DeleteTestCaseInput) => {
  const validatedInput = deleteTestCaseSchema.parse(input);
  try {
    await getZephyrClient().deleteTestCase(validatedInput.testCaseKey);
    return {
      success: true,
      data: { testCaseKey: validatedInput.testCaseKey, deleted: true },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const createMultipleTestCases = async (input: CreateMultipleTestCasesInput) => {
  const validatedInput = createMultipleTestCasesSchema.parse(input);
  
  try {
    const result = await getZephyrClient().createMultipleTestCases(
      validatedInput.testCases,
      validatedInput.continueOnError
    );
    
    return {
      success: true,
      data: {
        results: result.results.map(r => ({
          index: r.index,
          success: r.success,
          testCase: r.success ? {
            id: r.data?.id,
            key: r.data?.key,
            name: r.data?.name,
            projectKey: r.data?.project?.id,
            objective: r.data?.objective,
            precondition: r.data?.precondition,
            estimatedTime: r.data?.estimatedTime,
            priority: r.data?.priority?.id,
            status: r.data?.status?.id,
            folder: r.data?.folder?.id,
            labels: r.data?.labels || [],
            component: r.data?.component?.id,
            owner: r.data?.owner?.accountId,
            createdOn: r.data?.createdOn,
            links: {
              self: r.data ? `${getZephyrBaseUrl().replace(/\/$/, '')}/testcases/${r.data.key}` : undefined,
            },
          } : undefined,
          error: r.error,
        })),
        summary: result.summary,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};