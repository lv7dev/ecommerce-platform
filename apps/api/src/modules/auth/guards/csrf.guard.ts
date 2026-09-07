import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthCookieService } from '../services/auth-cookie.service';
import { CsrfTokenService } from '../services/csrf-token.service';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly authCookieService: AuthCookieService,
    private readonly csrfTokenService: CsrfTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (safeMethods.has(request.method.toUpperCase())) {
      return true;
    }

    if (this.isBearerOnlyRequest(request)) {
      return true;
    }

    const cookieToken = this.authCookieService.getCsrfToken(request);
    const headerToken = this.getCsrfHeaderToken(request);

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('Missing CSRF token');
    }

    if (cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    this.csrfTokenService.verifyToken(headerToken);

    return true;
  }

  private getCsrfHeaderToken(request: Request): string | undefined {
    const headerValue =
      request.headers[this.authCookieService.getCsrfHeaderName()];

    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }

    return headerValue;
  }

  private isBearerOnlyRequest(request: Request): boolean {
    return (
      Boolean(request.headers.authorization?.startsWith('Bearer ')) &&
      !this.authCookieService.getAccessToken(request) &&
      !this.authCookieService.getRefreshToken(request)
    );
  }
}
