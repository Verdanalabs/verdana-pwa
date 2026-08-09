import { runtimeConfig } from '@/src/shared/config/runtime-config';

const BASE_URL = runtimeConfig.apiBaseUrl;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Request and response bodies carry operator emails, site coordinates and
  // batch records. Both builds are public web apps, so this stays out of the
  // production console.
  if (__DEV__) {
    console.log(`[API] ${options.method ?? 'GET'} ${path}`, rest.body ?? '');
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  let json;
  try {
    json = await res.json();
  } catch {
    // A gateway or tunnel error returns HTML, not the envelope. Surface it as
    // an ApiError so callers keep their single catch path instead of taking a
    // raw SyntaxError.
    throw new ApiError('INVALID_RESPONSE', `Server returned a non-JSON response (${res.status})`, res.status);
  }

  if (__DEV__) {
    console.log(`[API] ${res.status} ${path}`, JSON.stringify(json));
  }

  if (json.error) {
    throw new ApiError(json.error.code, json.error.message, res.status);
  }

  if (!res.ok) {
    throw new ApiError('HTTP_ERROR', `Request failed with status ${res.status}`, res.status);
  }

  return json.data as T;
}
