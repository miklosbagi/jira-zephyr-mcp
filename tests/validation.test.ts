/**
 * Schema coverage: happy paths + refinements / branches on exported Zod schemas.
 */
import { describe, it, expect } from 'vitest';
import {
  createTestPlanSchema,
  createTestCycleSchema,
  readJiraIssueSchema,
  listProjectsSchema,
  listTestPlansSchema,
  getTestPlanSchema,
  updateTestPlanSchema,
  listTestCyclesSchema,
  getTestCycleSchema,
  updateTestCycleSchema,
  executeTestSchema,
  getTestExecutionStatusSchema,
  listTestExecutionsInCycleSchema,
  listTestExecutionsNextgenSchema,
  listTestCasesNextgenSchema,
  bulkExecuteTestsSchema,
  addTestCasesToCycleSchema,
  removeTestCaseFromCycleSchema,
  listFoldersSchema,
  createFolderSchema,
  listPrioritiesSchema,
  listStatusesSchema,
  listEnvironmentsSchema,
  getEnvironmentSchema,
  createEnvironmentSchema,
  updateEnvironmentSchema,
  createTestExecutionSchema,
  linkTestsToIssuesSchema,
  linkTestCycleToIssuesSchema,
  linkTestPlanToIssuesSchema,
  generateTestReportSchema,
  createTestCaseSchema,
  searchTestCasesSchema,
  getTestCaseSchema,
  getTestCaseLinksSchema,
  archiveTestCaseSchema,
  unarchiveTestCaseSchema,
  deleteTestCaseSchema,
  updateTestCaseSchema,
  createMultipleTestCasesSchema,
  listTestStepsSchema,
  createTestStepSchema,
  updateTestStepSchema,
  deleteTestStepSchema,
} from '../src/utils/validation.js';

