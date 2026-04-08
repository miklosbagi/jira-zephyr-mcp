/**
 * Structured Zephyr (and shared axios) errors for MCP clients: HTTP status, classification,
 * and Zephyr Scale permission buckets (Create, Edit, Archive, Manage Folders, Create Versions, Delete).
 */

/** Aligns with Zephyr Scale project permission names in Jira (approximate UI labels). */
export type ZephyrPermissionCategory =
  | 'create'
  | 'edit'
  | 'archive'
  | 'manage_folders'
  | 'create_versions'
  | 'delete';

export type ZephyrErrorKind =
  | 'authentication'
  | 'permission_denied'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'rate_limit'
  | 'server_error'
  | 'unknown';

export interface ZephyrErrorInfo {
  /** Primary line for display (includes `HTTP <status>` when status is known). */
  message: string;
  httpStatus?: number;
  kind: ZephyrErrorKind;
  /** True when status/text suggests missing auth or project/Zephyr permissions. */
  permissionIssueLikely: boolean;
  /** Zephyr permission buckets that match this MCP tool; empty if unknown or read-only failure. */
  relevantPermissionCategories: ZephyrPermissionCategory[];
  /** Substring from API body when present. */
  apiMessage?: string;
  /** Short guidance for admins or token checks. */
  hint?: string;
  /** Set when the failing call was Jira REST (e.g. issue lookup) rather than Zephyr. */
  integration?: 'zephyr' | 'jira';
}

const PERMISSIONish =
  /permission|forbidden|not authorized|access denied|insufficient|not allowed to|do not have access|you don't have|you do not have/i;

const CATEGORY_LABEL: Record<ZephyrPermissionCategory, string> = {
  create: 'Create',
  edit: 'Edit',
  archive: 'Archive',
  manage_folders: 'Manage Folders',
  create_versions: 'Create Versions',
  delete: 'Delete',
};

function classifyKind(
  status: number | undefined,
  apiMessage: string,
  axiosMessage: string
): ZephyrErrorKind {
  const text = `${apiMessage} ${axiosMessage}`;
  if (status === 401) return 'authentication';
  if (status === 403) return 'permission_denied';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limit';
  if (status === 400 || status === 422) return 'validation';
  if (status != null && status >= 500) return 'server_error';
  if (PERMISSIONish.test(text)) return 'permission_denied';
  return 'unknown';
}

function permissionLikely(kind: ZephyrErrorKind, apiMessage: string, axiosMessage: string): boolean {
  if (kind === 'authentication' || kind === 'permission_denied') return true;
  const text = `${apiMessage} ${axiosMessage}`;
  return PERMISSIONish.test(text);
}

/** Parse common REST error body shapes (Zephyr Scale, Jira Cloud). */
export function parseApiMessageFromBody(data: unknown): string | undefined {
  if (data == null) return undefined;
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (Array.isArray(o.errorMessages) && o.errorMessages.length > 0 && typeof o.errorMessages[0] === 'string') {
      return o.errorMessages[0];
    }
    if (typeof o.error === 'string') return o.error;
    if (typeof o.errorMessage === 'string') return o.errorMessage;
    if (typeof o.detail === 'string') return o.detail;
    if (typeof o.title === 'string') return o.title;
    try {
      return JSON.stringify(data);
    } catch {
      return undefined;
    }
  }
  return undefined;
}


export function extractZephyrMessages(error: unknown): {
  status?: number;
  apiMessage?: string;
  axiosMessage: string;
} {
  if (error == null) return { axiosMessage: 'Unknown error' };
  if (typeof error !== 'object') return { axiosMessage: String(error) };
  const e = error as { message?: string; response?: { status?: number; data?: unknown } };
  const axiosMessage = e.message ?? String(error);
  const r = e.response;
  if (r == null) return { axiosMessage };
  const status = r.status;
  const apiMessage = parseApiMessageFromBody(r.data);
  return { status, apiMessage, axiosMessage };
}

function buildHint(
  kind: ZephyrErrorKind,
  permissionLikelyFlag: boolean,
  categories: ZephyrPermissionCategory[],
  integration: 'zephyr' | 'jira'
): string | undefined {
  if (kind === 'authentication') {
    return integration === 'zephyr'
      ? 'Check ZEPHYR_API_TOKEN and ZEPHYR_BASE_URL (e.g. EU vs US).'
      : 'Check JIRA_BASE_URL, JIRA_USERNAME, and JIRA_API_TOKEN.';
  }
  if (!permissionLikelyFlag) {
    if (kind === 'not_found') return 'The resource may not exist, or the id/key may be wrong for this project.';
    if (kind === 'validation') return 'Fix the request payload or required fields and retry.';
    return undefined;
  }
  if (categories.length > 0) {
    const labels = categories.map((c) => CATEGORY_LABEL[c]).join(', ');
    return `This action may require Zephyr Scale permissions such as: ${labels}. A Jira admin can adjust them under Project settings → Apps → Zephyr Scale (wording varies by version).`;
  }
  if (integration === 'zephyr') {
    return 'You may lack access to this project or operation in Zephyr Scale; ask a Jira admin to review Zephyr project permissions.';
  }
  return 'You may lack access to this issue or project in Jira; ask a Jira admin to review project permissions.';
}

function composeMessage(status: number | undefined, apiMessage: string | undefined, axiosMessage: string): string {
  const detail = (apiMessage && apiMessage.trim()) || axiosMessage;
  if (status != null) return `HTTP ${status}: ${detail}`;
  return detail;
}

export interface BuildZephyrErrorInfoOptions {
  permissionCategories: ZephyrPermissionCategory[];
  integration?: 'zephyr' | 'jira';
}

/**
 * Builds a structured error for MCP JSON responses. Pass the Zephyr permission buckets
 * that this tool maps to (see SmartBear’s project permission matrix).
 */
export function buildZephyrErrorInfo(error: unknown, options: BuildZephyrErrorInfoOptions): ZephyrErrorInfo {
  const integration = options.integration ?? 'zephyr';
  const { status, apiMessage, axiosMessage } = extractZephyrMessages(error);
  const kind = classifyKind(status, apiMessage ?? '', axiosMessage);
  const perm = permissionLikely(kind, apiMessage ?? '', axiosMessage);
  const categories =
    perm && kind !== 'authentication'
      ? [...options.permissionCategories]
      : perm && kind === 'authentication'
        ? []
        : [];

  const message = composeMessage(status, apiMessage, axiosMessage);

  return {
    message,
    httpStatus: status,
    kind,
    permissionIssueLikely: perm,
    relevantPermissionCategories: categories,
    apiMessage: apiMessage || undefined,
    hint: buildHint(kind, perm, categories, integration),
    integration,
  };
}

/** Failure payload returned by Zephyr MCP tools (adds structured `errorInfo` for agents). */
export function zephyrToolFailure(
  error: unknown,
  options: BuildZephyrErrorInfoOptions
): { success: false; error: string; errorInfo: ZephyrErrorInfo } {
  const errorInfo = buildZephyrErrorInfo(error, options);
  return { success: false, error: errorInfo.message, errorInfo };
}

/** Legacy string extraction (no HTTP prefix) — used where only a short message is needed. */
export function formatZephyrApiError(error: unknown): string {
  const { apiMessage, axiosMessage } = extractZephyrMessages(error);
  return apiMessage || axiosMessage;
}
