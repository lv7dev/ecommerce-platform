import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthCookieService } from '../services/auth-cookie.service';
import { CsrfTokenService } from '../services/csrf-token.service';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  const getAccessToken = jest.fn();
  const getCsrfHeaderName = jest.fn(() => 'x-csrf-token');
  const getCsrfToken = jest.fn();
  const getRefreshToken = jest.fn();
  const verifyToken = jest.fn();
  const authCookieService = {
    getAccessToken,
    getCsrfHeaderName,
    getCsrfToken,
    getRefreshToken,
  } as unknown as jest.Mocked<AuthCookieService>;
  const csrfTokenService = {
    verifyToken,
  } as unknown as jest.Mocked<CsrfTokenService>;
  let guard: CsrfGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockReturnValue(undefined);
    getCsrfHeaderName.mockReturnValue('x-csrf-token');
    getCsrfToken.mockReturnValue(undefined);
    getRefreshToken.mockReturnValue(undefined);
    guard = new CsrfGuard(authCookieService, csrfTokenService);
  });

  it('allows safe requests without CSRF tokens', () => {
    expect(guard.canActivate(createContext({ method: 'GET' }))).toBe(true);

    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('allows bearer-only requests without CSRF tokens', () => {
    getAccessToken.mockReturnValue(undefined);
    getRefreshToken.mockReturnValue(undefined);

    expect(
      guard.canActivate(
        createContext({
          headers: {
            authorization: 'Bearer access-token',
          },
          method: 'POST',
        }),
      ),
    ).toBe(true);
  });

  it('rejects unsafe requests without matching cookie and header tokens', () => {
    getCsrfToken.mockReturnValue('cookie-token');

    expect(() =>
      guard.canActivate(
        createContext({
          headers: {
            'x-csrf-token': 'header-token',
          },
          method: 'POST',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('verifies matching tokens on unsafe requests', () => {
    getCsrfToken.mockReturnValue('csrf-token');

    expect(
      guard.canActivate(
        createContext({
          headers: {
            'x-csrf-token': 'csrf-token',
          },
          method: 'POST',
        }),
      ),
    ).toBe(true);

    expect(verifyToken).toHaveBeenCalledWith('csrf-token');
  });
});

function createContext(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        method: 'GET',
        ...request,
      }),
    }),
  } as ExecutionContext;
}
