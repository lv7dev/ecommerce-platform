import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '../../../generated/prisma/client';

export class CategoryTranslationEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ enum: Locale, example: Locale.vi })
  locale: Locale;

  @ApiProperty({ example: 'Ao thun' })
  name: string;

  @ApiProperty({ example: 'ao-thun' })
  slug: string;

  @ApiPropertyOptional({ example: 'Ao thun cotton, oversize va basic.' })
  description: string | null;
}

export class CategorySummaryEntity {
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

export class CategoryEntity extends CategorySummaryEntity {
  @ApiPropertyOptional({ type: CategorySummaryEntity, nullable: true })
  parent: CategorySummaryEntity | null;

  @ApiProperty({ type: [CategorySummaryEntity] })
  children: CategorySummaryEntity[];

  @ApiProperty({ example: 12 })
  productCount: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}

export class CategoryListEntity {
  @ApiProperty({ type: [CategoryEntity] })
  items: CategoryEntity[];

  @ApiProperty({ example: 13 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
