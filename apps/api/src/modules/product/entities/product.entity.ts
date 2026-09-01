import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../../generated/prisma/client';
import { ProductCategoryEntity } from './product-category.entity';
import { ProductOptionEntity } from './product-option.entity';
import { ProductTranslationEntity } from './product-translation.entity';
import { ProductVariantEntity } from './product-variant.entity';

export class ProductEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiPropertyOptional({ example: 'Luma' })
  brand: string | null;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  status: ProductStatus;

  @ApiProperty({ type: [ProductTranslationEntity] })
  translations: ProductTranslationEntity[];

  @ApiProperty({ type: [ProductCategoryEntity] })
  categories: ProductCategoryEntity[];

  @ApiProperty({ type: [ProductOptionEntity] })
  options: ProductOptionEntity[];

  @ApiProperty({ type: [ProductVariantEntity] })
  variants: ProductVariantEntity[];

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
  CategoryTranslationEntity,
  ProductCategoryEntity,
} from './product-category.entity';
export {
  ProductOptionEntity,
  ProductOptionValueEntity,
} from './product-option.entity';
export { ProductTranslationEntity } from './product-translation.entity';
export {
  ProductVariantEntity,
  ProductVariantOptionValueEntity,
  ProductVariantPriceEntity,
} from './product-variant.entity';
