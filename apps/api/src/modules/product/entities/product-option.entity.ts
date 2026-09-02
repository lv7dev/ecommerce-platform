import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';

export class ProductEmbeddedOptionValueEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'black' })
  code: string;

  @ApiProperty({ example: 0 })
  position: number;

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

export class ProductEmbeddedOptionEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'color' })
  code: string;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty({
    example: [
      { locale: Locale.vi, name: 'Mau sac' },
      { locale: Locale.en, name: 'Color' },
    ],
  })
  translations: Array<{
    locale: Locale;
    name: string;
  }>;

  @ApiProperty({ type: [ProductEmbeddedOptionValueEntity] })
  values: ProductEmbeddedOptionValueEntity[];
}
