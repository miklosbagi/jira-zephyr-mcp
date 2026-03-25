import { ZephyrClient } from '../clients/zephyr-client.js';
import {
  listEnvironmentsSchema,
  getEnvironmentSchema,
  createEnvironmentSchema,
  updateEnvironmentSchema,
  type ListEnvironmentsInput,
  type GetEnvironmentInput,
  type CreateEnvironmentInput,
  type UpdateEnvironmentInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const listEnvironments = async (input: ListEnvironmentsInput) => {
  const validatedInput = listEnvironmentsSchema.parse(input);
  try {
    const result = await getZephyrClient().getEnvironments(
      validatedInput.projectKey,
      validatedInput.limit,
      validatedInput.startAt
    );
    return {
      success: true,
      data: {
        total: result.total,
        environments: result.environments.map((e: any) => ({
          id: e.id,
          name: e.name,
          description: e.description ?? null,
          projectKey: e.projectKey,
          self: e.self,
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

export const getEnvironment = async (input: GetEnvironmentInput) => {
  const validatedInput = getEnvironmentSchema.parse(input);
  try {
    const e = await getZephyrClient().getEnvironment(validatedInput.environmentId);
    return {
      success: true,
      data: {
        id: e.id,
        name: e.name,
        description: e.description ?? null,
        projectKey: (e as any).projectKey,
        self: e.self,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const createEnvironment = async (input: CreateEnvironmentInput) => {
  const validatedInput = createEnvironmentSchema.parse(input);
  try {
    const e = await getZephyrClient().createEnvironment({
      projectKey: validatedInput.projectKey,
      name: validatedInput.name,
      description: validatedInput.description,
    });
    return {
      success: true,
      data: {
        id: e.id,
        name: e.name,
        description: e.description ?? null,
        projectKey: (e as any).projectKey,
        self: e.self,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const updateEnvironment = async (input: UpdateEnvironmentInput) => {
  const validatedInput = updateEnvironmentSchema.parse(input);
  try {
    const e = await getZephyrClient().updateEnvironment(validatedInput.environmentId, {
      name: validatedInput.name,
      description: validatedInput.description,
    });
    return {
      success: true,
      data: {
        id: e.id,
        name: e.name,
        description: e.description ?? null,
        projectKey: (e as any).projectKey,
        self: e.self,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};
