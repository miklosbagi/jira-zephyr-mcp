import { describe, expect, it } from 'vitest';
import {
  buildZephyrErrorInfo,
  formatZephyrApiError,
  parseApiMessageFromBody,
  zephyrToolFailure,
} from '../src/utils/zephyr-error-info.js';

describe('parseApiMessageFromBody', () => {
  it('reads Jira errorMessages', () => {
    expect(parseApiMessageFromBody({ errorMessages: ['Issue does not exist'] })).toBe('Issue does not exist');
  });
});

describe('buildZephyrErrorInfo', () => {
  it('classifies 403 and attaches permission categories when likely', () => {
    const err = { response: { status: 403, data: { message: 'Forbidden' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['create'] });
    expect(info.kind).toBe('permission_denied');
    expect(info.permissionIssueLikely).toBe(true);
    expect(info.relevantPermissionCategories).toEqual(['create']);
    expect(info.message).toMatch(/HTTP 403/);
  });

  it('does not attach categories for 404', () => {
    const err = { response: { status: 404, data: { message: 'Not found' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['delete'] });
    expect(info.kind).toBe('not_found');
    expect(info.permissionIssueLikely).toBe(false);
    expect(info.relevantPermissionCategories).toEqual([]);
  });

  it('detects permission wording without status', () => {
    const err = { response: { status: 400, data: { message: 'You do not have access' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['edit'] });
    expect(info.kind).toBe('validation');
    expect(info.permissionIssueLikely).toBe(true);
    expect(info.relevantPermissionCategories).toEqual(['edit']);
  });
});

describe('zephyrToolFailure', () => {
  it('returns success false and aligns error with errorInfo.message', () => {
    const err = { response: { status: 401, data: {} }, message: 'Request failed' };
    const r = zephyrToolFailure(err, { permissionCategories: [] });
    expect(r.success).toBe(false);
    expect(r.error).toBe(r.errorInfo.message);
    expect(r.errorInfo.kind).toBe('authentication');
  });
});

describe('formatZephyrApiError (legacy)', () => {
  it('matches prior behavior for nested message', () => {
    expect(formatZephyrApiError({ response: { data: { message: 'nested' } } })).toBe('nested');
  });
});
