import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../../config/env.validation';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UserStatus } from '../../../generated/prisma/client';
import { EmailService } from '../../email/email.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import {
  ForgotPasswordEntity,
  ResetPasswordEntity,
} from '../entities/password-reset.entity';
import { AuthAccountService } from './auth-account.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthOpaqueTokenService } from './auth-opaque-token.service';
import { AuthSessionService } from './auth-session.service';
import { PasswordService } from './password.service';
import { AuthRequestContext } from '../types/auth-request-context.type';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService,
    private readonly authAccountService: AuthAccountService,
    private readonly authAuditService: AuthAuditService,
    private readonly authOpaqueTokenService: AuthOpaqueTokenService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    context: AuthRequestContext,
  ): Promise<ForgotPasswordEntity> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: this.authAccountService.normalizeEmail(forgotPasswordDto.email),
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { accepted: true };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: {
        usedAt: null,
        userId: user.id,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const resetToken = this.authOpaqueTokenService.createOpaqueToken();
    const expiresAt = this.getPasswordResetTokenExpiresAt();

    await this.prisma.passwordResetToken.create({
      data: {
        expiresAt,
        id: resetToken.id,
        tokenHash: this.authOpaqueTokenService.hash(resetToken.token),
        userId: user.id,
      },
    });

    await this.authAuditService.create({
      action: 'auth.password_reset_requested',
      actorId: user.id,
      targetId: user.id,
      targetType: 'User',
      ...context,
    });

    await this.emailService.sendPasswordReset({
      expiresAt,
      name: user.name,
      to: user.email,
      token: resetToken.token,
    });

    return {
      accepted: true,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    context: AuthRequestContext,
  ): Promise<ResetPasswordEntity> {
    const tokenId = this.authOpaqueTokenService.getOpaqueTokenId(
      resetPasswordDto.token,
    );
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
      !this.authOpaqueTokenService.verify(
        resetPasswordDto.token,
        passwordResetToken.tokenHash,
      )
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    this.authAccountService.ensureUserCanAuthenticate(
      passwordResetToken.user.status,
    );

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
    ]);

    await this.authSessionService.revokeActiveSessionsForUser(
      passwordResetToken.userId,
    );

    await this.authAuditService.create({
      action: 'auth.password_reset_completed',
      actorId: passwordResetToken.userId,
      targetId: passwordResetToken.userId,
      targetType: 'User',
      ...context,
    });

    return { reset: true };
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
}
