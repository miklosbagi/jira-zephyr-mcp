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

  it('reads error, errorMessage, detail, and title', () => {
    expect(parseApiMessageFromBody({ error: 'e' })).toBe('e');
    expect(parseApiMessageFromBody({ errorMessage: 'em' })).toBe('em');
    expect(parseApiMessageFromBody({ detail: 'd' })).toBe('d');
    expect(parseApiMessageFromBody({ title: 't' })).toBe('t');
  });

  it('returns undefined for primitive non-string', () => {
    expect(parseApiMessageFromBody(42)).toBeUndefined();
    expect(parseApiMessageFromBody(true)).toBeUndefined();
  });

  it('stringifies plain objects without known keys', () => {
    expect(parseApiMessageFromBody({ code: 7 })).toBe('{"code":7}');
  });

  it('returns undefined when JSON.stringify throws (circular)', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(parseApiMessageFromBody(circular)).toBeUndefined();
  });

  it('prefers message string over other keys', () => {
    expect(parseApiMessageFromBody({ message: 'm', error: 'e' })).toBe('m');
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
    expect(info.hint).toMatch(/may not exist/);
  });

  it('detects permission wording on 400 (validation kind) and attaches categories', () => {
    const err = { response: { status: 400, data: { message: 'You do not have access' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['edit'] });
    expect(info.kind).toBe('validation');
    expect(info.permissionIssueLikely).toBe(true);
    expect(info.relevantPermissionCategories).toEqual(['edit']);
  });

  it('gives validation hint when 400 is not permission-like', () => {
    const err = { response: { status: 400, data: { message: 'Invalid field' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['create'] });
    expect(info.kind).toBe('validation');
    expect(info.permissionIssueLikely).toBe(false);
    expect(info.hint).toMatch(/payload/);
  });

  it('classifies status codes', () => {
    expect(buildZephyrErrorInfo({ response: { status: 401 } }, { permissionCategories: [] }).kind).toBe(
      'authentication'
    );
    expect(buildZephyrErrorInfo({ response: { status: 409 } }, { permissionCategories: [] }).kind).toBe('conflict');
    expect(buildZephyrErrorInfo({ response: { status: 429 } }, { permissionCategories: [] }).kind).toBe('rate_limit');
    expect(buildZephyrErrorInfo({ response: { status: 422 } }, { permissionCategories: [] }).kind).toBe(
      'validation'
    );
    expect(buildZephyrErrorInfo({ response: { status: 502 } }, { permissionCategories: [] }).kind).toBe(
      'server_error'
    );
  });

  it('uses Jira authentication hint when integration is jira', () => {
    const err = { response: { status: 401, data: {} }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: [], integration: 'jira' });
    expect(info.kind).toBe('authentication');
    expect(info.hint).toMatch(/JIRA_/);
  });

  it('uses Zephyr permission hint when 403, no categories, zephyr integration', () => {
    const err = { response: { status: 403, data: { message: 'Nope' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: [] });
    expect(info.kind).toBe('permission_denied');
    expect(info.hint).toMatch(/Zephyr Scale/);
  });

  it('uses Jira generic hint when 403, no categories, jira integration', () => {
    const err = { response: { status: 403, data: { message: 'Nope' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: [], integration: 'jira' });
    expect(info.hint).toMatch(/issue or project in Jira/);
  });

  it('lists multiple permission category labels in hint', () => {
    const err = { response: { status: 403, data: { message: 'Forbidden' } }, message: 'Request failed' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['create', 'edit'] });
    expect(info.hint).toMatch(/Create, Edit/);
  });

  it('composes message with axios when api body is whitespace-only', () => {
    const err = {
      response: { status: 400, data: { message: '   ' } },
      message: 'Request failed with status code 400',
    };
    const info = buildZephyrErrorInfo(err, { permissionCategories: [] });
    expect(info.message).toMatch(/HTTP 400/);
    expect(info.message).toMatch(/Request failed with status code 400/);
  });

  it('classifies unknown when no status and no permission text', () => {
    const info = buildZephyrErrorInfo(new Error('network reset'), { permissionCategories: ['edit'] });
    expect(info.kind).toBe('unknown');
    expect(info.permissionIssueLikely).toBe(false);
  });

  it('classifies permission_denied from body text when HTTP status is omitted', () => {
    const err = { response: { data: { message: 'permission denied for this user' } }, message: 'fail' };
    const info = buildZephyrErrorInfo(err, { permissionCategories: ['delete'] });
    expect(info.kind).toBe('permission_denied');
    expect(info.permissionIssueLikely).toBe(true);
    expect(info.relevantPermissionCategories).toEqual(['delete']);
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

  it('falls back to axios message when no body', () => {
    expect(formatZephyrApiError({ message: 'oops' })).toBe('oops');
  });
});
