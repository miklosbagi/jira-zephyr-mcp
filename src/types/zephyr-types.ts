export interface ZephyrTestPlan {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectId: string;
  status: string;
  createdOn: string;
  updatedOn: string;
  createdBy: {
    accountId: string;
    displayName: string;
  };
}

export interface ZephyrTestCycle {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectId: string;
  versionId: string;
  environment?: string;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  createdOn: string;
  updatedOn: string;
  executionSummary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    inProgress: number;
    notExecuted: number;
  };
}

export interface ZephyrTestExecution {
  id: string;
  key: string;
  cycleId: string;
  testCaseId: string;
  status: 'PASS' | 'FAIL' | 'WIP' | 'BLOCKED' | 'NOT_EXECUTED';
  comment?: string;
  executedOn?: string;
  executedBy?: {
    accountId: string;
    displayName: string;
  };
  defects: Array<{
    key: string;
    summary: string;
  }>;
}

export interface ZephyrTestCase {
  id: number;
  key: string;
  name: string;
  objective?: string;
  precondition?: string;
  estimatedTime?: number;
  labels?: string[];
  createdOn: string;
  project?: {
    id: number;
    self: string;
  };
  component?: {
    id: number;
    self: string;
  };
  priority?: {
    id: number;
    self: string;
  };
  status?: {
    id: number;
    self: string;
  };
  folder?: {
    id: number;
    self: string;
  };
  owner?: {
    self: string;
    accountId: string;
  };
  testScript?: {
    self: string;
  };
  customFields?: Record<string, any>;
  links?: {
    self: string;
    issues?: Array<{
      self: string;
      issueId: number;
      id: number;
      target: string;
      type: string;
    }>;
    webLinks?: any[];
  };
}

export interface ZephyrFolder {
  id: number;
  name: string;
  projectKey?: string;
  projectId?: number;
  parentId?: number | null;
  type?: 'TEST_CASE' | 'TEST_CYCLE';
  self?: string;
  folders?: ZephyrFolder[];
}

export interface ZephyrPriority {
  id: number;
  name: string;
  self?: string;
}

export interface ZephyrStatus {
  id: number;
  name: string;
  self?: string;
}

export interface ZephyrExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  inProgress: number;
  notExecuted: number;
  passRate: number;
}

export interface ZephyrTestReport {
  cycleId: string;
  cycleName: string;
  projectKey: string;
  summary: ZephyrExecutionSummary;
  executions: ZephyrTestExecution[];
  generatedOn: string;
}

/** Test script type: step-by-step, plain text, or Cucumber/BDD. Default STEP_BY_STEP when steps are provided, PLAIN_TEXT for free text. */
export type ZephyrTestScriptType = 'STEP_BY_STEP' | 'PLAIN_TEXT' | 'CUCUMBER';

/** Single test step (API may use step/data/result or description/expectedResult/testData). */
export interface ZephyrTestStep {
  id?: number;
  orderId?: number;
  index?: number;
  /** Step action/description (API field may be "step" or "description") */
  description?: string;
  step?: string;
  /** Test data (API field may be "data" or "testData") */
  testData?: string;
  data?: string;
  /** Expected result (API field may be "result" or "expectedResult") */
  expectedResult?: string;
  result?: string;
}