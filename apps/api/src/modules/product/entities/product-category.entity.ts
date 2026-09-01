import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';

export class CategoryTranslationEntity {
  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Ao thun' })
  name: string;

  @ApiProperty({ example: 'ao-thun' })
  slug: string;
}

export class ProductCategoryEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiPropertyOptional({
    example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e',
  })
  parentId: string | null;

  @ApiProperty({ example: 0 })
  position: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [CategoryTranslationEntity] })
  translations: CategoryTranslationEntity[];
}
