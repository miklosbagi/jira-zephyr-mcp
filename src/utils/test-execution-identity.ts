/**
 * Normalize execution payloads from GET /testexecutions (and variants) — shape differs by tenant.
 * @see https://github.com/miklosbagi/jira-zephyr-mcp/issues/67
 */

export function getExecutionTestCaseKey(ex: Record<string, unknown>): string | undefined {
  const tc = ex.testCase as { key?: string } | undefined;
  if (tc?.key && typeof tc.key === 'string') return tc.key;
  if (typeof ex.testCaseKey === 'string') return ex.testCaseKey;
  return undefined;
}

/** Test case entity id (not the execution id). */
export function getExecutionTestCaseEntityId(ex: Record<string, unknown>): string | number | undefined {
  const tid = ex.testCaseId;
  if (tid != null && tid !== '') return tid as string | number;
  const tc = ex.testCase as { id?: number | string } | undefined;
  if (tc?.id != null && tc.id !== '') return tc.id;
  return undefined;
}

export function normalizeZephyrIssueKey(key: string): string {
  return key.trim().toUpperCase();
}

/** Match filter for remove_test_case_from_cycle: key (case-insensitive) or numeric test case id. */
export function executionMatchesTestCaseFilter(ex: Record<string, unknown>, wanted: string): boolean {
  const w = wanted.trim();
  if (!w) return false;
  const key = getExecutionTestCaseKey(ex);
  if (key && normalizeZephyrIssueKey(key) === normalizeZephyrIssueKey(w)) return true;
  const entityId = getExecutionTestCaseEntityId(ex);
  if (entityId != null && String(entityId) === w) return true;
  return false;
}
