import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { EnvironmentVariables } from '../../../config/env.validation';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  UserWithAuthRelations,
  userInclude,
} from '../../user/constants/user.include';
import { toUserEntity } from '../../user/mappers/user.mapper';
import { AuthTokenEntity, LogoutEntity } from '../entities/auth-token.entity';
import { AuthAccountService } from './auth-account.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthOpaqueTokenService } from './auth-opaque-token.service';
import { JwtTokenService } from './jwt-token.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';
import { AuthRequestContext } from '../types/auth-request-context.type';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly authAccountService: AuthAccountService,
    private readonly authAuditService: AuthAuditService,
    private readonly authOpaqueTokenService: AuthOpaqueTokenService,
  ) {}

  async createAuthResponse(
    user: UserWithAuthRelations,
    context: AuthRequestContext,
    emailVerification?: {
      expiresAt: string;
    },
  ): Promise<AuthTokenEntity> {
    this.authAccountService.ensureUserCanAuthenticate(user.status);

    const sessionId = randomUUID();
    const refreshToken =
      this.authOpaqueTokenService.createRefreshToken(sessionId);

    await this.prisma.authSession.create({
      data: {
        expiresAt: this.getRefreshTokenExpiresAt(),
        id: sessionId,
        ipAddress: context.ipAddress,
        refreshTokenHash: this.authOpaqueTokenService.hash(refreshToken),
        userAgent: context.userAgent,
        userId: user.id,
      },
    });

    return {
      ...this.createAccessToken(user, sessionId),
      emailVerification,
      refreshToken,
      user: toUserEntity(user),
    };
  }

  async refresh(
    refreshToken: string | undefined,
    context: AuthRequestContext,
  ): Promise<AuthTokenEntity> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const now = new Date();
    const sessionId =
      this.authOpaqueTokenService.getRefreshTokenSessionId(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: userInclude,
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      !this.authOpaqueTokenService.verify(
        refreshToken,
        session.refreshTokenHash,
      )
    ) {
      await this.revokeSessionForRefreshTokenReuse(
        session.id,
        session.userId,
        context,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.authAccountService.ensureUserCanAuthenticate(session.user.status);

    const nextRefreshToken = this.authOpaqueTokenService.createRefreshToken(
      session.id,
    );
    const nextRefreshTokenHash =
      this.authOpaqueTokenService.hash(nextRefreshToken);
    const nextRefreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    const rotated = await this.prisma.$transaction(async (tx) => {
      const rotation = await tx.authSession.updateMany({
        where: {
          expiresAt: {
            gt: now,
          },
          id: session.id,
          refreshTokenHash: session.refreshTokenHash,
          revokedAt: null,
        },
        data: {
          expiresAt: nextRefreshTokenExpiresAt,
          refreshTokenHash: nextRefreshTokenHash,
        },
      });

      if (rotation.count === 1) {
        return true;
      }

      await tx.authSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return false;
    });

    if (!rotated) {
      await this.authAuditService.create({
        action: 'auth.refresh_token_reuse_detected',
        actorId: session.userId,
        metadata: {
          reason: 'refresh_token_rotation_conflict',
        },
        targetId: session.id,
        targetType: 'AuthSession',
        ...context,
      });

      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      ...this.createAccessToken(session.user, session.id),
      refreshToken: nextRefreshToken,
      user: toUserEntity(session.user),
    };
  }

  async logout(
    refreshToken: string | undefined,
    context: AuthRequestContext,
  ): Promise<LogoutEntity> {
    if (!refreshToken) {
      return { revoked: false };
    }

    const sessionId =
      this.authOpaqueTokenService.getRefreshTokenSessionId(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      !this.authOpaqueTokenService.verify(
        refreshToken,
        session.refreshTokenHash,
      )
    ) {
      return { revoked: false };
    }

    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.authAuditService.create({
      action: 'auth.logout',
      actorId: session.userId,
      targetId: session.id,
      targetType: 'AuthSession',
      ...context,
    });

    return { revoked: true };
  }

  async getAuthenticatedUser(payload: {
    sessionId: string;
    sub: string;
  }): Promise<AuthenticatedUser> {
    const { session, user } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: payload.sub },
        include: userInclude,
      });
      const session = await tx.authSession.findUnique({
        where: { id: payload.sessionId },
      });

      return { session, user };
    });

    if (!user || !session || session.userId !== user.id) {
      throw new UnauthorizedException('Invalid token');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session revoked');
    }

    this.authAccountService.ensureUserCanAuthenticate(user.status);

    const userEntity = toUserEntity(user);

    return {
      email: userEntity.email,
      emailVerifiedAt: userEntity.emailVerifiedAt,
      id: userEntity.id,
      name: userEntity.name,
      permissions: userEntity.permissions.map((permission) => permission.code),
      roles: userEntity.roles.map((role) => role.code),
      sessionId: session.id,
      status: userEntity.status,
    };
  }

  async revokeActiveSessionsForUser(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        revokedAt: null,
        userId,
      },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeSessionForRefreshTokenReuse(
    sessionId: string,
    userId: string,
    context: AuthRequestContext,
  ): Promise<void> {
    const now = new Date();

    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    await this.authAuditService.create({
      action: 'auth.refresh_token_reuse_detected',
      actorId: userId,
      metadata: {
        reason: 'refresh_token_hash_mismatch',
      },
      targetId: sessionId,
      targetType: 'AuthSession',
      ...context,
    });
  }

  private createAccessToken(user: UserWithAuthRelations, sessionId: string) {
    const userEntity = toUserEntity(user);

    return this.jwtTokenService.signAccessToken({
      email: user.email,
      permissions: userEntity.permissions.map((permission) => permission.code),
      roles: userEntity.roles.map((role) => role.code),
      sessionId,
      sub: user.id,
    });
  }

  private getRefreshTokenExpiresAt(): Date {
    const refreshTokenTtlSeconds = this.configService.get(
      'JWT_REFRESH_TOKEN_TTL_SECONDS',
      {
        infer: true,
      },
    );

    return new Date(Date.now() + refreshTokenTtlSeconds * 1000);
  }
}
