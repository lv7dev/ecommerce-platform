import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, Locale } from '../../../generated/prisma/client';

export class ProductVariantPriceEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

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
}

export class ProductVariantOptionValueEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'black' })
  code: string;

  @ApiProperty({ example: 'color' })
  optionCode: string;

  @ApiProperty({
    example: [
      { locale: Locale.vi, value: 'Den' },
      { locale: Locale.en, value: 'Black' },
    ],
  })
  translations: Array<{
    locale: Locale;
    value: string;
  }>;
}

export class ProductVariantEntity {
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

  @ApiProperty({ type: [ProductVariantOptionValueEntity] })
  optionValues: ProductVariantOptionValueEntity[];

  @ApiProperty({ type: [ProductVariantPriceEntity] })
  prices: ProductVariantPriceEntity[];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}
