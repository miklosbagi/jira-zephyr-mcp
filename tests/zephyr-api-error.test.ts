import { describe, expect, it } from 'vitest';
import { formatZephyrApiError } from '../src/utils/zephyr-api-error.js';

describe('formatZephyrApiError', () => {
  it('handles null and non-object', () => {
    expect(formatZephyrApiError(null)).toBe('Unknown error');
    expect(formatZephyrApiError('plain')).toBe('plain');
  });

  it('uses message when no response data', () => {
    expect(formatZephyrApiError({ message: 'oops' })).toBe('oops');
  });

  it('uses string response data', () => {
    expect(formatZephyrApiError({ response: { data: 'raw' } })).toBe('raw');
  });

  it('uses nested message in object data', () => {
    expect(formatZephyrApiError({ response: { data: { message: 'nested' } } })).toBe('nested');
  });

  it('stringifies object data without message', () => {
    expect(formatZephyrApiError({ response: { data: { code: 1 } } })).toBe('{"code":1}');
  });

  it('falls back when response data is not JSON-serializable', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatZephyrApiError({ message: 'outer', response: { data: circular } })).toBe('outer');
  });
});
