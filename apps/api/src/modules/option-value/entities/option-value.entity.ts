import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';

export class OptionValueTranslationEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Den' })
  value: string;
}

export class OptionValueOptionEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'color' })
  code: string;

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
}

export class OptionValueEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  optionId: string;

  @ApiProperty({ example: 'black' })
  code: string;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty({ type: OptionValueOptionEntity })
  option: OptionValueOptionEntity;

  @ApiProperty({ type: [OptionValueTranslationEntity] })
  translations: OptionValueTranslationEntity[];

  @ApiProperty({ example: 24 })
  variantCount: number;
}

export class OptionValueListEntity {
  @ApiProperty({ type: [OptionValueEntity] })
  items: OptionValueEntity[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
