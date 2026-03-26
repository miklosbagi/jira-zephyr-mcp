/**
 * Config helpers that do not require full app bootstrap, plus TM4J URL derivation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config helpers', () => {
  const base = {
    JIRA_BASE_URL: 'https://x.atlassian.net',
    JIRA_USERNAME: 'u@x.com',
    JIRA_API_TOKEN: 'j',
    ZEPHYR_API_TOKEN: 'z',
  };

  beforeEach(() => {
    vi.resetModules();
    for (const k of Object.keys(process.env)) {
      if (k.startsWith('JIRA_') || k.startsWith('ZEPHYR')) delete process.env[k];
    }
    Object.assign(process.env, base);
  });

  afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (k.startsWith('JIRA_') || k.startsWith('ZEPHYR')) delete process.env[k];
    }
  });

  it('getTm4jProjectId returns integer when set', async () => {
    process.env.ZEPHYR_TM4J_PROJECT_ID = '42';
    const { getTm4jProjectId } = await import('../src/utils/config.js');
    expect(getTm4jProjectId()).toBe(42);
  });

  it('getTm4jProjectId returns undefined when unset or empty', async () => {
    const { getTm4jProjectId } = await import('../src/utils/config.js');
    expect(getTm4jProjectId()).toBeUndefined();
    process.env.ZEPHYR_TM4J_PROJECT_ID = '';
    expect(getTm4jProjectId()).toBeUndefined();
  });

  it('getTm4jProjectId returns undefined for non-integer', async () => {
    process.env.ZEPHYR_TM4J_PROJECT_ID = '3.5';
    const { getTm4jProjectId } = await import('../src/utils/config.js');
    expect(getTm4jProjectId()).toBeUndefined();
  });

  it('getTm4jBackendBaseUrl maps api.zephyrscale host to app.tm4j', async () => {
    process.env.ZEPHYR_BASE_URL = 'https://api.zephyrscale.smartbear.com/v2';
    const { getTm4jBackendBaseUrl } = await import('../src/utils/config.js');
    expect(getTm4jBackendBaseUrl()).toBe('https://app.tm4j.smartbear.com/backend/rest/tests/2.0');
  });

});
