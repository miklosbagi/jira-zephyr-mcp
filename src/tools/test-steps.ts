import { ZephyrClient } from '../clients/zephyr-client.js';
import { zephyrToolFailure } from '../utils/zephyr-error-info.js';
import {
  listTestStepsSchema,
  createTestStepSchema,
  updateTestStepSchema,
  deleteTestStepSchema,
  type ListTestStepsInput,
  type CreateTestStepInput,
  type UpdateTestStepInput,
  type DeleteTestStepInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const listTestSteps = async (input: ListTestStepsInput) => {
  const validated = listTestStepsSchema.parse(input);
  try {
    const steps = await getZephyrClient().getTestSteps(validated.testCaseKey);
    return {
      success: true,
      data: {
        testCaseKey: validated.testCaseKey,
        steps: steps.map(s => ({
          id: s.id,
          index: s.index ?? s.orderId,
          description: s.description ?? s.step,
          testData: s.testData ?? s.data,
          expectedResult: s.expectedResult ?? s.result,
        })),
        total: steps.length,
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
  }
};

export const createTestStep = async (input: CreateTestStepInput) => {
  const validated = createTestStepSchema.parse(input);
  try {
    const step = await getZephyrClient().createTestStep(validated.testCaseKey, {
      description: validated.description,
      expectedResult: validated.expectedResult,
      testData: validated.testData,
      index: validated.index,
    });
    return {
      success: true,
      data: {
        testCaseKey: validated.testCaseKey,
        step: {
          id: step.id,
          index: step.index ?? step.orderId,
          description: step.description ?? step.step,
          testData: step.testData ?? step.data,
          expectedResult: step.expectedResult ?? step.result,
        },
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['create'] });
  }
};

export const updateTestStep = async (input: UpdateTestStepInput) => {
  const validated = updateTestStepSchema.parse(input);
  const { testCaseKey, stepId, ...updates } = validated;
  try {
    const step = await getZephyrClient().updateTestStep(testCaseKey, stepId, updates);
    return {
      success: true,
      data: {
        testCaseKey,
        stepId,
        step: {
          id: step.id,
          index: step.index ?? step.orderId,
          description: step.description ?? step.step,
          testData: step.testData ?? step.data,
          expectedResult: step.expectedResult ?? step.result,
        },
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['edit'] });
  }
};

export const deleteTestStep = async (input: DeleteTestStepInput) => {
  const validated = deleteTestStepSchema.parse(input);
  try {
    await getZephyrClient().deleteTestStep(validated.testCaseKey, validated.stepId);
    return {
      success: true,
      data: { testCaseKey: validated.testCaseKey, stepId: validated.stepId, deleted: true },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['delete'] });
  }
};
