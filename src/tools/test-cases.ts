import { ZephyrClient } from '../clients/zephyr-client.js';
import { zephyrToolFailure } from '../utils/zephyr-error-info.js';
import { getZephyrBaseUrl } from '../utils/config.js';
import {
  createTestCaseSchema,
  searchTestCasesSchema,
  listTestCasesNextgenSchema,
  createMultipleTestCasesSchema,
  updateTestCaseSchema,
  archiveTestCaseSchema,
  unarchiveTestCaseSchema,
  deleteTestCaseSchema,
  getTestCaseLinksSchema,
  type CreateTestCaseInput,
  type SearchTestCasesInput,
  type ListTestCasesNextgenInput,
  type CreateMultipleTestCasesInput,
  type UpdateTestCaseInput,
  type ArchiveTestCaseInput,
  type UnarchiveTestCaseInput,
  type DeleteTestCaseInput,
  type GetTestCaseLinksInput,
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['create'] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
  }
};

export const listTestCasesNextgen = async (input: ListTestCasesNextgenInput) => {
  const validatedInput = listTestCasesNextgenSchema.parse(input);
  try {
    const page = await getZephyrClient().listTestCasesNextgen({
      projectKey: validatedInput.projectKey,
      folderId: validatedInput.folderId,
      limit: validatedInput.limit,
      startAtId: validatedInput.startAtId,
    });
    return {
      success: true,
      data: {
        limit: page.limit,
        nextStartAtId: page.nextStartAtId,
        next: page.next,
        testCases: page.values.map(testCase => ({
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
        })),
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
  }
};

export const getTestCaseLinks = async (input: GetTestCaseLinksInput) => {
  const validatedInput = getTestCaseLinksSchema.parse(input);
  try {
    const links = await getZephyrClient().getTestCaseLinks(validatedInput.testCaseId);
    return {
      success: true,
      data: links,
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['edit'] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['archive'] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['archive'] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['delete'] });
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['create'] });
  }
};