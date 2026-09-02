import { ApiProperty } from '@nestjs/swagger';
import { Locale } from '../../generated/prisma/client';

export class OptionValueTranslationEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Den' })
  value: string;
}
