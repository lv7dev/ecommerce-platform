import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { EnvironmentVariables } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma, UserStatus } from '../../generated/prisma/client';
import {
  userInclude,
  UserWithAuthRelations,
} from '../user/constants/user.include';
import { toUserEntity } from '../user/mappers/user.mapper';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  RequestEmailVerificationEntity,
  VerifyEmailEntity,
} from './entities/email-verification.entity';
import { AuthTokenEntity, LogoutEntity } from './entities/auth-token.entity';
import {
  ForgotPasswordEntity,
  ResetPasswordEntity,
} from './entities/password-reset.entity';
import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

interface AuthRequestContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly emailService: EmailService,
  ) {}

  async register(
    registerDto: RegisterDto,
    context: AuthRequestContext,
  ): Promise<AuthTokenEntity> {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    await this.ensureSystemRoles();

    const userCount = await this.prisma.user.count();
    const roleCodes = userCount === 0 ? ['ADMIN', 'CUSTOMER'] : ['CUSTOMER'];
    const passwordHash = await this.passwordService.hash(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: registerDto.name,
        passwordHash,
        roles: {
          create: roleCodes.map((roleCode) => ({
            role: {
              connect: {
                code: roleCode,
              },
            },
          })),
        },
      },
      include: userInclude,
    });

    await this.createAuditLog({
      actorId: user.id,
      action: 'auth.registered',
      targetType: 'User',
      targetId: user.id,
      metadata: { roleCodes },
      ...context,
    });

    const emailVerification = await this.createEmailVerificationToken(
      user,
      context,
    );

    return this.createAuthResponse(user, context, emailVerification);
  }

  async login(
    loginDto: LoginDto,
    context: AuthRequestContext,
  ): Promise<AuthTokenEntity> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(loginDto.email) },
      include: userInclude,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.passwordService.verify(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.ensureUserCanAuthenticate(user.status);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: userInclude,
    });

    await this.createAuditLog({
      actorId: updatedUser.id,
      action: 'auth.login',
      targetType: 'User',
      targetId: updatedUser.id,
      ...context,
    });

    return this.createAuthResponse(updatedUser, context);
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    context: AuthRequestContext,
  ): Promise<ForgotPasswordEntity> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(forgotPasswordDto.email) },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { accepted: true };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const tokenId = randomUUID();
    const resetToken = this.buildOpaqueToken(tokenId);
    const expiresAt = this.getPasswordResetTokenExpiresAt();

    await this.prisma.passwordResetToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: this.hashOpaqueToken(resetToken),
        expiresAt,
      },
    });

    await this.createAuditLog({
      actorId: user.id,
      action: 'auth.password_reset_requested',
      targetType: 'User',
      targetId: user.id,
      ...context,
    });

    await this.emailService.sendPasswordReset({
      to: user.email,
      name: user.name,
      token: resetToken,
      expiresAt,
    });

    return {
      accepted: true,
      resetToken: this.shouldExposeAuthTokens() ? resetToken : undefined,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    context: AuthRequestContext,
  ): Promise<ResetPasswordEntity> {
    const tokenId = this.getOpaqueTokenId(resetPasswordDto.token);
    const passwordResetToken = await this.prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
      include: {
        user: true,
      },
    });

    if (
      !passwordResetToken ||
      passwordResetToken.usedAt ||
      passwordResetToken.expiresAt <= new Date() ||
      !this.verifyOpaqueToken(
        resetPasswordDto.token,
        passwordResetToken.tokenHash,
      )
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    this.ensureUserCanAuthenticate(passwordResetToken.user.status);

    const passwordHash = await this.passwordService.hash(
      resetPasswordDto.password,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: passwordResetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: passwordResetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.authSession.updateMany({
        where: {
          userId: passwordResetToken.userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.createAuditLog({
      actorId: passwordResetToken.userId,
      action: 'auth.password_reset_completed',
      targetType: 'User',
      targetId: passwordResetToken.userId,
      ...context,
    });

    return { reset: true };
  }

  async requestEmailVerification(
    authenticatedUser: AuthenticatedUser,
    context: AuthRequestContext,
  ): Promise<RequestEmailVerificationEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.id },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (user.emailVerifiedAt) {
      return {
        accepted: true,
        alreadyVerified: true,
      };
    }

    const emailVerification = await this.createEmailVerificationToken(
      user,
      context,
    );

    return {
      accepted: true,
      alreadyVerified: false,
      ...emailVerification,
    };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
    context: AuthRequestContext,
  ): Promise<VerifyEmailEntity> {
    const tokenId = this.getOpaqueTokenId(verifyEmailDto.token);
    const emailVerificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { id: tokenId },
        include: {
          user: {
            include: userInclude,
          },
        },
      });

    if (
      !emailVerificationToken ||
      emailVerificationToken.usedAt ||
      emailVerificationToken.expiresAt <= new Date() ||
      !this.verifyOpaqueToken(
        verifyEmailDto.token,
        emailVerificationToken.tokenHash,
      )
    ) {
      throw new BadRequestException(
        'Invalid or expired email verification token',
      );
    }

    this.ensureUserCanAuthenticate(emailVerificationToken.user.status);

    const [, updatedUser] = await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: emailVerificationToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: emailVerificationToken.userId },
        data: {
          emailVerifiedAt:
            emailVerificationToken.user.emailVerifiedAt ?? new Date(),
        },
        include: userInclude,
      }),
    ]);

    await this.createAuditLog({
      actorId: updatedUser.id,
      action: 'auth.email_verified',
      targetType: 'User',
      targetId: updatedUser.id,
      ...context,
    });

    return {
      verified: true,
      user: toUserEntity(updatedUser),
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthTokenEntity> {
    const sessionId = this.getSessionIdFromRefreshToken(
      refreshTokenDto.refreshToken,
    );
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: userInclude,
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      !this.verifyRefreshToken(
        refreshTokenDto.refreshToken,
        session.refreshTokenHash,
      )
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.ensureUserCanAuthenticate(session.user.status);

    const refreshToken = this.buildRefreshToken(session.id);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    const accessToken = this.createAccessToken(session.user, session.id);

    return {
      ...accessToken,
      refreshToken,
      user: toUserEntity(session.user),
    };
  }

  async logout(
    refreshTokenDto: RefreshTokenDto,
    context: AuthRequestContext,
  ): Promise<LogoutEntity> {
    const sessionId = this.getSessionIdFromRefreshToken(
      refreshTokenDto.refreshToken,
    );
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      !this.verifyRefreshToken(
        refreshTokenDto.refreshToken,
        session.refreshTokenHash,
      )
    ) {
      return { revoked: false };
    }

    await this.prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.createAuditLog({
      actorId: session.userId,
      action: 'auth.logout',
      targetType: 'AuthSession',
      targetId: session.id,
      ...context,
    });

    return { revoked: true };
  }

  async getAuthenticatedUser(payload: {
    sub: string;
    sessionId: string;
  }): Promise<AuthenticatedUser> {
    const [user, session] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: userInclude,
      }),
      this.prisma.authSession.findUnique({
        where: { id: payload.sessionId },
      }),
    ]);

    if (!user || !session || session.userId !== user.id) {
      throw new UnauthorizedException('Invalid token');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session revoked');
    }

    this.ensureUserCanAuthenticate(user.status);

    const userEntity = toUserEntity(user);

    return {
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      status: userEntity.status,
      sessionId: session.id,
      roles: userEntity.roles.map((role) => role.code),
      permissions: userEntity.permissions.map((permission) => permission.code),
    };
  }

  private async createAuthResponse(
    user: UserWithAuthRelations,
    context: AuthRequestContext,
    emailVerification?: {
      verificationToken?: string;
      expiresAt: string;
    },
  ): Promise<AuthTokenEntity> {
    this.ensureUserCanAuthenticate(user.status);

    const sessionId = randomUUID();
    const refreshToken = this.buildRefreshToken(sessionId);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return {
      ...this.createAccessToken(user, sessionId),
      refreshToken,
      user: toUserEntity(user),
      emailVerification,
    };
  }

  private createAccessToken(user: UserWithAuthRelations, sessionId: string) {
    const userEntity = toUserEntity(user);

    return this.jwtTokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      sessionId,
      roles: userEntity.roles.map((role) => role.code),
      permissions: userEntity.permissions.map((permission) => permission.code),
    });
  }

  private async createEmailVerificationToken(
    user: Pick<UserWithAuthRelations, 'id' | 'email' | 'name'>,
    context: AuthRequestContext,
  ): Promise<{
    verificationToken?: string;
    expiresAt: string;
  }> {
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const tokenId = randomUUID();
    const verificationToken = this.buildOpaqueToken(tokenId);
    const expiresAt = this.getEmailVerificationTokenExpiresAt();

    await this.prisma.emailVerificationToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: this.hashOpaqueToken(verificationToken),
        expiresAt,
      },
    });

    await this.createAuditLog({
      actorId: user.id,
      action: 'auth.email_verification_requested',
      targetType: 'User',
      targetId: user.id,
      ...context,
    });

    await this.emailService.sendEmailVerification({
      to: user.email,
      name: user.name,
      token: verificationToken,
      expiresAt,
    });

    return {
      verificationToken: this.shouldExposeAuthTokens()
        ? verificationToken
        : undefined,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private shouldExposeAuthTokens(): boolean {
    return this.configService.get('SEND_AUTH_TOKENS_IN_RESPONSE', {
      infer: true,
    });
  }

  private buildRefreshToken(sessionId: string): string {
    return `${sessionId}.${randomBytes(32).toString('base64url')}`;
  }

  private buildOpaqueToken(tokenId: string): string {
    return `${tokenId}.${randomBytes(32).toString('base64url')}`;
  }

  private getSessionIdFromRefreshToken(refreshToken: string): string {
    const [sessionId, secret] = refreshToken.split('.');

    if (!sessionId || !secret) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return sessionId;
  }

  private getOpaqueTokenId(token: string): string {
    const [tokenId, secret] = token.split('.');

    if (!tokenId || !secret) {
      throw new BadRequestException('Invalid token');
    }

    return tokenId;
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('base64url');
  }

  private hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('base64url');
  }

  private verifyRefreshToken(
    refreshToken: string,
    refreshTokenHash: string,
  ): boolean {
    const currentHash = Buffer.from(this.hashRefreshToken(refreshToken));
    const storedHash = Buffer.from(refreshTokenHash);

    if (currentHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(currentHash, storedHash);
  }

  private verifyOpaqueToken(token: string, tokenHash: string): boolean {
    const currentHash = Buffer.from(this.hashOpaqueToken(token));
    const storedHash = Buffer.from(tokenHash);

    if (currentHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(currentHash, storedHash);
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

  private getPasswordResetTokenExpiresAt(): Date {
    const ttlSeconds = this.configService.get(
      'PASSWORD_RESET_TOKEN_TTL_SECONDS',
      {
        infer: true,
      },
    );

    return new Date(Date.now() + ttlSeconds * 1000);
  }

  private getEmailVerificationTokenExpiresAt(): Date {
    const ttlSeconds = this.configService.get(
      'EMAIL_VERIFICATION_TOKEN_TTL_SECONDS',
      {
        infer: true,
      },
    );

    return new Date(Date.now() + ttlSeconds * 1000);
  }

  private ensureUserCanAuthenticate(status: UserStatus): void {
    if (status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User account is not active');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async createAuditLog(input: {
    actorId?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: input,
      });
    } catch {
      return;
    }
  }

  private async ensureSystemRoles(): Promise<void> {
    await this.prisma.role.upsert({
      where: { code: 'CUSTOMER' },
      update: {},
      create: {
        code: 'CUSTOMER',
        name: 'Customer',
        description: 'Default shopper access.',
        isSystem: true,
      },
    });

    await this.prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        name: 'Administrator',
        description: 'Full back-office access.',
        isSystem: true,
      },
    });
  }
}
