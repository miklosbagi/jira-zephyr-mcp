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

  it('derives the key from testCase.self when key/testCaseKey are absent (issue #153)', () => {
    // The exact Scale Cloud execution shape: only self + numeric id, no key.
    const ex = {
      testCase: {
        self: 'https://eu.api.zephyrscale.smartbear.com/v2/testcases/CP-T8/versions/1',
        id: 2543463,
      },
    };
    expect(getExecutionTestCaseKey(ex)).toBe('CP-T8');
    // self without a version suffix also works
    expect(
      getExecutionTestCaseKey({ testCase: { self: 'https://x/v2/testcases/AB-T12' } })
    ).toBe('AB-T12');
    // a non-key segment (e.g. numeric id) must not be mistaken for a key
    expect(
      getExecutionTestCaseKey({ testCase: { self: 'https://x/v2/testcases/2543463' } })
    ).toBeUndefined();
  });

  it('matches by key derived from testCase.self (issue #153)', () => {
    const ex = {
      testCase: {
        self: 'https://eu.api.zephyrscale.smartbear.com/v2/testcases/CP-T8/versions/1',
        id: 2543463,
      },
    };
    expect(executionMatchesTestCaseFilter(ex, 'CP-T8')).toBe(true);
    expect(executionMatchesTestCaseFilter(ex, 'cp-t8')).toBe(true);
    // still matches by the numeric entity id as a string
    expect(executionMatchesTestCaseFilter(ex, '2543463')).toBe(true);
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
