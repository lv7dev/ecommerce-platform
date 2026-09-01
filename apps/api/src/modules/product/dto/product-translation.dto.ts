import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Locale } from '../../../generated/prisma/client';

export class ProductTranslationDto {
  @ApiProperty({ enum: Locale, example: Locale.vi })
  @IsEnum(Locale)
  locale: Locale;

  @ApiProperty({ example: 'Ao thun cotton basic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'ao-thun-cotton-basic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({
    example: 'Ao thun cotton chinh hang tu Luma.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'Ao thun cotton mem, de phoi do hang ngay.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
