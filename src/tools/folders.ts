import { ZephyrClient } from '../clients/zephyr-client.js';
import {
  listFoldersSchema,
  createFolderSchema,
  type ListFoldersInput,
  type CreateFolderInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const listFolders = async (input: ListFoldersInput) => {
  const validatedInput = listFoldersSchema.parse(input);
  try {
    const result = await getZephyrClient().getFolders(validatedInput.projectKey, {
      folderType: validatedInput.folderType,
      parentId: validatedInput.parentId,
      limit: validatedInput.limit,
      startAt: validatedInput.startAt,
    });
    return {
      success: true,
      data: {
        total: result.total,
        folders: result.folders.map((f: any) => ({
          id: f.id,
          name: f.name,
          projectKey: f.projectKey ?? f.projectId,
          parentId: f.parentId ?? null,
          type: f.type ?? f.folderType,
          self: f.self,
          folders: f.folders,
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

export const createFolder = async (input: CreateFolderInput) => {
  const validatedInput = createFolderSchema.parse(input);
  try {
    const folder = await getZephyrClient().createFolder({
      projectKey: validatedInput.projectKey,
      name: validatedInput.name,
      parentId: validatedInput.parentId,
      folderType: validatedInput.folderType,
    });
    return {
      success: true,
      data: {
        id: folder.id,
        name: folder.name,
        projectKey: folder.projectKey ?? folder.projectId,
        parentId: folder.parentId ?? null,
        type: folder.type,
        self: folder.self,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};
