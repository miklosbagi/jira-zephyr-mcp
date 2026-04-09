import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { readJiraIssue } from './tools/jira-issues.js';
import { createTestPlan, listTestPlans, getTestPlan, updateTestPlan } from './tools/test-plans.js';
import { createTestCycle, listTestCycles, getTestCycle, addTestCasesToCycle, updateTestCycle } from './tools/test-cycles.js';
import {
  createTestExecution,
  removeTestCaseFromCycle,
  executeTest,
  bulkExecuteTests,
  getTestExecutionStatus,
  listTestExecutionsInCycle,
  listTestExecutionsNextgen,
  getTestExecution,
  linkTestsToIssues,
  linkTestCycleToIssues,
  linkTestPlanToIssues,
  generateTestReport,
} from './tools/test-execution.js';
import {
  createTestCase,
  searchTestCases,
  listTestCasesNextgen,
  getTestCase,
  getTestCaseLinks,
  updateTestCase,
  archiveTestCase,
  unarchiveTestCase,
  deleteTestCase,
  createMultipleTestCases,
} from './tools/test-cases.js';
import { listTestSteps, createTestStep, updateTestStep, deleteTestStep } from './tools/test-steps.js';
import { listFolders, createFolder } from './tools/folders.js';
import { listEnvironments, getEnvironment, createEnvironment, updateEnvironment } from './tools/environments.js';
import { listPriorities, listStatuses } from './tools/priorities-statuses.js';
import { listProjects } from './tools/projects.js';
import {
  readJiraIssueSchema,
  listProjectsSchema,
  createTestPlanSchema,
  listTestPlansSchema,
  getTestPlanSchema,
  updateTestPlanSchema,
  createTestCycleSchema,
  listTestCyclesSchema,
  getTestCycleSchema,
  updateTestCycleSchema,
  executeTestSchema,
  getTestExecutionStatusSchema,
  getTestExecutionSchema,
  listTestExecutionsInCycleSchema,
  listTestExecutionsNextgenSchema,
  bulkExecuteTestsSchema,
  addTestCasesToCycleSchema,
  createTestExecutionSchema,
  removeTestCaseFromCycleSchema,
  listFoldersSchema,
  createFolderSchema,
  listPrioritiesSchema,
  listStatusesSchema,
  listEnvironmentsSchema,
  getEnvironmentSchema,
  createEnvironmentSchema,
  updateEnvironmentSchema,
  linkTestsToIssuesSchema,
  linkTestCycleToIssuesSchema,
  linkTestPlanToIssuesSchema,
  generateTestReportSchema,
  createTestCaseSchema,
  searchTestCasesSchema,
  listTestCasesNextgenSchema,
  getTestCaseSchema,
  getTestCaseLinksSchema,
  updateTestCaseSchema,
  archiveTestCaseSchema,
  unarchiveTestCaseSchema,
  deleteTestCaseSchema,
  createMultipleTestCasesSchema,
  listTestStepsSchema,
  createTestStepSchema,
  updateTestStepSchema,
  deleteTestStepSchema,
  type ReadJiraIssueInput,
  type ListProjectsInput,
  type CreateTestPlanInput,
  type ListTestPlansInput,
  type GetTestPlanInput,
  type UpdateTestPlanInput,
  type CreateTestCycleInput,
  type ListTestCyclesInput,
  type GetTestCycleInput,
  type UpdateTestCycleInput,
  type ExecuteTestInput,
  type GetTestExecutionStatusInput,
  type GetTestExecutionInput,
  type ListTestExecutionsInCycleInput,
  type ListTestExecutionsNextgenInput,
  type BulkExecuteTestsInput,
  type AddTestCasesToCycleInput,
  type CreateTestExecutionInput,
  type RemoveTestCaseFromCycleInput,
  type ListFoldersInput,
  type CreateFolderInput,
  type ListPrioritiesInput,
  type ListStatusesInput,
  type ListEnvironmentsInput,
  type GetEnvironmentInput,
  type CreateEnvironmentInput,
  type UpdateEnvironmentInput,
  type LinkTestsToIssuesInput,
  type LinkTestCycleToIssuesInput,
  type LinkTestPlanToIssuesInput,
  type GenerateTestReportInput,
  type CreateTestCaseInput,
  type SearchTestCasesInput,
  type ListTestCasesNextgenInput,
  type GetTestCaseInput,
  type GetTestCaseLinksInput,
  type UpdateTestCaseInput,
  type ArchiveTestCaseInput,
  type UnarchiveTestCaseInput,
  type DeleteTestCaseInput,
  type CreateMultipleTestCasesInput,
  type ListTestStepsInput,
  type CreateTestStepInput,
  type UpdateTestStepInput,
  type DeleteTestStepInput,
} from './utils/validation.js';

