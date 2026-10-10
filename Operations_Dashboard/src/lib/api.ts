import type { FieldIssue } from '@/types/api';
import { navigateWithNewSession } from './navigation';

const LOGIN_PATH = '/login';
const LOGOUT_ENDPOINT = '/api/auth/staff/logout';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level messages from a 400 VALIDATION_ERROR, keyed by field name. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    const errors: Record<string, string> = {};
    for (const issue of this.details as FieldIssue[]) {
      if (issue?.field && !errors[issue.field]) errors[issue.field] = issue.message;
    }
    return errors;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

/** A stale cookie must be cleared before redirecting, or proxy.ts would bounce us back. */
async function handleUnauthorized(path: string): Promise<void> {
  if (typeof window === 'undefined' || path.startsWith('/auth/')) return;
  await fetch(LOGOUT_ENDPOINT, { method: 'POST' }).catch(() => undefined);
  navigateWithNewSession(`${LOGIN_PATH}?next=${encodeURIComponent(window.location.pathname)}`);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** Calls the backend through this app's `/api` rewrite and unwraps the `{ success, data }` envelope. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  const response = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
    signal: options.signal,
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (response.ok && payload?.success) return payload.data as T;

  if (response.status === 401) await handleUnauthorized(path);
  throw new ApiError(
    response.status,
    payload?.error?.code ?? 'NETWORK_ERROR',
    payload?.error?.message ?? 'Could not reach the server. Please try again.',
    payload?.error?.details,
  );
}

export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
