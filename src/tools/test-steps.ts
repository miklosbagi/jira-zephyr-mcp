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
          index: s.index,
          description: s.description,
          testData: s.testData,
          expectedResult: s.expectedResult,
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
          index: step.index,
          description: step.description,
          testData: step.testData,
          expectedResult: step.expectedResult,
        },
      },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['create'] });
  }
};

export const updateTestStep = async (input: UpdateTestStepInput) => {
  const validated = updateTestStepSchema.parse(input);
  const { testCaseKey, index, ...updates } = validated;
  try {
    const step = await getZephyrClient().updateTestStep(testCaseKey, index, updates);
    return {
      success: true,
      data: {
        testCaseKey,
        step: {
          index: step.index,
          description: step.description,
          testData: step.testData,
          expectedResult: step.expectedResult,
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
    await getZephyrClient().deleteTestStep(validated.testCaseKey, validated.index);
    return {
      success: true,
      data: { testCaseKey: validated.testCaseKey, index: validated.index, deleted: true },
    };
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: ['delete'] });
  }
};
