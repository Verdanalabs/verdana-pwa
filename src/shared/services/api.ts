const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

  console.log(`[API] ${options.method ?? 'GET'} ${path}`, rest.body ?? '');

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  const json = await res.json();

  console.log(`[API] ${res.status} ${path}`, JSON.stringify(json));

  if (json.error) {
    throw new ApiError(json.error.code, json.error.message, res.status);
  }

  if (!res.ok) {
    throw new ApiError('HTTP_ERROR', `Request failed with status ${res.status}`, res.status);
  }

  return json.data as T;
}
