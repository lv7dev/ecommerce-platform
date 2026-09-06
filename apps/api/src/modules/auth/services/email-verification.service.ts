import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../../config/env.validation';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  UserWithAuthRelations,
  userInclude,
} from '../../user/constants/user.include';
import { toUserEntity } from '../../user/mappers/user.mapper';
import { EmailService } from '../../email/email.service';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import {
  RequestEmailVerificationEntity,
  VerifyEmailEntity,
} from '../entities/email-verification.entity';
import { AuthAccountService } from './auth-account.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthOpaqueTokenService } from './auth-opaque-token.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';
import { AuthRequestContext } from '../types/auth-request-context.type';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly emailService: EmailService,
    private readonly authAccountService: AuthAccountService,
    private readonly authAuditService: AuthAuditService,
    private readonly authOpaqueTokenService: AuthOpaqueTokenService,
  ) {}

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
    const tokenId = this.authOpaqueTokenService.getOpaqueTokenId(
      verifyEmailDto.token,
    );
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
      !this.authOpaqueTokenService.verify(
        verifyEmailDto.token,
        emailVerificationToken.tokenHash,
      )
    ) {
      throw new BadRequestException(
        'Invalid or expired email verification token',
      );
    }

    this.authAccountService.ensureUserCanAuthenticate(
      emailVerificationToken.user.status,
    );

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

    await this.authAuditService.create({
      action: 'auth.email_verified',
      actorId: updatedUser.id,
      targetId: updatedUser.id,
      targetType: 'User',
      ...context,
    });

    return {
      user: toUserEntity(updatedUser),
      verified: true,
    };
  }

  async createEmailVerificationToken(
    user: Pick<UserWithAuthRelations, 'email' | 'id' | 'name'>,
    context: AuthRequestContext,
  ): Promise<{
    expiresAt: string;
  }> {
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        usedAt: null,
        userId: user.id,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const verificationToken = this.authOpaqueTokenService.createOpaqueToken();
    const expiresAt = this.getEmailVerificationTokenExpiresAt();

    await this.prisma.emailVerificationToken.create({
      data: {
        expiresAt,
        id: verificationToken.id,
        tokenHash: this.authOpaqueTokenService.hash(verificationToken.token),
        userId: user.id,
      },
    });

    await this.authAuditService.create({
      action: 'auth.email_verification_requested',
      actorId: user.id,
      targetId: user.id,
      targetType: 'User',
      ...context,
    });

    await this.emailService.sendEmailVerification({
      expiresAt,
      name: user.name,
      to: user.email,
      token: verificationToken.token,
    });

    return {
      expiresAt: expiresAt.toISOString(),
    };
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
}
