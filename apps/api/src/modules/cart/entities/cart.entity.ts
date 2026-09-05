import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../../../generated/prisma/client';

export class CartItemOptionValueEntity {
  @ApiProperty({ example: 'color' })
  optionCode: string;

  @ApiProperty({ example: 'Màu sắc' })
  optionName: string;

  @ApiProperty({ example: 'black' })
  valueCode: string;

  @ApiProperty({ example: 'Đen' })
  valueName: string;
}

export class CartItemEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  variantId: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  productId: string;

  @ApiProperty({ example: 'Áo thun cotton basic' })
  productName: string;

  @ApiPropertyOptional({ example: 'Màu sắc: Đen / Kích thước: M' })
  variantName: string | null;

  @ApiProperty({ example: 'BASIC-TEE-BLACK-M' })
  sku: string;

  @ApiPropertyOptional({
    example: 'https://placehold.co/800x800?text=Basic+Cotton+T-shirt',
  })
  imageUrl: string | null;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 20 })
  stock: number;

  @ApiProperty({ example: 3 })
  reservedStock: number;

  @ApiProperty({ example: 17 })
  availableStock: number;

  @ApiPropertyOptional({ example: '249000' })
  unitAmountMinor: string | null;

  @ApiPropertyOptional({ example: '498000' })
  lineTotalMinor: string | null;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiPropertyOptional({ example: 'INSUFFICIENT_STOCK' })
  unavailableReason: string | null;

  @ApiProperty({ type: [CartItemOptionValueEntity] })
  optionValues: CartItemOptionValueEntity[];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}

export class CartEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  userId: string;

  @ApiProperty({ enum: Currency, example: Currency.VND })
  currency: Currency;

  @ApiProperty({ example: '498000' })
  subtotalMinor: string;

  @ApiProperty({ type: [CartItemEntity] })
  items: CartItemEntity[];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}
