import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'email-verification-token' })
  @IsString()
  token: string;
}
