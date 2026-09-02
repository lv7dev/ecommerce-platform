import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../../generated/prisma/client';

export class ProductVariantPriceVariantSummaryEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  productId: string;

  @ApiProperty({ example: 'BASIC-TEE-BLACK-M' })
  sku: string;
}

export class ProductVariantPriceDetailEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  variantId: string;

  @ApiProperty({ enum: Currency, example: Currency.VND })
  currency: Currency;

  @ApiProperty({ example: '249000' })
  amountMinor: string;

  @ApiPropertyOptional({ example: '299000' })
  compareAtAmountMinor: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  startsAt: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  endsAt: string | null;

  @ApiProperty({ type: ProductVariantPriceVariantSummaryEntity })
  variant: ProductVariantPriceVariantSummaryEntity;
}

export class ProductVariantPriceListEntity {
  @ApiProperty({ type: [ProductVariantPriceDetailEntity] })
  items: ProductVariantPriceDetailEntity[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
