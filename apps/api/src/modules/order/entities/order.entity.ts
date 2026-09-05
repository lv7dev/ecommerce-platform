import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../../generated/prisma/client';

export class OrderItemEntity {
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

  @ApiProperty({ example: '249000' })
  unitAmountMinor: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: '498000' })
  lineTotalMinor: string;

  @ApiPropertyOptional({
    description:
      'Product, variant, option, and price snapshot at checkout time.',
  })
  snapshot: unknown;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;
}

export class OrderEntity {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  id: string;

  @ApiProperty({ example: 'ORD-20260905-AB12CD' })
  orderNumber: string;

  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  userId: string;

  @ApiProperty({ enum: Currency, example: Currency.VND })
  currency: Currency;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    enum: FulfillmentStatus,
    example: FulfillmentStatus.PENDING,
  })
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty({ example: '498000' })
  subtotalMinor: string;

  @ApiProperty({ example: '0' })
  discountMinor: string;

  @ApiProperty({ example: '0' })
  shippingFeeMinor: string;

  @ApiProperty({ example: '0' })
  taxMinor: string;

  @ApiProperty({ example: '498000' })
  totalMinor: string;

  @ApiPropertyOptional({ example: 'Giao giờ hành chính.' })
  note: string | null;

  @ApiPropertyOptional({
    description: 'Shipping address copied at checkout time.',
  })
  shippingAddressSnapshot: unknown;

  @ApiPropertyOptional({ example: '2026-09-05T10:30:00.000Z' })
  expiresAt: string | null;

  @ApiPropertyOptional({ example: '2026-09-05T10:45:00.000Z' })
  cancelledAt: string | null;

  @ApiPropertyOptional({ example: 'Customer cancelled before payment.' })
  cancelReason: string | null;

  @ApiProperty({ type: [OrderItemEntity] })
  items: OrderItemEntity[];

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt: string;
}

export class OrderListEntity {
  @ApiProperty({ type: [OrderEntity] })
  items: OrderEntity[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
