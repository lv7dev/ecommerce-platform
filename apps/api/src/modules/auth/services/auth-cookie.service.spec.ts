import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { EnvironmentVariables } from '../../../config/env.validation';
import { AuthCookieService } from './auth-cookie.service';
import { AuthTokenEntity } from '../entities/auth-token.entity';

describe('AuthCookieService', () => {
  let service: AuthCookieService;

  const config = {
    get: jest.fn((key: keyof EnvironmentVariables) => {
      const values: Partial<EnvironmentVariables> = {
        AUTH_ACCESS_COOKIE_NAME: 'ep_access_token',
        AUTH_CSRF_COOKIE_NAME: 'ep_csrf_token',
        AUTH_CSRF_HEADER_NAME: 'x-csrf-token',
        AUTH_COOKIE_DOMAIN: undefined,
        AUTH_COOKIE_SAMESITE: 'lax',
        AUTH_COOKIE_SECURE: false,
        AUTH_REFRESH_COOKIE_NAME: 'ep_refresh_token',
        CSRF_TOKEN_TTL_SECONDS: 86_400,
        JWT_REFRESH_TOKEN_TTL_SECONDS: 2_592_000,
      };

      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCookieService,
        {
          provide: ConfigService,
          useValue: config,
        },
      ],
    }).compile();

    service = module.get(AuthCookieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sets httpOnly access and refresh cookies', () => {
    const cookieMock = jest.fn();
    const response = {
      cookie: cookieMock,
    } as unknown as Response;
    const authTokens: AuthTokenEntity = {
      accessToken: 'access-token',
      expiresIn: 900,
      refreshToken: 'refresh-token',
      user: {
        createdAt: '2026-09-06T00:00:00.000Z',
        email: 'customer@example.com',
        emailVerifiedAt: null,
        id: 'user-id',
        lastLoginAt: null,
        name: 'Customer',
        permissions: [],
        roles: [],
        status: 'ACTIVE',
        updatedAt: '2026-09-06T00:00:00.000Z',
      },
    };

    service.setAuthCookies(response, authTokens);

    expect(cookieMock).toHaveBeenCalledWith('ep_access_token', 'access-token', {
      domain: undefined,
      httpOnly: true,
      maxAge: 900_000,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
    expect(cookieMock).toHaveBeenCalledWith(
      'ep_refresh_token',
      'refresh-token',
      {
        domain: undefined,
        httpOnly: true,
        maxAge: 2_592_000_000,
        path: '/',
        sameSite: 'lax',
        secure: false,
      },
    );
  });

  it('clears access and refresh cookies', () => {
    const clearCookieMock = jest.fn();
    const response = {
      clearCookie: clearCookieMock,
    } as unknown as Response;

    service.clearAuthCookies(response);

    expect(clearCookieMock).toHaveBeenCalledWith('ep_access_token', {
      domain: undefined,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
    expect(clearCookieMock).toHaveBeenCalledWith('ep_refresh_token', {
      domain: undefined,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('sets a JavaScript-readable CSRF cookie', () => {
    const cookieMock = jest.fn();
    const response = {
      cookie: cookieMock,
    } as unknown as Response;

    service.setCsrfCookie(response, { token: 'csrf-token' });

    expect(cookieMock).toHaveBeenCalledWith('ep_csrf_token', 'csrf-token', {
      domain: undefined,
      httpOnly: false,
      maxAge: 86_400_000,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('clears the CSRF cookie with matching cookie options', () => {
    const clearCookieMock = jest.fn();
    const response = {
      clearCookie: clearCookieMock,
    } as unknown as Response;

    service.clearCsrfCookie(response);

    expect(clearCookieMock).toHaveBeenCalledWith('ep_csrf_token', {
      domain: undefined,
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });
});
