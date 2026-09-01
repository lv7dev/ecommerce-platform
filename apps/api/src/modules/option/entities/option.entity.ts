import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';

export class OptionTranslationEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Mau sac' })
  name: string;
}

export class OptionValueTranslationEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Den' })
  value: string;
}

export class OptionValueEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'black' })
  code: string;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty({ type: [OptionValueTranslationEntity] })
  translations: OptionValueTranslationEntity[];

  @ApiProperty({ example: 24 })
  variantCount: number;
}

export class OptionEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'color' })
  code: string;

  @ApiProperty({ type: [OptionTranslationEntity] })
  translations: OptionTranslationEntity[];

  @ApiProperty({ type: [OptionValueEntity] })
  values: OptionValueEntity[];

  @ApiProperty({ example: 12 })
  productCount: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}

export class OptionListEntity {
  @ApiProperty({ type: [OptionEntity] })
  items: OptionEntity[];

  @ApiProperty({ example: 7 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
