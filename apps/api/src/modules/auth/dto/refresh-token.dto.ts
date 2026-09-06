import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Optional compatibility field. Web clients should rely on the httpOnly refresh cookie.',
    example: 'session-id.refresh-secret',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
