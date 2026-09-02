import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '../../generated/prisma/client';

export class ProductVariantOptionValueSummaryEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'black' })
  code: string;

  @ApiProperty({ example: 'color' })
  optionCode: string;

  @ApiProperty({
    example: [
      { locale: Locale.vi, value: 'Den' },
      { locale: Locale.en, value: 'Black' },
    ],
  })
  translations: Array<{
    locale: Locale;
    value: string;
  }>;
}
