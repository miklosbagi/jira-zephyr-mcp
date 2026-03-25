import { ZephyrClient } from '../clients/zephyr-client.js';
import {
  createTestPlanSchema,
  listTestPlansSchema,
  updateTestPlanSchema,
  CreateTestPlanInput,
  ListTestPlansInput,
  GetTestPlanInput,
  UpdateTestPlanInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const createTestPlan = async (input: CreateTestPlanInput) => {
  const validatedInput = createTestPlanSchema.parse(input);
  
  try {
    const testPlan = await getZephyrClient().createTestPlan({
      name: validatedInput.name,
      description: validatedInput.description,
      projectKey: validatedInput.projectKey,
      startDate: validatedInput.startDate,
      endDate: validatedInput.endDate,
    });
    
    return {
      success: true,
      data: {
        id: testPlan.id,
        key: testPlan.key,
        name: testPlan.name,
        description: testPlan.description,
        projectId: testPlan.projectId,
        status: testPlan.status,
        createdOn: testPlan.createdOn,
        createdBy: testPlan.createdBy.displayName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const listTestPlans = async (input: ListTestPlansInput) => {
  const validatedInput = listTestPlansSchema.parse(input);
  
  try {
    const result = await getZephyrClient().getTestPlans(
      validatedInput.projectKey,
      validatedInput.limit,
      validatedInput.offset
    );
    
    return {
      success: true,
      data: {
        total: result.total,
        testPlans: result.testPlans.map(plan => ({
          id: plan.id,
          key: plan.key,
          name: plan.name,
          description: plan.description,
          status: plan.status,
          createdOn: plan.createdOn,
          updatedOn: plan.updatedOn,
          createdBy: plan.createdBy.displayName,
        })),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const getTestPlan = async (input: GetTestPlanInput) => {
  try {
    const testPlan = await getZephyrClient().getTestPlan(input.planKey);
    return {
      success: true,
      data: {
        id: testPlan.id,
        key: testPlan.key,
        name: testPlan.name,
        description: testPlan.description,
        projectId: testPlan.projectId,
        status: testPlan.status,
        createdOn: testPlan.createdOn,
        updatedOn: testPlan.updatedOn,
        createdBy: testPlan.createdBy?.displayName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const updateTestPlan = async (input: UpdateTestPlanInput) => {
  const validatedInput = updateTestPlanSchema.parse(input);
  try {
    const testPlan = await getZephyrClient().updateTestPlan(validatedInput.planKey, {
      name: validatedInput.name,
      description: validatedInput.description,
      startDate: validatedInput.startDate,
      endDate: validatedInput.endDate,
      status: validatedInput.status,
      folderId: validatedInput.folderId,
      ownerAccountId: validatedInput.ownerAccountId,
      customFields: validatedInput.customFields,
      labels: validatedInput.labels,
    });
    return {
      success: true,
      data: {
        id: testPlan.id,
        key: testPlan.key,
        name: testPlan.name,
        description: testPlan.description,
        projectId: testPlan.projectId,
        status: testPlan.status,
        createdOn: testPlan.createdOn,
        updatedOn: testPlan.updatedOn,
        createdBy: testPlan.createdBy?.displayName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};