import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { readJiraIssue } from './tools/jira-issues.js';
import { createTestPlan, listTestPlans } from './tools/test-plans.js';
import { createTestCycle, listTestCycles, addTestCasesToCycle } from './tools/test-cycles.js';
import {
  createTestExecution,
  executeTest,
  getTestExecutionStatus,
  listTestExecutionsInCycle,
  linkTestsToIssues,
  generateTestReport,
} from './tools/test-execution.js';
import { createTestCase, searchTestCases, getTestCase, updateTestCase, createMultipleTestCases } from './tools/test-cases.js';
import { listFolders, createFolder } from './tools/folders.js';
import { listPriorities, listStatuses } from './tools/priorities-statuses.js';
import {
  readJiraIssueSchema,
  createTestPlanSchema,
  listTestPlansSchema,
  createTestCycleSchema,
  listTestCyclesSchema,
  executeTestSchema,
  getTestExecutionStatusSchema,
  listTestExecutionsInCycleSchema,
  addTestCasesToCycleSchema,
  createTestExecutionSchema,
  listFoldersSchema,
  createFolderSchema,
  listPrioritiesSchema,
  listStatusesSchema,
  linkTestsToIssuesSchema,
  generateTestReportSchema,
  createTestCaseSchema,
  searchTestCasesSchema,
  getTestCaseSchema,
  updateTestCaseSchema,
  createMultipleTestCasesSchema,
  ReadJiraIssueInput,
  CreateTestPlanInput,
  ListTestPlansInput,
  CreateTestCycleInput,
  ListTestCyclesInput,
  ExecuteTestInput,
  GetTestExecutionStatusInput,
  ListTestExecutionsInCycleInput,
  AddTestCasesToCycleInput,
  CreateTestExecutionInput,
  ListFoldersInput,
  CreateFolderInput,
  ListPrioritiesInput,
  ListStatusesInput,
  LinkTestsToIssuesInput,
  GenerateTestReportInput,
  CreateTestCaseInput,
  SearchTestCasesInput,
  GetTestCaseInput,
  UpdateTestCaseInput,
  CreateMultipleTestCasesInput,
} from './utils/validation.js';

const server = new Server(
  {
    name: 'jira-zephyr-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
  }
);