describe('validation schemas', () => {
  it('createTestPlanSchema.parse', () => {
    expect(
      createTestPlanSchema.parse({
        name: 'P',
        projectKey: 'PK',
      })
    ).toMatchObject({ name: 'P', projectKey: 'PK' });
  });

  it('createTestCycleSchema.parse', () => {
    expect(
      createTestCycleSchema.parse({
        name: 'C',
        projectKey: 'PK',
        versionId: 'v1',
      })
    ).toMatchObject({ versionId: 'v1' });
  });

  it('readJiraIssueSchema.parse', () => {
    expect(readJiraIssueSchema.parse({ issueKey: 'X-1' })).toEqual({ issueKey: 'X-1' });
    expect(readJiraIssueSchema.parse({ issueKey: 'X-1', fields: ['summary'] })).toEqual({
      issueKey: 'X-1',
      fields: ['summary'],
    });
  });

  it('listProjectsSchema defaults', () => {
    expect(listProjectsSchema.parse({})).toEqual({ limit: 50, startAt: 0 });
  });

  it('listTestPlansSchema defaults', () => {
    expect(listTestPlansSchema.parse({ projectKey: 'P' })).toEqual({
      projectKey: 'P',
      limit: 50,
      offset: 0,
    });
  });

  it('getTestPlanSchema', () => {
    expect(getTestPlanSchema.parse({ planKey: 'TP-1' })).toEqual({ planKey: 'TP-1' });
  });

  it('updateTestPlanSchema superRefine requires at least one field', () => {
    expect(() =>
      updateTestPlanSchema.parse({ planKey: 'TP-1' })
    ).toThrow(/Provide at least one field/);
    expect(
      updateTestPlanSchema.parse({ planKey: 'TP-1', name: 'N' })
    ).toMatchObject({ planKey: 'TP-1', name: 'N' });
  });

  it('listTestCyclesSchema', () => {
    expect(listTestCyclesSchema.parse({ projectKey: 'P' })).toMatchObject({ projectKey: 'P' });
  });

  it('getTestCycleSchema', () => {
    expect(getTestCycleSchema.parse({ cycleKey: 'TC-1' })).toEqual({ cycleKey: 'TC-1' });
  });

  it('updateTestCycleSchema', () => {
    expect(updateTestCycleSchema.parse({ cycleKey: 'TC-1', name: 'x' })).toMatchObject({
      cycleKey: 'TC-1',
      name: 'x',
    });
  });

  it('executeTestSchema', () => {
    expect(
      executeTestSchema.parse({
        executionId: 'e1',
        status: 'PASS',
      })
    ).toMatchObject({ executionId: 'e1', status: 'PASS' });
  });

  it('getTestExecutionStatusSchema', () => {
    expect(getTestExecutionStatusSchema.parse({ cycleId: 'c1' })).toEqual({ cycleId: 'c1' });
  });

  it('listTestExecutionsInCycleSchema', () => {
    expect(listTestExecutionsInCycleSchema.parse({ cycleId: 'c1' })).toEqual({ cycleId: 'c1' });
  });

  it('listTestExecutionsNextgenSchema defaults', () => {
    expect(listTestExecutionsNextgenSchema.parse({})).toMatchObject({ limit: 50, startAtId: 0 });
  });

  it('listTestCasesNextgenSchema defaults', () => {
    expect(listTestCasesNextgenSchema.parse({})).toMatchObject({ limit: 50, startAtId: 0 });
  });

  it('bulkExecuteTestsSchema', () => {
    expect(() => bulkExecuteTestsSchema.parse({ executions: [] })).toThrow();
    expect(
      bulkExecuteTestsSchema.parse({
        executions: [{ executionId: 'e1', status: 'PASS' }],
      })
    ).toMatchObject({ continueOnError: true });
  });

  it('addTestCasesToCycleSchema', () => {
    expect(
      addTestCasesToCycleSchema.parse({
        cycleKey: 'TC-1',
        testCaseKeys: ['T-1'],
      })
    ).toEqual({ cycleKey: 'TC-1', testCaseKeys: ['T-1'] });
  });

  it('removeTestCaseFromCycleSchema superRefine', () => {
    expect(() =>
      removeTestCaseFromCycleSchema.parse({ executionId: 'e', cycleKey: 'c', testCaseKey: 't' })
    ).toThrow(/not both/);
    expect(() => removeTestCaseFromCycleSchema.parse({})).toThrow(/executionId/);
    expect(
      removeTestCaseFromCycleSchema.parse({ executionId: '  e1  ' })
    ).toMatchObject({ executionId: '  e1  ' });
    expect(
      removeTestCaseFromCycleSchema.parse({ cycleKey: 'C', testCaseKey: 'T' })
    ).toMatchObject({ cycleKey: 'C', testCaseKey: 'T' });
  });

  it('listFoldersSchema', () => {
    expect(listFoldersSchema.parse({ projectKey: 'P' })).toMatchObject({ projectKey: 'P' });
  });

  it('createFolderSchema', () => {
    expect(
      createFolderSchema.parse({ projectKey: 'P', name: 'F' })
    ).toMatchObject({ projectKey: 'P', name: 'F' });
  });

  it('listPrioritiesSchema / listStatusesSchema', () => {
    expect(listPrioritiesSchema.parse({})).toEqual({});
    expect(listStatusesSchema.parse({ projectKey: 'P' })).toEqual({ projectKey: 'P' });
  });

  it('listEnvironmentsSchema', () => {
    expect(listEnvironmentsSchema.parse({ projectKey: 'P' })).toMatchObject({ projectKey: 'P' });
  });

  it('getEnvironmentSchema', () => {
    expect(getEnvironmentSchema.parse({ environmentId: 'e1' })).toEqual({ environmentId: 'e1' });
  });

  it('createEnvironmentSchema', () => {
    expect(
      createEnvironmentSchema.parse({ projectKey: 'P', name: 'N' })
    ).toMatchObject({ projectKey: 'P', name: 'N' });
  });

  it('updateEnvironmentSchema refine', () => {
    expect(() =>
      updateEnvironmentSchema.parse({ environmentId: 'e1' })
    ).toThrow(/At least one of name or description/);
    expect(
      updateEnvironmentSchema.parse({ environmentId: 'e1', name: 'x' })
    ).toMatchObject({ environmentId: 'e1', name: 'x' });
  });

  it('createTestExecutionSchema', () => {
    expect(
      createTestExecutionSchema.parse({
        projectKey: 'P',
        testCaseKey: 'T',
        testCycleKey: 'C',
      })
    ).toMatchObject({ projectKey: 'P' });
  });

  it('link*Schemas', () => {
    expect(
      linkTestsToIssuesSchema.parse({ testCaseId: 'T', issueKeys: ['I-1'] })
    ).toMatchObject({ testCaseId: 'T' });
    expect(
      linkTestCycleToIssuesSchema.parse({ cycleKey: 'C', issueKeys: ['I-1'] })
    ).toMatchObject({ cycleKey: 'C' });
    expect(
      linkTestPlanToIssuesSchema.parse({ planKey: 'P', issueKeys: ['I-1'] })
    ).toMatchObject({ planKey: 'P' });
  });

  it('generateTestReportSchema default format', () => {
    expect(generateTestReportSchema.parse({ cycleId: 'c1' })).toEqual({
      cycleId: 'c1',
      format: 'JSON',
    });
  });

  it('createTestCaseSchema', () => {
    expect(
      createTestCaseSchema.parse({
        projectKey: 'P',
        name: 'N',
        testScript: {
          type: 'STEP_BY_STEP',
          steps: [{ index: 1, description: 'd', expectedResult: 'e' }],
        },
      })
    ).toMatchObject({ name: 'N' });
  });

  it('searchTestCasesSchema', () => {
    expect(searchTestCasesSchema.parse({ projectKey: 'P' })).toMatchObject({ projectKey: 'P' });
  });

  it('getTestCaseSchema / getTestCaseLinksSchema', () => {
    expect(getTestCaseSchema.parse({ testCaseId: 'T-1' })).toEqual({ testCaseId: 'T-1' });
    expect(getTestCaseLinksSchema.parse({ testCaseId: 'T-1' })).toEqual({ testCaseId: 'T-1' });
  });

  it('archive / unarchive / delete test case schemas', () => {
    expect(archiveTestCaseSchema.parse({ testCaseKey: 'T-1' })).toEqual({ testCaseKey: 'T-1' });
    expect(unarchiveTestCaseSchema.parse({ testCaseKey: 'T-1' })).toEqual({ testCaseKey: 'T-1' });
    expect(deleteTestCaseSchema.parse({ testCaseKey: 'T-1' })).toEqual({ testCaseKey: 'T-1' });
  });

  it('updateTestCaseSchema refine', () => {
    expect(() => updateTestCaseSchema.parse({ testCaseId: 'T-1' })).toThrow(/At least one field/);
    expect(
      updateTestCaseSchema.parse({ testCaseId: 'T-1', name: 'x' })
    ).toMatchObject({ name: 'x' });
  });

  it('createMultipleTestCasesSchema', () => {
    expect(() =>
      createMultipleTestCasesSchema.parse({ testCases: [] })
    ).toThrow();
    expect(
      createMultipleTestCasesSchema.parse({
        testCases: [{ projectKey: 'P', name: 'N' }],
      })
    ).toMatchObject({ continueOnError: true });
  });

  it('listTestStepsSchema', () => {
    expect(listTestStepsSchema.parse({ testCaseKey: 'T-1' })).toEqual({ testCaseKey: 'T-1' });
  });

  it('createTestStepSchema', () => {
    expect(
      createTestStepSchema.parse({
        testCaseKey: 'T-1',
        description: 'd',
        expectedResult: 'e',
      })
    ).toMatchObject({ description: 'd' });
  });

  it('updateTestStepSchema refine', () => {
    expect(() =>
      updateTestStepSchema.parse({ testCaseKey: 'T-1', stepId: 1 })
    ).toThrow(/At least one field/);
    expect(
      updateTestStepSchema.parse({ testCaseKey: 'T-1', stepId: 1, description: 'd' })
    ).toMatchObject({ description: 'd' });
  });

  it('deleteTestStepSchema', () => {
    expect(deleteTestStepSchema.parse({ testCaseKey: 'T-1', stepId: 1 })).toEqual({
      testCaseKey: 'T-1',
      stepId: 1,
    });
  });
});
