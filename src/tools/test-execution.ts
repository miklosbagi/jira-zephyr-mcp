import { ZephyrClient } from '../clients/zephyr-client.js';
import { getExecutionTestCaseEntityId, getExecutionTestCaseKey } from '../utils/test-execution-identity.js';
import { formatZephyrApiError } from '../utils/zephyr-api-error.js';
import { getJiraClient } from './jira-issues.js';
import {
  executeTestSchema,
  getTestExecutionStatusSchema,
  listTestExecutionsInCycleSchema,
  listTestExecutionsNextgenSchema,
  bulkExecuteTestsSchema,
  linkTestsToIssuesSchema,
  linkTestCycleToIssuesSchema,
  linkTestPlanToIssuesSchema,
  generateTestReportSchema,
  createTestExecutionSchema,
  removeTestCaseFromCycleSchema,
  type ExecuteTestInput,
  type GetTestExecutionStatusInput,
  type ListTestExecutionsInCycleInput,
  type ListTestExecutionsNextgenInput,
  type BulkExecuteTestsInput,
  type LinkTestsToIssuesInput,
  type LinkTestCycleToIssuesInput,
  type LinkTestPlanToIssuesInput,
  type GenerateTestReportInput,
  type CreateTestExecutionInput,
  type RemoveTestCaseFromCycleInput,
} from '../utils/validation.js';

let zephyrClient: ZephyrClient | null = null;

const getZephyrClient = (): ZephyrClient => {
  if (!zephyrClient) {
    zephyrClient = new ZephyrClient();
  }
  return zephyrClient;
};

export const removeTestCaseFromCycle = async (input: RemoveTestCaseFromCycleInput) => {
  const validatedInput = removeTestCaseFromCycleSchema.parse(input);
  try {
    const client = getZephyrClient();
    if (validatedInput.executionId?.trim()) {
      const executionId = validatedInput.executionId.trim();
      await client.deleteTestExecution(executionId);
      return {
        success: true,
        data: { executionId, removed: true },
      };
    }
    const cycleKey = validatedInput.cycleKey!.trim();
    const testCaseKey = validatedInput.testCaseKey!.trim();
    const { executionId } = await client.removeTestCaseFromCycle(cycleKey, testCaseKey);
    return {
      success: true,
      data: { cycleKey, testCaseKey, executionId, removed: true },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: formatZephyrApiError(error),
    };
  }
};

