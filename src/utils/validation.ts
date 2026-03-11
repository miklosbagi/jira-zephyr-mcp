import { z } from 'zod';

export const createTestPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  projectKey: z.string().min(1, 'Project key is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createTestCycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  projectKey: z.string().min(1, 'Project key is required'),
  versionId: z.string().min(1, 'Version ID is required'),
  folderId: z.union([z.string(), z.number()]).optional(),
  environment: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const readJiraIssueSchema = z.object({
  issueKey: z.string().min(1, 'Issue key is required'),
  fields: z.array(z.string()).optional(),
});

export const listTestPlansSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const listTestCyclesSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  versionId: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

export const updateTestCycleSchema = z.object({
  cycleKey: z.string().min(1, 'Test cycle key is required'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  folderId: z.union([z.string(), z.number(), z.null()]).optional(),
  environment: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const executeTestSchema = z.object({
  executionId: z.string().min(1, 'Execution ID is required'),
  status: z.enum(['PASS', 'FAIL', 'WIP', 'BLOCKED']),
  comment: z.string().optional(),
  defects: z.array(z.string()).optional(),
});

export const getTestExecutionStatusSchema = z.object({
  cycleId: z.string().min(1, 'Cycle ID is required'),
});

export const listTestExecutionsInCycleSchema = z.object({
  cycleId: z.string().min(1, 'Cycle ID or key is required'),
});

export const addTestCasesToCycleSchema = z.object({
  cycleKey: z.string().min(1, 'Test cycle key is required'),
  testCaseKeys: z.array(z.string().min(1)).min(1, 'At least one test case key is required'),
});

export const listFoldersSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  folderType: z.enum(['TEST_CASE', 'TEST_CYCLE']).optional(),
  parentId: z.number().int().min(0).optional().nullable(),
  limit: z.number().min(1).max(100).default(50),
  startAt: z.number().min(0).default(0),
});

export const createFolderSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.number().int().min(0).optional().nullable(),
  folderType: z.enum(['TEST_CASE', 'TEST_CYCLE']).optional(),
});

export type ListFoldersInput = z.infer<typeof listFoldersSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const createTestExecutionSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  testCaseKey: z.string().min(1, 'Test case key is required'),
  testCycleKey: z.string().min(1, 'Test cycle key is required'),
  statusName: z.string().optional(),
  environmentName: z.string().optional(),
});

export type CreateTestExecutionInput = z.infer<typeof createTestExecutionSchema>;

export const linkTestsToIssuesSchema = z.object({
  testCaseId: z.string().min(1, 'Test case ID is required'),
  issueKeys: z.array(z.string().min(1)).min(1, 'At least one issue key is required'),
});

export const generateTestReportSchema = z.object({
  cycleId: z.string().min(1, 'Cycle ID is required'),
  format: z.enum(['JSON', 'HTML']).default('JSON'),
});

export const createTestCaseSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  name: z.string().min(1, 'Name is required'),
  objective: z.string().optional(),
  precondition: z.string().optional(),
  estimatedTime: z.number().min(0).optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  folderId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  componentId: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  testScript: z.object({
    type: z.enum(['STEP_BY_STEP', 'PLAIN_TEXT']),
    steps: z.array(z.object({
      index: z.number().min(1),
      description: z.string().min(1),
      testData: z.string().optional(),
      expectedResult: z.string().min(1),
    })).optional(),
    text: z.string().optional(),
  }).optional(),
});

export const searchTestCasesSchema = z.object({
  projectKey: z.string().min(1, 'Project key is required'),
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

export const getTestCaseSchema = z.object({
  testCaseId: z.string().min(1, 'Test case ID is required'),
});

export const updateTestCaseSchema = z.object({
  testCaseId: z.string().min(1, 'Test case ID or key is required'),
  name: z.string().min(1).optional(),
  objective: z.string().optional(),
  precondition: z.string().optional(),
  estimatedTime: z.number().min(0).optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  folderId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  componentId: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  testScript: z.object({
    type: z.enum(['STEP_BY_STEP', 'PLAIN_TEXT']),
    steps: z.array(z.object({
      index: z.number().min(1),
      description: z.string().min(1),
      testData: z.string().optional(),
      expectedResult: z.string().min(1),
    })).optional(),
    text: z.string().optional(),
  }).optional(),
}).refine(
  data => {
    const { testCaseId, ...updates } = data;
    return Object.keys(updates).length >= 1;
  },
  { message: 'At least one field to update (name, objective, customFields, etc.) is required' }
);

export const createMultipleTestCasesSchema = z.object({
  testCases: z.array(createTestCaseSchema).min(1, 'At least one test case is required'),
  continueOnError: z.boolean().default(true),
});

export type CreateTestPlanInput = z.infer<typeof createTestPlanSchema>;
export type CreateTestCycleInput = z.infer<typeof createTestCycleSchema>;
export type ReadJiraIssueInput = z.infer<typeof readJiraIssueSchema>;
export type ListTestPlansInput = z.infer<typeof listTestPlansSchema>;
export type ListTestCyclesInput = z.infer<typeof listTestCyclesSchema>;
export type UpdateTestCycleInput = z.infer<typeof updateTestCycleSchema>;
export type ExecuteTestInput = z.infer<typeof executeTestSchema>;
export type GetTestExecutionStatusInput = z.infer<typeof getTestExecutionStatusSchema>;
export type ListTestExecutionsInCycleInput = z.infer<typeof listTestExecutionsInCycleSchema>;
export type AddTestCasesToCycleInput = z.infer<typeof addTestCasesToCycleSchema>;
export type LinkTestsToIssuesInput = z.infer<typeof linkTestsToIssuesSchema>;
export type GenerateTestReportInput = z.infer<typeof generateTestReportSchema>;
export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type SearchTestCasesInput = z.infer<typeof searchTestCasesSchema>;
export type GetTestCaseInput = z.infer<typeof getTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
export type CreateMultipleTestCasesInput = z.infer<typeof createMultipleTestCasesSchema>;