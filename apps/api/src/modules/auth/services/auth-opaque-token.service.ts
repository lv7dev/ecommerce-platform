import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

@Injectable()
export class AuthOpaqueTokenService {
  createOpaqueToken(): { id: string; token: string } {
    const id = randomUUID();

    return {
      id,
      token: this.buildToken(id),
    };
  }

  createRefreshToken(sessionId: string): string {
    return this.buildToken(sessionId);
  }

  getOpaqueTokenId(token: string): string {
    return this.getTokenId(
      token,
      () => new BadRequestException('Invalid token'),
    );
  }

  getRefreshTokenSessionId(refreshToken: string): string {
    return this.getTokenId(
      refreshToken,
      () => new UnauthorizedException('Invalid refresh token'),
    );
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('base64url');
  }

  verify(token: string, tokenHash: string): boolean {
    const currentHash = Buffer.from(this.hash(token));
    const storedHash = Buffer.from(tokenHash);

    if (currentHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(currentHash, storedHash);
  }

  private buildToken(id: string): string {
    return `${id}.${randomBytes(32).toString('base64url')}`;
  }

  private getTokenId(token: string, createError: () => Error): string {
    const [id, secret] = token.split('.');

    if (!id || !secret) {
      throw createError();
    }

    return id;
  }
}
