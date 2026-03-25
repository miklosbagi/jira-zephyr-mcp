import { ZephyrClient } from '../clients/zephyr-client.js';
import {
  listPrioritiesSchema,
  listStatusesSchema,
  type ListPrioritiesInput,
  type ListStatusesInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const listPriorities = async (input: ListPrioritiesInput) => {
  const validatedInput = listPrioritiesSchema.parse(input);
  try {
    const priorities = await getZephyrClient().getPriorities(validatedInput.projectKey);
    return {
      success: true,
      data: {
        priorities: priorities.map((p: any) => ({
          id: p.id,
          name: p.name ?? p.label,
          self: p.self,
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

export const listStatuses = async (input: ListStatusesInput) => {
  const validatedInput = listStatusesSchema.parse(input);
  try {
    const statuses = await getZephyrClient().getStatuses(validatedInput.projectKey);
    return {
      success: true,
      data: {
        statuses: statuses.map((s: any) => ({
          id: s.id,
          name: s.name ?? s.label,
          self: s.self,
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
