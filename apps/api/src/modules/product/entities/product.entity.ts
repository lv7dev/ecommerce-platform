import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../../generated/prisma/client';
import { ProductEmbeddedCategoryEntity } from './product-category.entity';
import { ProductEmbeddedOptionEntity } from './product-option.entity';
import { ProductTranslationEntity } from './product-translation.entity';
import { ProductEmbeddedVariantEntity } from './product-variant.entity';

export class ProductEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiPropertyOptional({ example: 'Luma' })
  brand: string | null;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  status: ProductStatus;

  @ApiProperty({ type: [ProductTranslationEntity] })
  translations: ProductTranslationEntity[];

  @ApiProperty({ type: [ProductEmbeddedCategoryEntity] })
  categories: ProductEmbeddedCategoryEntity[];

  @ApiProperty({ type: [ProductEmbeddedOptionEntity] })
  options: ProductEmbeddedOptionEntity[];

  @ApiProperty({ type: [ProductEmbeddedVariantEntity] })
  variants: ProductEmbeddedVariantEntity[];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}

export class ProductListEntity {
  @ApiProperty({ type: [ProductEntity] })
  items: ProductEntity[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export {
  ProductEmbeddedCategoryEntity,
  ProductEmbeddedCategoryTranslationEntity,
} from './product-category.entity';
export {
  ProductEmbeddedOptionEntity,
  ProductEmbeddedOptionValueEntity,
} from './product-option.entity';
export { ProductTranslationEntity } from './product-translation.entity';
export { ProductEmbeddedVariantEntity } from './product-variant.entity';
