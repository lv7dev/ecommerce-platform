import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Locale } from '../../../generated/prisma/client';

export class OptionTranslationDto {
  @ApiProperty({ enum: Locale, example: Locale.vi })
  @IsEnum(Locale)
  locale: Locale;

  @ApiProperty({ example: 'Mau sac' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
