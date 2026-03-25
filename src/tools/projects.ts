import { ZephyrClient } from '../clients/zephyr-client.js';
import type { ZephyrProject } from '../types/zephyr-types.js';
import { listProjectsSchema, type ListProjectsInput } from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const listProjects = async (input: ListProjectsInput) => {
  const validatedInput = listProjectsSchema.parse(input);
  try {
    const result = await getZephyrClient().getProjects(
      validatedInput.limit,
      validatedInput.startAt
    );
    return {
      success: true,
      data: {
        total: result.total,
        projects: result.projects.map((p: ZephyrProject) => ({
          id: p.id,
          key: p.key,
          name: p.name,
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
