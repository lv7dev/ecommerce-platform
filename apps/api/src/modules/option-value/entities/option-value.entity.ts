import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';
import { OptionValueTranslationEntity } from '../../../shared/entities';

export class OptionValueOptionSummaryEntity {
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

export class OptionValueDetailEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  optionId: string;

  @ApiProperty({ example: 'black' })
  code: string;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty({ type: OptionValueOptionSummaryEntity })
  option: OptionValueOptionSummaryEntity;

  @ApiProperty({ type: [OptionValueTranslationEntity] })
  translations: OptionValueTranslationEntity[];

  @ApiProperty({ example: 24 })
  variantCount: number;
}

export class OptionValueListEntity {
  @ApiProperty({ type: [OptionValueDetailEntity] })
  items: OptionValueDetailEntity[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
