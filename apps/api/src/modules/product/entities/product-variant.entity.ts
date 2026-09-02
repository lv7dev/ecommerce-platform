import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProductVariantOptionValueSummaryEntity,
  ProductVariantPriceSummaryEntity,
} from '../../../shared/entities';

export class ProductEmbeddedVariantEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'BASIC-TEE-BLACK-M' })
  sku: string;

  @ApiPropertyOptional({ example: '8938505974123' })
  barcode: string | null;

  @ApiPropertyOptional({
    example: 'https://placehold.co/800x800?text=Basic+Cotton+T-shirt',
  })
  imageUrl: string | null;

  @ApiProperty({ example: 20 })
  stock: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [ProductVariantOptionValueSummaryEntity] })
  optionValues: ProductVariantOptionValueSummaryEntity[];

  @ApiProperty({ type: [ProductVariantPriceSummaryEntity] })
  prices: ProductVariantPriceSummaryEntity[];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}
