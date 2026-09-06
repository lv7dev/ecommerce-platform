import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AuthController } from './auth.controller';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCookieService,
    AuthGuard,
    PermissionsGuard,
    JwtTokenService,
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