const TOOLS = [
  {
    name: 'read_jira_issue',
    description: 'Read JIRA issue details and metadata',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: { type: 'string', description: 'JIRA issue key (e.g., ABC-123)' },
        fields: { type: 'array', items: { type: 'string' }, description: 'Specific fields to retrieve (optional)' },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'create_test_plan',
    description: 'Create a new test plan in Zephyr',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Test plan name' },
        description: { type: 'string', description: 'Test plan description (optional)' },
        projectKey: { type: 'string', description: 'JIRA project key' },
        startDate: { type: 'string', description: 'Planned start date (ISO format, optional)' },
        endDate: { type: 'string', description: 'Planned end date (ISO format, optional)' },
      },
      required: ['name', 'projectKey'],
    },
  },
  {
    name: 'list_test_plans',
    description: 'List existing test plans',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        offset: { type: 'number', description: 'Number of results to skip (default: 0)' },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'create_test_cycle',
    description: 'Create a new test execution cycle',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Test cycle name' },
        description: { type: 'string', description: 'Test cycle description (optional)' },
        projectKey: { type: 'string', description: 'JIRA project key' },
        versionId: { type: 'string', description: 'JIRA version ID' },
        environment: { type: 'string', description: 'Test environment (optional)' },
        startDate: { type: 'string', description: 'Planned start date (ISO format, optional)' },
        endDate: { type: 'string', description: 'Planned end date (ISO format, optional)' },
      },
      required: ['name', 'projectKey', 'versionId'],
    },
  },
  {
    name: 'list_test_cycles',
    description: 'List existing test cycles with execution status',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        versionId: { type: 'string', description: 'JIRA version ID (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'list_test_executions_in_cycle',
    description: 'List test cases and executions in a test cycle',
    inputSchema: {
      type: 'object',
      properties: {
        cycleId: { type: 'string', description: 'Test cycle ID or key' },
      },
      required: ['cycleId'],
    },
  },
  {
    name: 'add_test_cases_to_cycle',
    description: 'Add existing test cases to a test cycle',
    inputSchema: {
      type: 'object',
      properties: {
        cycleKey: { type: 'string', description: 'Test cycle key (e.g. PROJ-C1)' },
        testCaseKeys: { type: 'array', items: { type: 'string' }, description: 'Test case keys to add (e.g. [\'PROJ-T1\', \'PROJ-T2\'])' },
      },
      required: ['cycleKey', 'testCaseKeys'],
    },
  },
  {
    name: 'create_test_execution',
    description: 'Create a test execution (add a test case to a cycle). Use when add_test_cases_to_cycle returns 404 (e.g. EU API). Status "Not Executed" mimics adding via UI.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key (e.g. CP)' },
        testCaseKey: { type: 'string', description: 'Test case key (e.g. CP-T4305)' },
        testCycleKey: { type: 'string', description: 'Test cycle key (e.g. CP-R31)' },
        statusName: { type: 'string', description: 'Execution status (default: Not Executed)' },
        environmentName: { type: 'string', description: 'Environment name (optional)' },
      },
      required: ['projectKey', 'testCaseKey', 'testCycleKey'],
    },
  },
  {
    name: 'execute_test',
    description: 'Update test execution results',
    inputSchema: {
      type: 'object',
      properties: {
        executionId: { type: 'string', description: 'Test execution ID' },
        status: { type: 'string', enum: ['PASS', 'FAIL', 'WIP', 'BLOCKED'], description: 'Execution status' },
        comment: { type: 'string', description: 'Execution comment (optional)' },
        defects: { type: 'array', items: { type: 'string' }, description: 'Linked defect keys (optional)' },
      },
      required: ['executionId', 'status'],
    },
  },
  {
    name: 'get_test_execution_status',
    description: 'Get test execution progress and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        cycleId: { type: 'string', description: 'Test cycle ID' },
      },
      required: ['cycleId'],
    },
  },
  {
    name: 'link_tests_to_issues',
    description: 'Associate test cases with JIRA issues',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseId: { type: 'string', description: 'Test case ID' },
        issueKeys: { type: 'array', items: { type: 'string' }, description: 'JIRA issue keys to link' },
      },
      required: ['testCaseId', 'issueKeys'],
    },
  },
  {
    name: 'generate_test_report',
    description: 'Generate test execution report',
    inputSchema: {
      type: 'object',
      properties: {
        cycleId: { type: 'string', description: 'Test cycle ID' },
        format: { type: 'string', enum: ['JSON', 'HTML'], description: 'Report format (default: JSON)' },
      },
      required: ['cycleId'],
    },
  },
  {
    name: 'list_folders',
    description: 'List folders in a project (for organizing test cases or test cycles). Optionally filter by type and parent folder.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        folderType: { type: 'string', enum: ['TEST_CASE', 'TEST_CYCLE'], description: 'Filter by folder type (optional)' },
        parentId: { type: 'number', description: 'List only children of this folder ID (optional)' },
        limit: { type: 'number', description: 'Max results (default: 50)' },
        startAt: { type: 'number', description: 'Offset for pagination (default: 0)' },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'create_folder',
    description: 'Create a folder in a project (for organizing test cases or test cycles). Use parentId for subfolders.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        name: { type: 'string', description: 'Folder name' },
        parentId: { type: 'number', description: 'Parent folder ID for subfolders (optional)' },
        folderType: { type: 'string', enum: ['TEST_CASE', 'TEST_CYCLE'], description: 'Folder type (optional; default may be TEST_CASE)' },
      },
      required: ['projectKey', 'name'],
    },
  },
  {
    name: 'list_priorities',
    description: 'List test case priorities (id and name). Use ids when creating or updating test cases. Optional projectKey to scope by project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key (optional; if omitted returns all priorities)' },
      },
    },
  },
  {
    name: 'list_statuses',
    description: 'List test case statuses (id and name). Use ids when creating or updating test cases. Optional projectKey to scope by project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key (optional; if omitted returns all statuses)' },
      },
    },
  },
  {
    name: 'create_test_case',
    description: 'Create a new test case in Zephyr',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        name: { type: 'string', description: 'Test case name' },
        objective: { type: 'string', description: 'Test case objective/description (optional)' },
        precondition: { type: 'string', description: 'Test preconditions (optional)' },
        estimatedTime: { type: 'number', description: 'Estimated execution time in minutes (optional)' },
        priority: { type: 'string', description: 'Test case priority (optional)' },
        status: { type: 'string', description: 'Test case status (optional)' },
        folderId: { type: 'string', description: 'Folder ID to organize test case (optional)' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Test case labels (optional)' },
        componentId: { type: 'string', description: 'Component ID (optional)' },
        customFields: { type: 'object', description: 'Custom fields as key-value pairs (optional)' },
        testScript: {
          type: 'object',
          description: 'Test script with steps (optional)',
          properties: {
            type: { type: 'string', enum: ['STEP_BY_STEP', 'PLAIN_TEXT'], description: 'Script type' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number', description: 'Step number' },
                  description: { type: 'string', description: 'Step description' },
                  testData: { type: 'string', description: 'Test data (optional)' },
                  expectedResult: { type: 'string', description: 'Expected result' },
                },
                required: ['index', 'description', 'expectedResult'],
              },
              description: 'Test steps (for STEP_BY_STEP type)',
            },
            text: { type: 'string', description: 'Plain text script (for PLAIN_TEXT type)' },
          },
          required: ['type'],
        },
      },
      required: ['projectKey', 'name'],
    },
  },
  {
    name: 'search_test_cases',
    description: 'Search for test cases in a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        query: { type: 'string', description: 'Search query (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'get_test_case',
    description: 'Get detailed information about a specific test case',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseId: { type: 'string', description: 'Test case ID or key' },
      },
      required: ['testCaseId'],
    },
  },
  {
    name: 'update_test_case',
    description: 'Update an existing test case (e.g. name, objective, custom fields)',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseId: { type: 'string', description: 'Test case ID or key to update' },
        name: { type: 'string', description: 'Test case name (optional)' },
        objective: { type: 'string', description: 'Test case objective (optional)' },
        precondition: { type: 'string', description: 'Preconditions (optional)' },
        estimatedTime: { type: 'number', description: 'Estimated time in minutes (optional)' },
        priority: { type: 'string', description: 'Priority (optional)' },
        status: { type: 'string', description: 'Status (optional)' },
        folderId: { type: 'string', description: 'Folder ID (optional)' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Labels (optional)' },
        componentId: { type: 'string', description: 'Component ID (optional)' },
        customFields: { type: 'object', description: 'Custom fields as key-value pairs (optional)' },
        testScript: {
          type: 'object',
          description: 'Test script (optional)',
          properties: {
            type: { type: 'string', enum: ['STEP_BY_STEP', 'PLAIN_TEXT'] },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number' },
                  description: { type: 'string' },
                  testData: { type: 'string' },
                  expectedResult: { type: 'string' },
                },
                required: ['index', 'description', 'expectedResult'],
              },
            },
            text: { type: 'string' },
          },
          required: ['type'],
        },
      },
      required: ['testCaseId'],
    },
  },
  {
    name: 'create_multiple_test_cases',
    description: 'Create multiple test cases in Zephyr at once',
    inputSchema: {
      type: 'object',
      properties: {
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectKey: { type: 'string', description: 'JIRA project key' },
              name: { type: 'string', description: 'Test case name' },
              objective: { type: 'string', description: 'Test case objective/description (optional)' },
              precondition: { type: 'string', description: 'Test preconditions (optional)' },
              estimatedTime: { type: 'number', description: 'Estimated execution time in minutes (optional)' },
              priority: { type: 'string', description: 'Test case priority (optional)' },
              status: { type: 'string', description: 'Test case status (optional)' },
              folderId: { type: 'string', description: 'Folder ID to organize test case (optional)' },
              labels: { type: 'array', items: { type: 'string' }, description: 'Test case labels (optional)' },
              componentId: { type: 'string', description: 'Component ID (optional)' },
              customFields: { type: 'object', description: 'Custom fields as key-value pairs (optional)' },
              testScript: {
                type: 'object',
                description: 'Test script with steps (optional)',
                properties: {
                  type: { type: 'string', enum: ['STEP_BY_STEP', 'PLAIN_TEXT'], description: 'Script type' },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        index: { type: 'number', description: 'Step number' },
                        description: { type: 'string', description: 'Step description' },
                        testData: { type: 'string', description: 'Test data (optional)' },
                        expectedResult: { type: 'string', description: 'Expected result' },
                      },
                      required: ['index', 'description', 'expectedResult'],
                    },
                    description: 'Test steps (for STEP_BY_STEP type)',
                  },
                  text: { type: 'string', description: 'Plain text script (for PLAIN_TEXT type)' },
                },
                required: ['type'],
              },
            },
            required: ['projectKey', 'name'],
          },
          description: 'Array of test cases to create',
        },
        continueOnError: { type: 'boolean', description: 'Continue creating remaining test cases if one fails (default: true)', default: true },
      },
      required: ['testCases'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

const validateInput = <T>(schema: any, input: unknown, toolName: string): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errors = result.error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid parameters for ${toolName}:\n${errors.join('\n')}`
    );
  }
  return result.data as T;
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'read_jira_issue': {
        const validatedArgs = validateInput<ReadJiraIssueInput>(readJiraIssueSchema, args, 'read_jira_issue');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await readJiraIssue(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_test_plan': {
        const validatedArgs = validateInput<CreateTestPlanInput>(createTestPlanSchema, args, 'create_test_plan');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createTestPlan(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'list_test_plans': {
        const validatedArgs = validateInput<ListTestPlansInput>(listTestPlansSchema, args, 'list_test_plans');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTestPlans(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_test_cycle': {
        const validatedArgs = validateInput<CreateTestCycleInput>(createTestCycleSchema, args, 'create_test_cycle');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createTestCycle(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'list_test_cycles': {
        const validatedArgs = validateInput<ListTestCyclesInput>(listTestCyclesSchema, args, 'list_test_cycles');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTestCycles(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'execute_test': {
        const validatedArgs = validateInput<ExecuteTestInput>(executeTestSchema, args, 'execute_test');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await executeTest(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'get_test_execution_status': {
        const validatedArgs = validateInput<GetTestExecutionStatusInput>(getTestExecutionStatusSchema, args, 'get_test_execution_status');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTestExecutionStatus(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'list_test_executions_in_cycle': {
        const validatedArgs = validateInput<ListTestExecutionsInCycleInput>(listTestExecutionsInCycleSchema, args, 'list_test_executions_in_cycle');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTestExecutionsInCycle(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'add_test_cases_to_cycle': {
        const validatedArgs = validateInput<AddTestCasesToCycleInput>(addTestCasesToCycleSchema, args, 'add_test_cases_to_cycle');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await addTestCasesToCycle(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_test_execution': {
        const validatedArgs = validateInput<CreateTestExecutionInput>(createTestExecutionSchema, args, 'create_test_execution');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createTestExecution(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'link_tests_to_issues': {
        const validatedArgs = validateInput<LinkTestsToIssuesInput>(linkTestsToIssuesSchema, args, 'link_tests_to_issues');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await linkTestsToIssues(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'generate_test_report': {
        const validatedArgs = validateInput<GenerateTestReportInput>(generateTestReportSchema, args, 'generate_test_report');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await generateTestReport(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'list_folders': {
        const validatedArgs = validateInput<ListFoldersInput>(listFoldersSchema, args, 'list_folders');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listFolders(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_folder': {
        const validatedArgs = validateInput<CreateFolderInput>(createFolderSchema, args, 'create_folder');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createFolder(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'list_priorities': {
        const validatedArgs = validateInput<ListPrioritiesInput>(listPrioritiesSchema, args, 'list_priorities');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listPriorities(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'list_statuses': {
        const validatedArgs = validateInput<ListStatusesInput>(listStatusesSchema, args, 'list_statuses');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listStatuses(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_test_case': {
        const validatedArgs = validateInput<CreateTestCaseInput>(createTestCaseSchema, args, 'create_test_case');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createTestCase(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'search_test_cases': {
        const validatedArgs = validateInput<SearchTestCasesInput>(searchTestCasesSchema, args, 'search_test_cases');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await searchTestCases(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'get_test_case': {
        const validatedArgs = validateInput<GetTestCaseInput>(getTestCaseSchema, args, 'get_test_case');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTestCase(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'update_test_case': {
        const validatedArgs = validateInput<UpdateTestCaseInput>(updateTestCaseSchema, args, 'update_test_case');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await updateTestCase(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_multiple_test_cases': {
        const validatedArgs = validateInput<CreateMultipleTestCasesInput>(createMultipleTestCasesSchema, args, 'create_multiple_test_cases');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createMultipleTestCases(validatedArgs), null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Error executing tool '${name}': ${errorMessage}`);
  }
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.error('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.error('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to start MCP server:', errorMessage);
    if (errorMessage.includes('Configuration validation failed')) {
      console.error('Please check your environment variables and try again.');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error during server startup:', err);
  process.exit(1);
});