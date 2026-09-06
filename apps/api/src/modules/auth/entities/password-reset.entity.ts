import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordEntity {
  @ApiProperty({ example: true })
  accepted: boolean;

  @ApiPropertyOptional({ example: '2026-09-04T00:00:00.000Z' })
  expiresAt?: string;
}

export class ResetPasswordEntity {
  @ApiProperty({ example: true })
  reset: boolean;
}
