/**
 * Contract tests: run against real Zephyr API.
 *
 * Required env (for CI: set as repo secrets; local: .env):
 *   - ZEPHYR_BASE_URL (e.g. https://eu.api.zephyrscale.smartbear.com/v2)
 *   - ZEPHYR_API_TOKEN
 *   - JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN (client validates config)
 *
 * Optional (required for testplans/testcycles list tests; no default):
 *   - ZEPHYR_CONTRACT_PROJECT_KEY (your Jira project key, e.g. MYPROJ)
 *   - ZEPHYR_CONTRACT_PLAN_KEY (e.g. MYPROJ-P1)
 *   - ZEPHYR_CONTRACT_CYCLE_KEY (e.g. MYPROJ-R1)
 *
 * Run: npm run test:contract (contract only) | npm run test (all) | npm run test:integration (integration mocked only)
 *
 * If JIRA and Zephyr credentials are not set, the whole suite is skipped so `npm test` still passes locally.
 */
import { config } from 'dotenv';
import { describe, it, expect, beforeAll } from 'vitest';
import { ZephyrClient } from '../../src/clients/zephyr-client.js';

config();

const hasContractCredentials =
  Boolean(process.env.ZEPHYR_API_TOKEN?.trim()) &&
  Boolean(process.env.JIRA_BASE_URL?.trim()) &&
  Boolean(process.env.JIRA_USERNAME?.trim()) &&
  Boolean(process.env.JIRA_API_TOKEN?.trim());

describe.skipIf(!hasContractCredentials)('Zephyr API contract', () => {
  let client: ZephyrClient;

  beforeAll(() => {
    client = new ZephyrClient();
  });

  it('GET /projects returns array-like list with id and key', async () => {
    const result = await client.getProjects(10, 0);
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.projects)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
    for (const p of result.projects) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('key');
      expect(typeof p.id).toBe('number');
      expect(typeof p.key).toBe('string');
    }
  });

  it.skipIf(!process.env.ZEPHYR_CONTRACT_PROJECT_KEY)(
    'GET /testplans with projectKey returns list with total',
    async () => {
      const projectKey = process.env.ZEPHYR_CONTRACT_PROJECT_KEY!;
      const result = await client.getTestPlans(projectKey, 10, 0);
      expect(result).toHaveProperty('testPlans');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.testPlans)).toBe(true);
      if (result.testPlans.length > 0) {
        const plan = result.testPlans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('key');
        expect(plan).toHaveProperty('name');
      }
    }
  );

  it.skipIf(!process.env.ZEPHYR_CONTRACT_PROJECT_KEY)(
    'GET /testcycles with projectKey returns list with executionSummary',
    async () => {
      const projectKey = process.env.ZEPHYR_CONTRACT_PROJECT_KEY!;
      const result = await client.getTestCycles(projectKey, undefined, 10);
      expect(result).toHaveProperty('testCycles');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.testCycles)).toBe(true);
      if (result.testCycles.length > 0) {
        const cycle = result.testCycles[0];
        expect(cycle).toHaveProperty('id');
        expect(cycle).toHaveProperty('key');
        expect(cycle).toHaveProperty('name');
        if ('executionSummary' in cycle && cycle.executionSummary != null) {
          expect(cycle.executionSummary).toHaveProperty('total');
        }
      }
    }
  );

  it.skipIf(!process.env.ZEPHYR_CONTRACT_PLAN_KEY)(
    'GET /testplans/{key} returns single plan when key exists',
    async () => {
      const planKey = process.env.ZEPHYR_CONTRACT_PLAN_KEY!;
      const result = await client.getTestPlan(planKey);
      expect(result).toHaveProperty('key', planKey);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    }
  );

  it.skipIf(!process.env.ZEPHYR_CONTRACT_CYCLE_KEY)(
    'GET /testcycles/{key} returns single cycle when key exists',
    async () => {
      const cycleKey = process.env.ZEPHYR_CONTRACT_CYCLE_KEY!;
      const result = await client.getTestCycle(cycleKey);
      expect(result).toHaveProperty('key', cycleKey);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      // Single-cycle GET may omit executionSummary; list responses often include it.
      if ('executionSummary' in result && result.executionSummary != null) {
        expect(result.executionSummary).toHaveProperty('total');
      }
    }
  );

  it.skipIf(!process.env.ZEPHYR_CONTRACT_PROJECT_KEY)(
    'GET /environments with projectKey returns list with total',
    async () => {
      const projectKey = process.env.ZEPHYR_CONTRACT_PROJECT_KEY!;
      const result = await client.getEnvironments(projectKey, 20, 0);
      expect(result).toHaveProperty('environments');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.environments)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      for (const env of result.environments) {
        expect(env).toHaveProperty('id');
        expect(env).toHaveProperty('name');
      }
    }
  );
});
