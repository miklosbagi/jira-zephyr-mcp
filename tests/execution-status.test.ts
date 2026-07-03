import { describe, expect, it } from 'vitest';
import {
  executionStatusNameToCode,
  executionStatusTokenToCode,
  getExecutionStatusCodeFromRow,
  getExecutionStatusNameFromRow,
  summarizeExecutionStatusCode,
} from '../src/utils/execution-status.js';

describe('execution-status', () => {
  it('maps UI status names to codes', () => {
    expect(executionStatusNameToCode('Pass')).toBe('PASS');
    expect(executionStatusNameToCode('Fail')).toBe('FAIL');
    expect(executionStatusNameToCode('In Progress')).toBe('WIP');
    expect(executionStatusNameToCode('Blocked')).toBe('BLOCKED');
    expect(executionStatusNameToCode('Not Executed')).toBe('NOT_EXECUTED');
  });

  it('maps legacy status tokens', () => {
    expect(executionStatusTokenToCode('PASS')).toBe('PASS');
    expect(executionStatusTokenToCode('WIP')).toBe('WIP');
  });

  it('reads testExecutionStatus id via status map', () => {
    const map = new Map<number, string>([[42, 'Pass']]);
    const row = { testExecutionStatus: { id: 42 } };
    expect(getExecutionStatusNameFromRow(row, map)).toBe('Pass');
    expect(getExecutionStatusCodeFromRow(row, map)).toBe('PASS');
  });

  it('reads embedded testExecutionStatus.name', () => {
    const row = { testExecutionStatus: { id: 1, name: 'Fail' } };
    expect(getExecutionStatusCodeFromRow(row)).toBe('FAIL');
  });

  it('summarizes buckets', () => {
    expect(summarizeExecutionStatusCode('PASS')).toBe('passed');
    expect(summarizeExecutionStatusCode(undefined)).toBe('notExecuted');
  });
});
