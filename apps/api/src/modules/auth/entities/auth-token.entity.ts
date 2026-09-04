import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entity';

export class AuthEmailVerificationEntity {
  @ApiPropertyOptional({
    example: 'email-verification-token-for-local-testing',
  })
  verificationToken?: string;

  @ApiProperty({ example: '2026-09-04T00:00:00.000Z' })
  expiresAt: string;
}

export class AuthTokenEntity {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'session-id.refresh-secret' })
  refreshToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: UserEntity })
  user: UserEntity;

  @ApiPropertyOptional({ type: AuthEmailVerificationEntity })
  emailVerification?: AuthEmailVerificationEntity;
}

export class LogoutEntity {
  @ApiProperty({ example: true })
  revoked: boolean;
}
