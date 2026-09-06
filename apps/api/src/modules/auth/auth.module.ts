import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthAccountService } from './services/auth-account.service';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthOpaqueTokenService } from './services/auth-opaque-token.service';
import { AuthSessionService } from './services/auth-session.service';
import { EmailVerificationService } from './services/email-verification.service';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordService } from './services/password.service';
import { PasswordResetService } from './services/password-reset.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthAccountService,
    AuthAuditService,
    AuthCookieService,
    AuthOpaqueTokenService,
    AuthSessionService,
    EmailVerificationService,
    AuthGuard,
    PermissionsGuard,
    JwtTokenService,
    PasswordResetService,
    PasswordService,
  ],
  exports: [
    AuthService,
    AuthCookieService,
    AuthGuard,
    PermissionsGuard,
    JwtTokenService,
  ],
})
export class AuthModule {}
