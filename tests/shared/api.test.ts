jest.mock('@/src/shared/config/runtime-config', () => ({
  runtimeConfig: { apiBaseUrl: 'http://test.local' },
}));

import { apiRequest, ApiError } from '@/src/shared/services/api';

const mockFetch = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = mockFetch;

function jsonResponse(status: number, body: unknown, ok = status < 400) {
  return { ok, status, json: async () => body };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('apiRequest', () => {
  it('unwraps the data envelope on success', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { data: { id: '1' }, meta: null, error: null }));

    const result = await apiRequest<{ id: string }>('/v1/inventory', { method: 'GET' });

    expect(result).toEqual({ id: '1' });
    expect(mockFetch).toHaveBeenCalledWith('http://test.local/v1/inventory', expect.any(Object));
  });

  it('sends Authorization and content-type headers when a token is provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { data: {}, meta: null, error: null }));

    await apiRequest('/v1/inventory', { method: 'GET', token: 'tok-123' });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-123');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('omits the Authorization header when no token is provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { data: {}, meta: null, error: null }));

    await apiRequest('/v1/inventory', { method: 'GET' });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('forwards method and body to fetch', async () => {
    mockFetch.mockResolvedValue(jsonResponse(201, { data: {}, meta: null, error: null }));

    await apiRequest('/v1/market/listings', { method: 'POST', body: '{"price_idr":1000}' });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('http://test.local/v1/market/listings');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"price_idr":1000}');
  });

  it('throws ApiError carrying the server error code', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(409, { data: null, meta: null, error: { code: 'INVALID_LISTING_STATUS', message: 'nope' } }),
    );

    await expect(apiRequest('/v1/market/listings/x/orders', { method: 'POST' })).rejects.toMatchObject({
      code: 'INVALID_LISTING_STATUS',
      message: 'nope',
      status: 409,
    });
  });

  it('throws a generic HTTP_ERROR when the response is not ok and carries no error envelope', async () => {
    mockFetch.mockResolvedValue(jsonResponse(500, { data: null, meta: null, error: null }, false));

    await expect(apiRequest('/v1/inventory', { method: 'GET' })).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest('/v1/inventory', { method: 'GET' })).rejects.toMatchObject({ code: 'HTTP_ERROR' });
  });
});
