import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
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
import {
  AuthSessionEntity,
  AuthTokenEntity,
  LogoutEntity,
} from './entities/auth-token.entity';
import {
  ForgotPasswordEntity,
  ResetPasswordEntity,
} from './entities/password-reset.entity';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './auth.service';
import { AuthThrottle } from './decorators/auth-throttle.decorator';
import { AuthCookieService } from './services/auth-cookie.service';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @ApiOperation({ summary: 'Register a user account' })
  @ApiCreatedResponse({ type: AuthSessionEntity })
  @AuthThrottle('register')
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authTokens = await this.authService.register(
      registerDto,
      this.getRequestContext(request),
    );

    this.authCookieService.setAuthCookies(response, authTokens);

    return this.toAuthSession(authTokens);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: AuthSessionEntity })
  @AuthThrottle('login')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authTokens = await this.authService.login(
      loginDto,
      this.getRequestContext(request),
    );

    this.authCookieService.setAuthCookies(response, authTokens);

    return this.toAuthSession(authTokens);
  }

  @ApiOperation({
    summary: 'Rotate refresh token and issue a new access token',
  })
  @ApiOkResponse({ type: AuthSessionEntity })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto = {},
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authTokens = await this.authService.refresh({
      refreshToken:
        refreshTokenDto.refreshToken ??
        this.authCookieService.getRefreshToken(request),
    });

    this.authCookieService.setAuthCookies(response, authTokens);

    return this.toAuthSession(authTokens);
  }

  @ApiOperation({ summary: 'Logout by revoking a refresh session' })
  @ApiOkResponse({ type: LogoutEntity })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto = {},
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const logoutResult = await this.authService.logout(
      {
        refreshToken:
          refreshTokenDto.refreshToken ??
          this.authCookieService.getRefreshToken(request),
      },
      this.getRequestContext(request),
    );

    this.authCookieService.clearAuthCookies(response);

    return logoutResult;
  }

  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiOkResponse({ type: ForgotPasswordEntity })
  @AuthThrottle('forgotPassword')
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
  @AuthThrottle('resetPassword')
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
  @ApiCookieAuth()
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
  @AuthThrottle('verifyEmail')
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
  @ApiCookieAuth()
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

  private toAuthSession(authTokens: AuthTokenEntity): AuthSessionEntity {
    return {
      emailVerification: authTokens.emailVerification,
      expiresIn: authTokens.expiresIn,
      user: authTokens.user,
    };
  }
}
