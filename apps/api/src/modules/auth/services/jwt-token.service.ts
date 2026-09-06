import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { EnvironmentVariables } from '../../../config/env.validation';

type TokenType = 'access';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
}

interface JwtPayload extends AccessTokenPayload {
  type: TokenType;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  signAccessToken(payload: AccessTokenPayload): {
    accessToken: string;
    expiresIn: number;
  } {
    const expiresIn = this.configService.get('JWT_ACCESS_TOKEN_TTL_SECONDS', {
      infer: true,
    });
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload: JwtPayload = {
      ...payload,
      type: 'access',
      iat: now,
      exp: now + expiresIn,
    };

    return {
      accessToken: this.sign(jwtPayload),
      expiresIn,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    const payload = this.verify(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  }

  private sign(payload: JwtPayload): string {
    const encodedHeader = this.encode({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = this.encode(payload);
    const signature = this.signSegments(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verify(token: string): JwtPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.signSegments(encodedHeader, encodedPayload);

    if (!this.safeEqual(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = this.decode<JwtPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp <= now) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  private signSegments(encodedHeader: string, encodedPayload: string): string {
    return createHmac('sha256', this.getSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
  }

  private getSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true });
  }

  private encode(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decode<T>(value: string): T {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
