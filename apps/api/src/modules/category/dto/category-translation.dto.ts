import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Locale } from '../../../generated/prisma/client';

export class CategoryTranslationDto {
  @ApiProperty({ enum: Locale, example: Locale.vi })
  @IsEnum(Locale)
  locale: Locale;

  @ApiProperty({ example: 'Ao thun' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'ao-thun' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ example: 'Ao thun cotton, oversize va basic.' })
  @IsOptional()
  @IsString()
  description?: string;
}
