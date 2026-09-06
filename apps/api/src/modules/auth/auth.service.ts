import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { userInclude } from '../user/constants/user.include';
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
import { AuthAccountService } from './services/auth-account.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthSessionService } from './services/auth-session.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { PasswordResetService } from './services/password-reset.service';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { AuthRequestContext } from './types/auth-request-context.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly authAccountService: AuthAccountService,
    private readonly authAuditService: AuthAuditService,
    private readonly authSessionService: AuthSessionService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(
    registerDto: RegisterDto,
    context: AuthRequestContext,
  ): Promise<AuthTokenEntity> {
    const email = this.authAccountService.normalizeEmail(registerDto.email);

    await this.authAccountService.ensureEmailIsAvailable(email);
    await this.authAccountService.ensureSystemRoles();

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

    await this.authAuditService.create({
      action: 'auth.registered',
      actorId: user.id,
      metadata: { roleCodes },
      targetId: user.id,
      targetType: 'User',
      ...context,
    });

    const emailVerification =
      await this.emailVerificationService.createEmailVerificationToken(
        user,
        context,
      );

    return this.authSessionService.createAuthResponse(
      user,
      context,
      emailVerification,
    );
  }

  async login(
    loginDto: LoginDto,
    context: AuthRequestContext,
  ): Promise<AuthTokenEntity> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: this.authAccountService.normalizeEmail(loginDto.email),
      },
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

    this.authAccountService.ensureUserCanAuthenticate(user.status);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: userInclude,
    });

    await this.authAuditService.create({
      action: 'auth.login',
      actorId: updatedUser.id,
      targetId: updatedUser.id,
      targetType: 'User',
      ...context,
    });

    return this.authSessionService.createAuthResponse(updatedUser, context);
  }

  forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    context: AuthRequestContext,
  ): Promise<ForgotPasswordEntity> {
    return this.passwordResetService.forgotPassword(forgotPasswordDto, context);
  }

  resetPassword(
    resetPasswordDto: ResetPasswordDto,
    context: AuthRequestContext,
  ): Promise<ResetPasswordEntity> {
    return this.passwordResetService.resetPassword(resetPasswordDto, context);
  }

  requestEmailVerification(
    authenticatedUser: AuthenticatedUser,
    context: AuthRequestContext,
  ): Promise<RequestEmailVerificationEntity> {
    return this.emailVerificationService.requestEmailVerification(
      authenticatedUser,
      context,
    );
  }

  verifyEmail(
    verifyEmailDto: VerifyEmailDto,
    context: AuthRequestContext,
  ): Promise<VerifyEmailEntity> {
    return this.emailVerificationService.verifyEmail(verifyEmailDto, context);
  }

  refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthTokenEntity> {
    return this.authSessionService.refresh(refreshTokenDto.refreshToken);
  }

  logout(
    refreshTokenDto: RefreshTokenDto,
    context: AuthRequestContext,
  ): Promise<LogoutEntity> {
    return this.authSessionService.logout(
      refreshTokenDto.refreshToken,
      context,
    );
  }

  getAuthenticatedUser(payload: {
    sessionId: string;
    sub: string;
  }): Promise<AuthenticatedUser> {
    return this.authSessionService.getAuthenticatedUser(payload);
  }
}
