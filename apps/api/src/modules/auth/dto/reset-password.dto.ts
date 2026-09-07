import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PasswordPolicy,
} from '../validators/password-policy.validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'password-reset-token' })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'new correct horse battery',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @PasswordPolicy()
  password: string;
}
