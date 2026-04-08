/** Best-effort message from Zephyr/axios errors (message, JSON body, or stringified payload). */
export function formatZephyrApiError(error: unknown): string {
  if (error == null) return 'Unknown error';
  if (typeof error !== 'object') return String(error);
  const e = error as { message?: string; response?: { data?: unknown } };
  const d = e.response?.data;
  if (d == null) return e.message || String(error);
  if (typeof d === 'string') return d;
  if (typeof d === 'object' && d !== null && 'message' in d && typeof (d as { message: unknown }).message === 'string') {
    return (d as { message: string }).message;
  }
  try {
    return JSON.stringify(d);
  } catch {
    return e.message || 'Unknown error';
  }
}
