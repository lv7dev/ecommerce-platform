import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthCookieService } from '../services/auth-cookie.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token =
      this.authCookieService.getAccessToken(request) ??
      this.extractAuthorizationBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const payload = this.jwtTokenService.verifyAccessToken(token);

    request.user = await this.authService.getAuthenticatedUser({
      sub: payload.sub,
      sessionId: payload.sessionId,
    });

    return true;
  }

  private extractAuthorizationBearerToken(
    authorization?: string,
  ): string | undefined {
    const [type, token] = authorization?.split(' ') ?? [];

    if (!type && !token) {
      return undefined;
    }

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    return token;
  }
}
