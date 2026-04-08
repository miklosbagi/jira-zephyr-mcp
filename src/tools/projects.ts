import { ZephyrClient } from '../clients/zephyr-client.js';
import type { ZephyrProject } from '../types/zephyr-types.js';
import { zephyrToolFailure } from '../utils/zephyr-error-info.js';
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
  } catch (error: unknown) {
    return zephyrToolFailure(error, { permissionCategories: [] });
  }
};
