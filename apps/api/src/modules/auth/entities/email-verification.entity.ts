import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entity';

export class RequestEmailVerificationEntity {
  @ApiProperty({ example: true })
  accepted: boolean;

  @ApiProperty({ example: false })
  alreadyVerified: boolean;

  @ApiPropertyOptional({ example: '2026-09-04T00:00:00.000Z' })
  expiresAt?: string;
}

export class VerifyEmailEntity {
  @ApiProperty({ example: true })
  verified: boolean;

  @ApiProperty({ type: UserEntity })
  user: UserEntity;
}
