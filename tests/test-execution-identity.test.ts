import { describe, expect, it } from 'vitest';
import {
  executionMatchesTestCaseFilter,
  getExecutionTestCaseEntityId,
  getExecutionTestCaseKey,
} from '../src/utils/test-execution-identity.js';

describe('test-execution-identity', () => {
  it('reads test case key from testCase.key or testCaseKey', () => {
    expect(getExecutionTestCaseKey({ testCase: { key: 'CP-T1' } })).toBe('CP-T1');
    expect(getExecutionTestCaseKey({ testCaseKey: 'CP-T2' })).toBe('CP-T2');
    expect(getExecutionTestCaseKey({ testCase: { id: 1 } })).toBeUndefined();
  });

  it('reads test case entity id from testCaseId or testCase.id', () => {
    expect(getExecutionTestCaseEntityId({ testCaseId: '42' })).toBe('42');
    expect(getExecutionTestCaseEntityId({ testCase: { id: 99 } })).toBe(99);
  });

  it('matches filter by key case-insensitively or by entity id string', () => {
    expect(executionMatchesTestCaseFilter({ testCase: { key: 'cp-t1' } }, 'CP-T1')).toBe(true);
    expect(executionMatchesTestCaseFilter({ testCase: { id: 1001 } }, '1001')).toBe(true);
    expect(executionMatchesTestCaseFilter({ testCase: { key: 'A' } }, 'B')).toBe(false);
    expect(executionMatchesTestCaseFilter({ testCase: { key: 'Z' } }, '   ')).toBe(false);
  });
});
