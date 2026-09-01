import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Locale } from '../../../generated/prisma/client';

export class OptionValueTranslationDto {
  @ApiProperty({ enum: Locale, example: Locale.vi })
  @IsEnum(Locale)
  locale: Locale;

  @ApiProperty({ example: 'Den' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
