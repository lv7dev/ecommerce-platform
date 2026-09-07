import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { EnvironmentVariables } from '../../../config/env.validation';

interface CsrfTokenPayload {
  expiresAt: Date;
  token: string;
}

@Injectable()
export class CsrfTokenService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  createToken(): CsrfTokenPayload {
    const issuedAt = Date.now();
    const nonce = randomBytes(32).toString('base64url');
    const payload = `${nonce}.${issuedAt}`;

    return {
      expiresAt: this.getExpiresAt(issuedAt),
      token: `${payload}.${this.sign(payload)}`,
    };
  }

  verifyToken(token: string | undefined): void {
    if (!token) {
      throw new ForbiddenException('Missing CSRF token');
    }

    const [nonce, issuedAtValue, signature] = token.split('.');

    if (!nonce || !issuedAtValue || !signature) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const issuedAt = Number(issuedAtValue);

    if (
      !Number.isInteger(issuedAt) ||
      this.getExpiresAt(issuedAt) <= new Date()
    ) {
      throw new ForbiddenException('Expired CSRF token');
    }

    if (!this.safeEqual(signature, this.sign(`${nonce}.${issuedAt}`))) {
      throw new ForbiddenException('Invalid CSRF token');
    }
  }

  getTtlSeconds(): number {
    return this.configService.get('CSRF_TOKEN_TTL_SECONDS', { infer: true });
  }

  private getExpiresAt(issuedAt: number): Date {
    return new Date(issuedAt + this.getTtlSeconds() * 1000);
  }

  private sign(payload: string): string {
    return createHmac(
      'sha256',
      this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
    )
      .update(payload)
      .digest('base64url');
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