const server = new Server(
  {
    name: 'jira-zephyr-mcp',
    version: '0.15.2',
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
    name: 'list_projects',
    description: 'List Zephyr-visible projects (for projectKey discovery and validation)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' },
        startAt: { type: 'number', description: 'Index to start at for pagination (default: 0)' },
      },
      required: [],
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
    name: 'get_test_plan',
    description: 'Get a single test plan by key or ID',
    inputSchema: {
      type: 'object',
      properties: {
        planKey: { type: 'string', description: 'Test plan key or ID (e.g. CP-P1 or numeric id)' },
      },
      required: ['planKey'],
    },
  },
  {
    name: 'update_test_plan',
    description:
      'Update a test plan (GET-merge-PUT). Not listed in the public OpenAPI; may return 404/405 on some tenants. Supports name, description/objective, planned dates, status id, folderId, owner, customFields, labels.',
    inputSchema: {
      type: 'object',
      properties: {
        planKey: { type: 'string', description: 'Test plan key or ID' },
        name: { type: 'string', description: 'New name (optional)' },
        description: { type: 'string', description: 'New description / objective (optional)' },
        startDate: { type: 'string', description: 'Planned start date ISO (optional)' },
        endDate: { type: 'string', description: 'Planned end date ISO (optional)' },
        status: { type: 'string', description: 'Zephyr status id (numeric string, optional)' },
        folderId: { type: 'string', description: 'Folder id (optional); null to clear if supported' },
        ownerAccountId: { type: 'string', description: 'Jira account id for owner (optional)' },
        customFields: { type: 'object', description: 'Merged with existing custom fields (optional)' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Test plan labels (optional)' },
      },
      required: ['planKey'],
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
        folderId: { type: 'string', description: 'Folder ID (TEST_CYCLE) to place the cycle in (optional)' },
        environment: { type: 'string', description: 'Test environment (optional)' },
        startDate: { type: 'string', description: 'Planned start date (ISO format, optional)' },
        endDate: { type: 'string', description: 'Planned end date (ISO format, optional)' },
      },
      required: ['name', 'projectKey', 'versionId'],
    },
  },
  {
    name: 'update_test_cycle',
    description:
      'Update a test cycle (PUT /testcycles/{key}; GET-merge-PUT). Name, description, folderId, environment, dates, status id, Jira version id, owner, customFields.',
    inputSchema: {
      type: 'object',
      properties: {
        cycleKey: { type: 'string', description: 'Test cycle key (e.g. CP-R32)' },
        name: { type: 'string', description: 'New name (optional)' },
        description: { type: 'string', description: 'New description (optional)' },
        folderId: { type: 'string', description: 'Move to this folder ID (optional)' },
        environment: { type: 'string', description: 'Environment (optional)' },
        startDate: { type: 'string', description: 'Planned start date ISO (optional)' },
        endDate: { type: 'string', description: 'Planned end date ISO (optional)' },
        status: { type: 'string', description: 'Zephyr cycle status id (numeric string, optional)' },
        versionId: { type: 'string', description: 'Jira release version id (optional; maps to jiraProjectVersion)' },
        ownerAccountId: { type: 'string', description: 'Jira account id for owner (optional)' },
        customFields: { type: 'object', description: 'Merged with existing custom fields (optional)' },
      },
      required: ['cycleKey'],
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
    name: 'get_test_cycle',
    description: 'Get a single test cycle by key or ID',
    inputSchema: {
      type: 'object',
      properties: {
        cycleKey: { type: 'string', description: 'Test cycle key or ID (e.g. CP-R34 or numeric id)' },
      },
      required: ['cycleKey'],
    },
  },
  {
    name: 'list_test_executions_in_cycle',
    description:
      'List test executions in a test cycle. Each row includes testCaseKey and testCaseId when the API provides them; if the list omits keys but includes test case ids, the server resolves keys via GET /testcases/{id} so you can match removals and audits.',
    inputSchema: {
      type: 'object',
      properties: {
        cycleId: { type: 'string', description: 'Test cycle ID or key' },
      },
      required: ['cycleId'],
    },
  },
  {
    name: 'list_test_executions_nextgen',
    description:
      'List test executions with cursor pagination (GET /testexecutions/nextgen). For large volumes; use nextStartAtId or next URL for the next page.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key filter (optional)' },
        testCycle: { type: 'string', description: 'Test cycle key filter (optional)' },
        testCase: { type: 'string', description: 'Test case key or id filter (optional)' },
        actualEndDateAfter: { type: 'string', description: 'ISO date-time filter (optional)' },
        actualEndDateBefore: { type: 'string', description: 'ISO date-time filter (optional)' },
        includeStepLinks: { type: 'boolean', description: 'Include step issue links (optional)' },
        jiraProjectVersionId: { type: 'number', description: 'Jira release version id (optional)' },
        onlyLastExecutions: { type: 'boolean', description: 'Only last execution per cycle item (optional)' },
        limit: { type: 'number', description: 'Page size 1–1000 (default 50)' },
        startAtId: { type: 'number', description: 'Cursor / startAtId for pagination (default 0)' },
      },
      required: [],
    },
  },
  {
    name: 'get_test_execution',
    description:
      'Get a single test execution by id or key (GET /testexecutions/{testExecutionIdOrKey}, OpenAPI getTestExecution). Returns the same row shape as list_test_executions_in_cycle; resolves testCaseKey via GET /testcases/{id} when the API omits the key.',
    inputSchema: {
      type: 'object',
      properties: {
        executionId: {
          type: 'string',
          description: 'Test execution id or key (e.g. numeric id or execution key from list_test_executions_in_cycle)',
        },
      },
      required: ['executionId'],
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
    name: 'remove_test_case_from_cycle',
    description:
      'Remove a test case from a test cycle by deleting its test execution (DELETE /testexecutions/{id}). Pass executionId from list_test_executions_in_cycle, or cycleKey + testCaseKey (test case key or numeric test case id string) to resolve the execution. Matching is case-insensitive on keys. May return 404/405 if your Zephyr instance does not expose this on the public API.',
    inputSchema: {
      type: 'object',
      properties: {
        executionId: {
          type: 'string',
          description: 'Test execution id or key (use alone; do not combine with cycleKey/testCaseKey)',
        },
        cycleKey: {
          type: 'string',
          description: 'Test cycle key or id (required with testCaseKey if executionId is omitted)',
        },
        testCaseKey: {
          type: 'string',
          description: 'Test case key to remove from the cycle (required with cycleKey if executionId is omitted)',
        },
      },
      required: [],
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
    name: 'bulk_execute_tests',
    description:
      'Update many test executions sequentially (one PUT per item). The public API has no single bulk-update endpoint; mirrors create_multiple_test_cases. Optional continueOnError (default true).',
    inputSchema: {
      type: 'object',
      properties: {
        executions: {
          type: 'array',
          description: 'Each item: executionId, status (PASS|FAIL|WIP|BLOCKED), optional comment and defects',
          items: {
            type: 'object',
            properties: {
              executionId: { type: 'string' },
              status: { type: 'string', enum: ['PASS', 'FAIL', 'WIP', 'BLOCKED'] },
              comment: { type: 'string' },
              defects: { type: 'array', items: { type: 'string' } },
            },
            required: ['executionId', 'status'],
          },
        },
        continueOnError: { type: 'boolean', description: 'If false, stop on first failure (default true)' },
      },
      required: ['executions'],
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
    description:
      'Link a Zephyr test case to Jira issue(s) as coverage (POST /testcases/{key}/links/issues). Resolves each issue key via Jira REST API to a numeric issueId required by Zephyr.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseId: { type: 'string', description: 'Test case key or ID (e.g. CP-T4362)' },
        issueKeys: { type: 'array', items: { type: 'string' }, description: 'JIRA issue keys to link (e.g. CP-406)' },
      },
      required: ['testCaseId', 'issueKeys'],
    },
  },
  {
    name: 'link_test_cycle_to_issues',
    description:
      'Link a Zephyr test cycle to Jira issue(s) as coverage (POST /testcycles/{key}/links/issues). Resolves each issue key via Jira REST to a numeric issueId.',
    inputSchema: {
      type: 'object',
      properties: {
        cycleKey: { type: 'string', description: 'Test cycle key or ID (e.g. CP-R41)' },
        issueKeys: { type: 'array', items: { type: 'string' }, description: 'JIRA issue keys to link' },
      },
      required: ['cycleKey', 'issueKeys'],
    },
  },
  {
    name: 'link_test_plan_to_issues',
    description:
      'Link a Zephyr test plan to Jira issue(s) as coverage (POST /testplans/{key}/links/issues). Resolves each issue key via Jira REST to a numeric issueId.',
    inputSchema: {
      type: 'object',
      properties: {
        planKey: { type: 'string', description: 'Test plan key or ID (e.g. CP-P2)' },
        issueKeys: { type: 'array', items: { type: 'string' }, description: 'JIRA issue keys to link' },
      },
      required: ['planKey', 'issueKeys'],
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
    name: 'list_environments',
    description:
      'List test environments for a Jira project (Zephyr Scale). Use names when setting cycle environment or create_test_execution environmentName for consistency.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        limit: { type: 'number', description: 'Max results (default: 50)' },
        startAt: { type: 'number', description: 'Pagination offset (default: 0)' },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'get_environment',
    description: 'Get a single test environment by numeric id or key (Zephyr Scale GET /environments/{id}).',
    inputSchema: {
      type: 'object',
      properties: {
        environmentId: { type: 'string', description: 'Environment id or key' },
      },
      required: ['environmentId'],
    },
  },
  {
    name: 'create_environment',
    description: 'Create a test environment in a project (Zephyr Scale POST /environments).',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key' },
        name: { type: 'string', description: 'Environment name (e.g. Production, Staging)' },
        description: { type: 'string', description: 'Optional description' },
      },
      required: ['projectKey', 'name'],
    },
  },
  {
    name: 'update_environment',
    description:
      'Update a test environment name and/or description. Fetches the current environment first then PUTs a full body (Zephyr clears omitted fields on some instances).',
    inputSchema: {
      type: 'object',
      properties: {
        environmentId: { type: 'string', description: 'Environment id or key' },
        name: { type: 'string', description: 'New name (optional)' },
        description: { type: 'string', description: 'New description; omit to keep, null to clear if API allows (optional)' },
      },
      required: ['environmentId'],
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
          description: 'Test script (optional). type: STEP_BY_STEP (default when steps provided), PLAIN_TEXT, or CUCUMBER.',
          properties: {
            type: { type: 'string', enum: ['STEP_BY_STEP', 'PLAIN_TEXT', 'CUCUMBER'], description: 'Script type (default STEP_BY_STEP for steps, PLAIN_TEXT for free text)' },
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
            text: { type: 'string', description: 'Plain text or Cucumber script (for PLAIN_TEXT/CUCUMBER type)' },
          },
        },
      },
      required: ['projectKey', 'name'],
    },
  },
  {
    name: 'list_test_steps',
    description: 'List test steps for a test case (step-by-step script). Use test case key (e.g. CP-T123).',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key (e.g. CP-T123)' },
      },
      required: ['testCaseKey'],
    },
  },
  {
    name: 'create_test_step',
    description: 'Add a test step to an existing test case. Use for step-by-step test cases.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key' },
        description: { type: 'string', description: 'Step description/action' },
        expectedResult: { type: 'string', description: 'Expected result' },
        testData: { type: 'string', description: 'Test data (optional)' },
        index: { type: 'number', description: 'Step order (optional)' },
      },
      required: ['testCaseKey', 'description', 'expectedResult'],
    },
  },
  {
    name: 'update_test_step',
    description: 'Update an existing test step (description, expectedResult, testData, or index).',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key' },
        stepId: { type: 'number', description: 'Step ID (from list_test_steps)' },
        description: { type: 'string', description: 'New step description (optional)' },
        expectedResult: { type: 'string', description: 'New expected result (optional)' },
        testData: { type: 'string', description: 'New test data (optional)' },
        index: { type: 'number', description: 'New step order (optional)' },
      },
      required: ['testCaseKey', 'stepId'],
    },
  },
  {
    name: 'delete_test_step',
    description: 'Delete a test step from a test case.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key' },
        stepId: { type: 'number', description: 'Step ID (from list_test_steps)' },
      },
      required: ['testCaseKey', 'stepId'],
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
    name: 'list_test_cases_nextgen',
    description:
      'List test cases with cursor pagination (GET /testcases/nextgen). For large volumes; use nextStartAtId or next URL for the next page.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: { type: 'string', description: 'JIRA project key filter (optional; may be required if user has access to many projects)' },
        folderId: { type: 'number', description: 'Folder id filter (optional)' },
        limit: { type: 'number', description: 'Page size 1–1000 (default 50)' },
        startAtId: { type: 'number', description: 'Cursor / startAtId for pagination (default 0)' },
      },
      required: [],
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
    name: 'get_test_case_links',
    description:
      'List Jira issue links and web links for a test case (GET /testcases/{key}/links). Same contract as Zephyr Scale Cloud API getTestCaseLinks.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseId: { type: 'string', description: 'Test case key or ID (e.g. CP-T4362)' },
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
            type: { type: 'string', enum: ['STEP_BY_STEP', 'PLAIN_TEXT', 'CUCUMBER'] },
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
        },
      },
      required: ['testCaseId'],
    },
  },
  {
    name: 'archive_test_case',
    description:
      'Archive a test case (PUT /testcases/{key} with archived: true after GET merge). Zephyr often requires archiving before permanent delete in the UI; API support for `archived` varies by tenant — errors may mean your instance expects status changes or UI-only archive.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key (e.g. PROJ-T123)' },
      },
      required: ['testCaseKey'],
    },
  },
  {
    name: 'unarchive_test_case',
    description:
      'Restore an archived test case (PUT with archived: false). Same API caveats as archive_test_case.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key (e.g. PROJ-T123)' },
      },
      required: ['testCaseKey'],
    },
  },
  {
    name: 'delete_test_case',
    description:
      'Permanently delete a test case (DELETE /testcases/{key}). Often undocumented or disabled on public Scale API; may return 404/405. Remove from cycles and dependencies first (see Zephyr docs). Prefer archive_test_case + UI delete if API delete fails.',
    inputSchema: {
      type: 'object',
      properties: {
        testCaseKey: { type: 'string', description: 'Test case key (e.g. PROJ-T123)' },
      },
      required: ['testCaseKey'],
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
                  type: { type: 'string', enum: ['STEP_BY_STEP', 'PLAIN_TEXT', 'CUCUMBER'], description: 'Script type' },
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

      case 'list_projects': {
        const validatedArgs = validateInput<ListProjectsInput>(listProjectsSchema, args, 'list_projects');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listProjects(validatedArgs), null, 2),
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

      case 'get_test_plan': {
        const validatedArgs = validateInput<GetTestPlanInput>(getTestPlanSchema, args, 'get_test_plan');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTestPlan(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'update_test_plan': {
        const validatedArgs = validateInput<UpdateTestPlanInput>(updateTestPlanSchema, args, 'update_test_plan');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await updateTestPlan(validatedArgs), null, 2),
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

      case 'update_test_cycle': {
        const validatedArgs = validateInput<UpdateTestCycleInput>(updateTestCycleSchema, args, 'update_test_cycle');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await updateTestCycle(validatedArgs), null, 2),
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

      case 'get_test_cycle': {
        const validatedArgs = validateInput<GetTestCycleInput>(getTestCycleSchema, args, 'get_test_cycle');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTestCycle(validatedArgs), null, 2),
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

      case 'bulk_execute_tests': {
        const validatedArgs = validateInput<BulkExecuteTestsInput>(bulkExecuteTestsSchema, args, 'bulk_execute_tests');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await bulkExecuteTests(validatedArgs), null, 2),
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

      case 'list_test_executions_nextgen': {
        const validatedArgs = validateInput<ListTestExecutionsNextgenInput>(
          listTestExecutionsNextgenSchema,
          args,
          'list_test_executions_nextgen'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTestExecutionsNextgen(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'get_test_execution': {
        const validatedArgs = validateInput<GetTestExecutionInput>(getTestExecutionSchema, args, 'get_test_execution');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTestExecution(validatedArgs), null, 2),
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

      case 'remove_test_case_from_cycle': {
        const validatedArgs = validateInput<RemoveTestCaseFromCycleInput>(
          removeTestCaseFromCycleSchema,
          args,
          'remove_test_case_from_cycle'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await removeTestCaseFromCycle(validatedArgs), null, 2),
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

      case 'link_test_cycle_to_issues': {
        const validatedArgs = validateInput<LinkTestCycleToIssuesInput>(
          linkTestCycleToIssuesSchema,
          args,
          'link_test_cycle_to_issues'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await linkTestCycleToIssues(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'link_test_plan_to_issues': {
        const validatedArgs = validateInput<LinkTestPlanToIssuesInput>(
          linkTestPlanToIssuesSchema,
          args,
          'link_test_plan_to_issues'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await linkTestPlanToIssues(validatedArgs), null, 2),
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

      case 'list_environments': {
        const validatedArgs = validateInput<ListEnvironmentsInput>(listEnvironmentsSchema, args, 'list_environments');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listEnvironments(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'get_environment': {
        const validatedArgs = validateInput<GetEnvironmentInput>(getEnvironmentSchema, args, 'get_environment');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getEnvironment(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_environment': {
        const validatedArgs = validateInput<CreateEnvironmentInput>(createEnvironmentSchema, args, 'create_environment');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createEnvironment(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'update_environment': {
        const validatedArgs = validateInput<UpdateEnvironmentInput>(updateEnvironmentSchema, args, 'update_environment');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await updateEnvironment(validatedArgs), null, 2),
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

      case 'list_test_cases_nextgen': {
        const validatedArgs = validateInput<ListTestCasesNextgenInput>(
          listTestCasesNextgenSchema,
          args,
          'list_test_cases_nextgen'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTestCasesNextgen(validatedArgs), null, 2),
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

      case 'get_test_case_links': {
        const validatedArgs = validateInput<GetTestCaseLinksInput>(
          getTestCaseLinksSchema,
          args,
          'get_test_case_links'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTestCaseLinks(validatedArgs), null, 2),
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

      case 'archive_test_case': {
        const validatedArgs = validateInput<ArchiveTestCaseInput>(archiveTestCaseSchema, args, 'archive_test_case');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await archiveTestCase(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'unarchive_test_case': {
        const validatedArgs = validateInput<UnarchiveTestCaseInput>(unarchiveTestCaseSchema, args, 'unarchive_test_case');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await unarchiveTestCase(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'delete_test_case': {
        const validatedArgs = validateInput<DeleteTestCaseInput>(deleteTestCaseSchema, args, 'delete_test_case');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await deleteTestCase(validatedArgs), null, 2),
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

      case 'list_test_steps': {
        const validatedArgs = validateInput<ListTestStepsInput>(listTestStepsSchema, args, 'list_test_steps');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTestSteps(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'create_test_step': {
        const validatedArgs = validateInput<CreateTestStepInput>(createTestStepSchema, args, 'create_test_step');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createTestStep(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'update_test_step': {
        const validatedArgs = validateInput<UpdateTestStepInput>(updateTestStepSchema, args, 'update_test_step');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await updateTestStep(validatedArgs), null, 2),
            },
          ],
        };
      }

      case 'delete_test_step': {
        const validatedArgs = validateInput<DeleteTestStepInput>(deleteTestStepSchema, args, 'delete_test_step');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await deleteTestStep(validatedArgs), null, 2),
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