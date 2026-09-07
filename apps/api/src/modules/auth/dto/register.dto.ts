import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PasswordPolicy,
} from '../validators/password-policy.validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'correct horse battery staple',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @PasswordPolicy()
  password: string;

  @ApiPropertyOptional({ example: 'Luong Anh Tuan' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
