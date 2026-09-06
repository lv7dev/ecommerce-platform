import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { EnvironmentVariables } from '../../config/env.validation';
import { AuthTokenEntity } from './entities/auth-token.entity';

@Injectable()
export class AuthCookieService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  getAccessToken(request: Request): string | undefined {
    return this.getCookie(request, this.getAccessCookieName());
  }

  getRefreshToken(request: Request): string | undefined {
    return this.getCookie(request, this.getRefreshCookieName());
  }

  setAuthCookies(response: Response, authTokens: AuthTokenEntity): void {
    response.cookie(this.getAccessCookieName(), authTokens.accessToken, {
      ...this.getSharedCookieOptions(),
      maxAge: authTokens.expiresIn * 1000,
    });

    response.cookie(this.getRefreshCookieName(), authTokens.refreshToken, {
      ...this.getSharedCookieOptions(),
      maxAge:
        this.configService.get('JWT_REFRESH_TOKEN_TTL_SECONDS', {
          infer: true,
        }) * 1000,
    });
  }

  clearAuthCookies(response: Response): void {
    response.clearCookie(
      this.getAccessCookieName(),
      this.getClearCookieOptions(),
    );
    response.clearCookie(
      this.getRefreshCookieName(),
      this.getClearCookieOptions(),
    );
  }

  private getCookie(request: Request, name: string): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;

    return cookies?.[name];
  }

  private getAccessCookieName(): string {
    return this.configService.get('AUTH_ACCESS_COOKIE_NAME', { infer: true });
  }

  private getRefreshCookieName(): string {
    return this.configService.get('AUTH_REFRESH_COOKIE_NAME', { infer: true });
  }

  private getSharedCookieOptions(): CookieOptions {
    return {
      domain: this.configService.get('AUTH_COOKIE_DOMAIN', { infer: true }),
      httpOnly: true,
      path: '/',
      sameSite: this.configService.get('AUTH_COOKIE_SAMESITE', {
        infer: true,
      }),
      secure: this.configService.get('AUTH_COOKIE_SECURE', { infer: true }),
    };
  }

  private getClearCookieOptions(): CookieOptions {
    return this.getSharedCookieOptions();
  }
}
