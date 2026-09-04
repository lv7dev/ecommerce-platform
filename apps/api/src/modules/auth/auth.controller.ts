import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
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
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a user account' })
  @ApiCreatedResponse({ type: AuthTokenEntity })
  @Post('register')
  register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    return this.authService.register(
      registerDto,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: AuthTokenEntity })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, this.getRequestContext(request));
  }

  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access token',
  })
  @ApiOkResponse({ type: AuthTokenEntity })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto);
  }

  @ApiOperation({ summary: 'Logout by revoking a refresh session' })
  @ApiOkResponse({ type: LogoutEntity })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() refreshTokenDto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.logout(
      refreshTokenDto,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiOkResponse({ type: ForgotPasswordEntity })
  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.forgotPassword(
      forgotPasswordDto,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Reset password with a password reset token' })
  @ApiOkResponse({ type: ResetPasswordEntity })
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Request an email verification token' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: RequestEmailVerificationEntity })
  @UseGuards(AuthGuard)
  @Post('email-verification/request')
  @HttpCode(HttpStatus.OK)
  requestEmailVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.authService.requestEmailVerification(
      user,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Verify email with an email verification token' })
  @ApiOkResponse({ type: VerifyEmailEntity })
  @Post('email-verification/verify')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Req() request: Request) {
    return this.authService.verifyEmail(
      verifyEmailDto,
      this.getRequestContext(request),
    );
  }

  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  private getRequestContext(request: Request) {
    return {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };
  }
}
