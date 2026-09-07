import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('api client CSRF handling', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('attaches a server-issued CSRF token to unsafe requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            csrfToken: 'csrf-token',
            expiresAt: '2099-01-01T00:00:00.000Z',
            headerName: 'x-csrf-token',
          },
          success: true,
          timestamp: '2026-09-07T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { ok: true },
          success: true,
          timestamp: '2026-09-07T00:00:00.000Z',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { apiRequest } = await import('./client');

    await expect(
      apiRequest('/auth/login', {
        body: {
          email: 'customer@example.com',
          password: 'password',
        },
        method: 'POST',
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0].toString()).toBe('http://localhost:4000/api/auth/csrf');
    expect(fetchMock.mock.calls[1][0].toString()).toBe('http://localhost:4000/api/auth/login');
    expect((fetchMock.mock.calls[1][1]?.headers as Headers).get('x-csrf-token')).toBe('csrf-token');
  });

  it('refreshes the CSRF token and retries once when the server rejects a stale token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            csrfToken: 'stale-csrf-token',
            expiresAt: '2099-01-01T00:00:00.000Z',
            headerName: 'x-csrf-token',
          },
          success: true,
          timestamp: '2026-09-07T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            message: 'Missing CSRF token',
            success: false,
            timestamp: '2026-09-07T00:00:00.000Z',
          },
          403,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            csrfToken: 'fresh-csrf-token',
            expiresAt: '2099-01-01T00:00:00.000Z',
            headerName: 'x-csrf-token',
          },
          success: true,
          timestamp: '2026-09-07T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: { ok: true },
          success: true,
          timestamp: '2026-09-07T00:00:00.000Z',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { apiRequest } = await import('./client');

    await expect(
      apiRequest('/auth/register', {
        body: {
          email: 'customer@example.com',
          name: 'Customer',
          password: 'password',
        },
        method: 'POST',
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][0].toString()).toBe('http://localhost:4000/api/auth/csrf');
    expect(fetchMock.mock.calls[1][0].toString()).toBe('http://localhost:4000/api/auth/register');
    expect((fetchMock.mock.calls[1][1]?.headers as Headers).get('x-csrf-token')).toBe(
      'stale-csrf-token',
    );
    expect(fetchMock.mock.calls[2][0].toString()).toBe('http://localhost:4000/api/auth/csrf');
    expect(fetchMock.mock.calls[3][0].toString()).toBe('http://localhost:4000/api/auth/register');
    expect((fetchMock.mock.calls[3][1]?.headers as Headers).get('x-csrf-token')).toBe(
      'fresh-csrf-token',
    );
  });
});

function jsonResponse(payload: object, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  });
}
