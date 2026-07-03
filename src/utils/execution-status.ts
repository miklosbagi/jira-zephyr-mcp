/**
 * Normalize Zephyr Scale execution status from API payloads.
 * GET responses use `testExecutionStatus` (StatusLink); writes use `statusName` UI labels.
 */

export type ExecutionStatusCode = 'PASS' | 'FAIL' | 'WIP' | 'BLOCKED' | 'NOT_EXECUTED';

const STATUS_NAME_TO_CODE: Record<string, ExecutionStatusCode> = {
  pass: 'PASS',
  fail: 'FAIL',
  'in progress': 'WIP',
  blocked: 'BLOCKED',
  'not executed': 'NOT_EXECUTED',
};

export function executionStatusNameToCode(name: string): ExecutionStatusCode | undefined {
  const key = name.trim().toLowerCase();
  return STATUS_NAME_TO_CODE[key];
}

export function executionStatusTokenToCode(token: string): ExecutionStatusCode | undefined {
  const upper = token.trim().toUpperCase();
  if (upper === 'PASS' || upper === 'FAIL' || upper === 'WIP' || upper === 'BLOCKED' || upper === 'NOT_EXECUTED') {
    return upper;
  }
  return executionStatusNameToCode(token);
}

export function getExecutionProjectKey(ex: Record<string, unknown>): string | undefined {
  const project = ex.project as { key?: string } | undefined;
  if (project?.key && typeof project.key === 'string') return project.key;
  if (typeof ex.projectKey === 'string' && ex.projectKey.trim()) return ex.projectKey;
  return undefined;
}

/** Human-readable status label from a raw execution row (API or legacy mock). */
export function getExecutionStatusNameFromRow(
  ex: Record<string, unknown>,
  statusNameById?: Map<number, string>
): string | undefined {
  if (typeof ex.statusName === 'string' && ex.statusName.trim()) {
    return ex.statusName.trim();
  }

  const tes = ex.testExecutionStatus as { id?: number; name?: string } | string | undefined;
  if (typeof tes === 'string' && tes.trim()) return tes.trim();
  if (tes && typeof tes === 'object') {
    if (typeof tes.name === 'string' && tes.name.trim()) return tes.name.trim();
    if (tes.id != null && statusNameById?.has(Number(tes.id))) {
      return statusNameById.get(Number(tes.id));
    }
  }

  if (typeof ex.status === 'string' && ex.status.trim()) {
    const code = executionStatusTokenToCode(ex.status);
    if (code) return code;
    return ex.status.trim();
  }

  return undefined;
}

/** MCP-normalized status code for aggregation and execute_test symmetry. */
export function getExecutionStatusCodeFromRow(
  ex: Record<string, unknown>,
  statusNameById?: Map<number, string>
): ExecutionStatusCode | undefined {
  const name = getExecutionStatusNameFromRow(ex, statusNameById);
  if (name) {
    const fromName = executionStatusNameToCode(name);
    if (fromName) return fromName;
    const fromToken = executionStatusTokenToCode(name);
    if (fromToken) return fromToken;
  }
  return undefined;
}

export function summarizeExecutionStatusCode(
  code: ExecutionStatusCode | undefined
): 'passed' | 'failed' | 'blocked' | 'inProgress' | 'notExecuted' {
  switch (code) {
    case 'PASS':
      return 'passed';
    case 'FAIL':
      return 'failed';
    case 'BLOCKED':
      return 'blocked';
    case 'WIP':
      return 'inProgress';
    default:
      return 'notExecuted';
  }
}
