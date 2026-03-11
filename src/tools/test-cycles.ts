import { ZephyrClient } from '../clients/zephyr-client.js';
import {
  createTestCycleSchema,
  listTestCyclesSchema,
  addTestCasesToCycleSchema,
  CreateTestCycleInput,
  ListTestCyclesInput,
  AddTestCasesToCycleInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const createTestCycle = async (input: CreateTestCycleInput) => {
  const validatedInput = createTestCycleSchema.parse(input);
  
  try {
    const testCycle = await getZephyrClient().createTestCycle({
      name: validatedInput.name,
      description: validatedInput.description,
      projectKey: validatedInput.projectKey,
      versionId: validatedInput.versionId,
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
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
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
    
    return {
      success: true,
      data: {
        total: result.total,
        testCycles: result.testCycles.map(cycle => {
          const summary = cycle.executionSummary ?? {};
          return {
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
            executionSummary: {
              total: summary.total ?? 0,
              passed: summary.passed ?? 0,
              failed: summary.failed ?? 0,
              blocked: summary.blocked ?? 0,
              inProgress: summary.inProgress ?? 0,
              notExecuted: summary.notExecuted ?? 0,
              passRate: (summary.total ?? 0) > 0
                ? Math.round(((summary.passed ?? 0) / (summary.total ?? 1)) * 100)
                : 0,
            },
          };
        }),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
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
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const getTestCycle = async (input: { cycleId: string }) => {
  try {
    const result = await getZephyrClient().getTestCycles('', undefined, 1000);
    const testCycle = result.testCycles.find(cycle => cycle.id === input.cycleId);
    
    if (!testCycle) {
      return {
        success: false,
        error: 'Test cycle not found',
      };
    }
    
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
        executionSummary: testCycle.executionSummary,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};