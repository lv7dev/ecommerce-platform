import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';

export class ProductTranslationEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Ao thun cotton basic' })
  name: string;

  @ApiProperty({ example: 'ao-thun-cotton-basic' })
  slug: string;

  @ApiPropertyOptional({ example: 'Ao thun cotton chinh hang tu Luma.' })
  shortDescription: string | null;

  @ApiPropertyOptional({ example: 'Ao thun cotton mem, de phoi do hang ngay.' })
  description: string | null;
}