export const createTestExecution = async (input: CreateTestExecutionInput) => {
  const validatedInput = createTestExecutionSchema.parse(input);
  try {
    const execution = await getZephyrClient().createTestExecution({
      projectKey: validatedInput.projectKey,
      testCaseKey: validatedInput.testCaseKey,
      testCycleKey: validatedInput.testCycleKey,
      statusName: validatedInput.statusName,
      environmentName: validatedInput.environmentName,
    });
    return {
      success: true,
      data: {
        id: execution.id,
        key: execution.key,
        cycleId: execution.cycleId,
        testCaseId: execution.testCaseId,
        status: execution.status,
        executedOn: execution.executedOn,
        executedBy: execution.executedBy?.displayName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const executeTest = async (input: ExecuteTestInput) => {
  const validatedInput = executeTestSchema.parse(input);
  
  try {
    const execution = await getZephyrClient().updateTestExecution({
      executionId: validatedInput.executionId,
      status: validatedInput.status,
      comment: validatedInput.comment,
      defects: validatedInput.defects,
    });
    
    return {
      success: true,
      data: {
        id: execution.id,
        key: execution.key,
        cycleId: execution.cycleId,
        testCaseId: execution.testCaseId,
        status: execution.status,
        comment: execution.comment,
        executedOn: execution.executedOn,
        executedBy: execution.executedBy?.displayName,
        defects: execution.defects.map(defect => ({
          key: defect.key,
          summary: defect.summary,
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

export const listTestExecutionsInCycle = async (input: ListTestExecutionsInCycleInput) => {
  const validatedInput = listTestExecutionsInCycleSchema.parse(input);
  try {
    const client = getZephyrClient();
    const { executions: raw, total } = await client.getTestExecutionsInCycle(validatedInput.cycleId);
    const executions = await client.enrichExecutionsWithTestCaseKeys(
      raw as unknown as Record<string, unknown>[]
    );
    return {
      success: true,
      data: {
        cycleId: validatedInput.cycleId,
        total,
        executions: executions.map((ex: Record<string, unknown>) => ({
          id: ex.id,
          key: ex.key,
          testCaseId: getExecutionTestCaseEntityId(ex),
          testCaseKey: getExecutionTestCaseKey(ex),
          status: ex.status,
          comment: ex.comment,
          executedOn: ex.executedOn,
          executedBy: (ex.executedBy as { displayName?: string } | undefined)?.displayName,
          defects:
            (ex.defects as Array<{ key: string; summary?: string }> | undefined)?.map(d => ({
              key: d.key,
              summary: d.summary,
            })) ?? [],
        })),
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: formatZephyrApiError(error),
    };
  }
};

export const listTestExecutionsNextgen = async (input: ListTestExecutionsNextgenInput) => {
  const validatedInput = listTestExecutionsNextgenSchema.parse(input);
  try {
    const page = await getZephyrClient().listTestExecutionsNextgen({
      projectKey: validatedInput.projectKey,
      testCycle: validatedInput.testCycle,
      testCase: validatedInput.testCase,
      actualEndDateAfter: validatedInput.actualEndDateAfter,
      actualEndDateBefore: validatedInput.actualEndDateBefore,
      includeStepLinks: validatedInput.includeStepLinks,
      jiraProjectVersionId: validatedInput.jiraProjectVersionId,
      onlyLastExecutions: validatedInput.onlyLastExecutions,
      limit: validatedInput.limit,
      startAtId: validatedInput.startAtId,
    });
    return {
      success: true,
      data: {
        limit: page.limit,
        nextStartAtId: page.nextStartAtId,
        next: page.next,
        executions: page.values.map(ex => {
          const row = ex as unknown as Record<string, unknown>;
          return {
            id: row.id,
            key: row.key,
            cycleId: row.cycleId,
            testCaseId: getExecutionTestCaseEntityId(row),
            testCaseKey: getExecutionTestCaseKey(row),
            status: row.status,
            comment: row.comment,
            executedOn: row.executedOn,
            executedBy: (row.executedBy as { displayName?: string } | undefined)?.displayName,
            defects:
              (row.defects as Array<{ key: string; summary?: string }> | undefined)?.map(d => ({
                key: d.key,
                summary: d.summary,
              })) ?? [],
          };
        }),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const bulkExecuteTests = async (input: BulkExecuteTestsInput) => {
  const validatedInput = bulkExecuteTestsSchema.parse(input);
  try {
    const result = await getZephyrClient().bulkExecuteTests(
      validatedInput.executions,
      validatedInput.continueOnError
    );
    return {
      success: true,
      data: {
        results: result.results.map(r => ({
          index: r.index,
          success: r.success,
          execution:
            r.success && r.data
              ? {
                  id: r.data.id,
                  key: r.data.key,
                  cycleId: r.data.cycleId,
                  testCaseId: r.data.testCaseId,
                  status: r.data.status,
                  comment: r.data.comment,
                  executedOn: r.data.executedOn,
                  executedBy: r.data.executedBy?.displayName,
                  defects: r.data.defects?.map(d => ({ key: d.key, summary: d.summary })) ?? [],
                }
              : undefined,
          error: r.error,
        })),
        summary: result.summary,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

export const getTestExecutionStatus = async (input: GetTestExecutionStatusInput) => {
  const validatedInput = getTestExecutionStatusSchema.parse(input);
  
  try {
    const summary = await getZephyrClient().getTestExecutionSummary(validatedInput.cycleId);
    
    return {
      success: true,
      data: {
        cycleId: validatedInput.cycleId,
        summary: {
          total: summary.total,
          passed: summary.passed,
          failed: summary.failed,
          blocked: summary.blocked,
          inProgress: summary.inProgress,
          notExecuted: summary.notExecuted,
          passRate: Math.round(summary.passRate),
        },
        progress: {
          completed: summary.passed + summary.failed + summary.blocked,
          remaining: summary.notExecuted + summary.inProgress,
          completionPercentage: summary.total > 0 
            ? Math.round(((summary.passed + summary.failed + summary.blocked) / summary.total) * 100)
            : 0,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

type IssueLinkRow = {
  issueKey: string;
  issueId?: number;
  success: boolean;
  error?: string;
};

/** Resolve Jira issue keys to ids and call Zephyr for each link (coverage). */
async function linkIssueKeysToZephyr(
  issueKeys: string[],
  linkOne: (issueId: number) => Promise<unknown>
): Promise<IssueLinkRow[]> {
  const results: IssueLinkRow[] = [];
  for (const issueKey of issueKeys) {
    try {
      const issue = await getJiraClient().getIssue(issueKey, ['id']);
      const issueId = Number(issue.id);
      if (!Number.isSafeInteger(issueId) || issueId < 1) {
        throw new Error(`Could not resolve numeric Jira issue id for ${issueKey} (got: ${issue.id})`);
      }
      await linkOne(issueId);
      results.push({ issueKey, issueId, success: true });
    } catch (error: any) {
      const status = error.response?.status;
      const bodyMsg = error.response?.data?.message;
      const detail = [status && `HTTP ${status}`, bodyMsg || error.message].filter(Boolean).join(': ');
      results.push({ issueKey, success: false, error: detail || String(error) });
    }
  }
  return results;
}

export const linkTestsToIssues = async (input: LinkTestsToIssuesInput) => {
  const validatedInput = linkTestsToIssuesSchema.parse(input);
  try {
    const results = await linkIssueKeysToZephyr(validatedInput.issueKeys, (issueId) =>
      getZephyrClient().createTestCaseIssueLink(validatedInput.testCaseId, issueId)
    );
    return {
      success: true,
      data: {
        testCaseId: validatedInput.testCaseId,
        linkResults: results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const linkTestCycleToIssues = async (input: LinkTestCycleToIssuesInput) => {
  const validatedInput = linkTestCycleToIssuesSchema.parse(input);
  try {
    const results = await linkIssueKeysToZephyr(validatedInput.issueKeys, (issueId) =>
      getZephyrClient().createTestCycleIssueLink(validatedInput.cycleKey, issueId)
    );
    return {
      success: true,
      data: {
        cycleKey: validatedInput.cycleKey,
        linkResults: results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const linkTestPlanToIssues = async (input: LinkTestPlanToIssuesInput) => {
  const validatedInput = linkTestPlanToIssuesSchema.parse(input);
  try {
    const results = await linkIssueKeysToZephyr(validatedInput.issueKeys, (issueId) =>
      getZephyrClient().createTestPlanIssueLink(validatedInput.planKey, issueId)
    );
    return {
      success: true,
      data: {
        planKey: validatedInput.planKey,
        linkResults: results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const generateTestReport = async (input: GenerateTestReportInput) => {
  const validatedInput = generateTestReportSchema.parse(input);
  
  try {
    const report = await getZephyrClient().generateTestReport(validatedInput.cycleId);
    
    if (validatedInput.format === 'HTML') {
      const htmlReport = generateHtmlReport(report);
      return {
        success: true,
        data: {
          format: 'HTML',
          content: htmlReport,
          generatedOn: report.generatedOn,
        },
      };
    }
    
    return {
      success: true,
      data: {
        format: 'JSON',
        content: report,
        generatedOn: report.generatedOn,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

const generateHtmlReport = (report: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Execution Report - ${report.cycleName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background-color: #e8f4f8; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .executions { margin-top: 30px; }
        .execution { padding: 10px; border-left: 4px solid #ddd; margin: 10px 0; }
        .execution.pass { border-left-color: #4caf50; }
        .execution.fail { border-left-color: #f44336; }
        .execution.blocked { border-left-color: #ff9800; }
        .execution.progress { border-left-color: #2196f3; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Test Execution Report</h1>
        <h2>${report.cycleName}</h2>
        <p>Project: ${report.projectKey}</p>
        <p>Generated: ${new Date(report.generatedOn).toLocaleString()}</p>
      </div>
      
      <div class="summary">
        <div class="metric">
          <h3>Total Tests</h3>
          <div class="value">${report.summary.total}</div>
        </div>
        <div class="metric">
          <h3>Passed</h3>
          <div class="value">${report.summary.passed}</div>
        </div>
        <div class="metric">
          <h3>Failed</h3>
          <div class="value">${report.summary.failed}</div>
        </div>
        <div class="metric">
          <h3>Blocked</h3>
          <div class="value">${report.summary.blocked}</div>
        </div>
        <div class="metric">
          <h3>Pass Rate</h3>
          <div class="value">${Math.round(report.summary.passRate)}%</div>
        </div>
      </div>
      
      <div class="executions">
        <h3>Test Executions</h3>
        ${report.executions.map((exec: any) => `
          <div class="execution ${exec.status.toLowerCase()}">
            <strong>${exec.key}</strong> - ${exec.status}
            ${exec.comment ? `<p>${exec.comment}</p>` : ''}
            ${exec.defects.length > 0 ? `<p>Defects: ${exec.defects.map((d: any) => d.key).join(', ')}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
};