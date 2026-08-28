import { ZephyrClient } from '../clients/zephyr-client.js';
import { zephyrToolFailure } from '../utils/zephyr-error-info.js';
import type { ZephyrExecutionSummary } from '../types/zephyr-types.js';
import {
  createTestCycleSchema,
  listTestCyclesSchema,
  addTestCasesToCycleSchema,
  updateTestCycleSchema,
  type CreateTestCycleInput,
  type ListTestCyclesInput,
  type GetTestCycleInput,
  type AddTestCasesToCycleInput,
  type UpdateTestCycleInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

/** Present a computed execution-status aggregate with an integer passRate for the tool response. */
const formatExecutionSummary = (s: ZephyrExecutionSummary) => ({
  total: s.total,
  passed: s.passed,
  failed: s.failed,
  blocked: s.blocked,
  inProgress: s.inProgress,
  notExecuted: s.notExecuted,
  passRate: s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0,
});

/**
 * Aggregate a cycle's real execution summary from its executions (Scale Cloud exposes no
 * per-cycle counts). Returns null on failure so a summary error never breaks a cycle read.
 */
const fetchExecutionSummary = async (cycleKey: string) => {
  try {
    return formatExecutionSummary(await getZephyrClient().getTestExecutionSummary(cycleKey));
  } catch {
    return null;
  }
};

/** Run async mappers with a small concurrency cap so listing many cycles doesn't hammer the API. */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
};

export const createTestCycle = async (input: CreateTestCycleInput) => {
  const validatedInput = createTestCycleSchema.parse(input);
  
  try {
    const testCycle = await getZephyrClient().createTestCycle({
      name: validatedInput.name,
      description: validatedInput.description,
      projectKey: validatedInput.projectKey,
      versionId: validatedInput.versionId,
      folderId: validatedInput.folderId,
      environment: validatedInput.environment,
      startDate: validatedInput.startDate,
      endDate: validatedInput.endDate,
    });
    
    return {
      success: true,
      data: {
        id: testCycle.id,
        key: testCycle.key,
        name: testCycle.name,
        description: testCycle.description,
        projectId: testCycle.projectId,
        versionId: testCycle.versionId,
        environment: testCycle.environment,
        status: testCycle.status,
        plannedStartDate: testCycle.plannedStartDate,
        plannedEndDate: testCycle.plannedEndDate,
        createdOn: testCycle.createdOn,
        executionSummary: testCycle.executionSummary,
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['create', 'create_versions'] });
  }
};

export const updateTestCycle = async (input: UpdateTestCycleInput) => {
  const validatedInput = updateTestCycleSchema.parse(input);
  try {
    const testCycle = await getZephyrClient().updateTestCycle(validatedInput.cycleKey, {
      name: validatedInput.name,
      description: validatedInput.description,
      folderId: validatedInput.folderId,
      environment: validatedInput.environment,
      startDate: validatedInput.startDate,
      endDate: validatedInput.endDate,
      status: validatedInput.status,
      versionId: validatedInput.versionId,
      ownerAccountId: validatedInput.ownerAccountId,
      customFields: validatedInput.customFields,
    });
    return {
      success: true,
      data: {
        id: testCycle.id,
        key: testCycle.key,
        name: testCycle.name,
        description: testCycle.description,
        status: testCycle.status,
        plannedStartDate: testCycle.plannedStartDate,
        plannedEndDate: testCycle.plannedEndDate,
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['edit', 'create_versions'] });
  }
};

export const listTestCycles = async (input: ListTestCyclesInput) => {
  const validatedInput = listTestCyclesSchema.parse(input);
  
  try {
    const result = await getZephyrClient().getTestCycles(
      validatedInput.projectKey,
      validatedInput.versionId,
      validatedInput.limit
    );

    // Real per-cycle summaries require aggregating each cycle's executions (no cheap source),
    // so only compute them when explicitly requested; otherwise omit the field rather than
    // returning misleading zeros (issue #156).
    const summaries = validatedInput.includeExecutionSummary
      ? await mapWithConcurrency(result.testCycles, 5, cycle =>
          fetchExecutionSummary(String(cycle.key ?? cycle.id))
        )
      : null;

    return {
      success: true,
      data: {
        total: result.total,
        includeExecutionSummary: validatedInput.includeExecutionSummary,
        testCycles: result.testCycles.map((cycle, i) => ({
          id: cycle.id,
          key: cycle.key,
          name: cycle.name,
          description: cycle.description,
          projectId: cycle.projectId,
          versionId: cycle.versionId,
          environment: cycle.environment,
          status: cycle.status,
          plannedStartDate: cycle.plannedStartDate,
          plannedEndDate: cycle.plannedEndDate,
          actualStartDate: cycle.actualStartDate,
          actualEndDate: cycle.actualEndDate,
          createdOn: cycle.createdOn,
          updatedOn: cycle.updatedOn,
          ...(summaries ? { executionSummary: summaries[i] } : {}),
        })),
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
  }
};

export const addTestCasesToCycle = async (input: AddTestCasesToCycleInput) => {
  const validatedInput = addTestCasesToCycleSchema.parse(input);
  try {
    await getZephyrClient().addTestCasesToCycle(validatedInput.cycleKey, validatedInput.testCaseKeys);
    return {
      success: true,
      data: {
        cycleKey: validatedInput.cycleKey,
        addedCount: validatedInput.testCaseKeys.length,
        testCaseKeys: validatedInput.testCaseKeys,
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['create', 'edit'] });
  }
};

export const getTestCycle = async (input: GetTestCycleInput) => {
  try {
    const testCycle = await getZephyrClient().getTestCycle(input.cycleKey);
    // Scale Cloud cycles carry no execution counts; aggregate the real summary from executions
    // instead of echoing the always-absent cycle.executionSummary (which read as all zeros). (#156)
    const executionSummary = await fetchExecutionSummary(input.cycleKey);
    return {
      success: true,
      data: {
        id: testCycle.id,
        key: testCycle.key,
        name: testCycle.name,
        description: testCycle.description,
        projectId: testCycle.projectId,
        versionId: testCycle.versionId,
        environment: testCycle.environment,
        status: testCycle.status,
        plannedStartDate: testCycle.plannedStartDate,
        plannedEndDate: testCycle.plannedEndDate,
        actualStartDate: testCycle.actualStartDate,
        actualEndDate: testCycle.actualEndDate,
        createdOn: testCycle.createdOn,
        updatedOn: testCycle.updatedOn,
        executionSummary,
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
  }
};