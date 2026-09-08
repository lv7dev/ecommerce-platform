import type { PaginatedResult } from '@/shared/types/api';

export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  countryCode?: string;
  district: string;
  fullName: string;
  phone: string;
  postalCode?: string;
  province: string;
  ward?: string;
}

export interface CheckoutInput {
  note?: string;
  shippingAddress: ShippingAddress;
}

export interface CancelOrderInput {
  reason?: string;
}

export interface OrderItem {
  createdAt: string;
  id: string;
  imageUrl: string | null;
  lineTotalMinor: string;
  productId: string;
  productName: string;
  quantity: number;
  sku: string;
  snapshot: unknown;
  unitAmountMinor: string;
  variantId: string;
  variantName: string | null;
}

export interface Order {
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  currency: string;
  discountMinor: string;
  expiresAt: string | null;
  fulfillmentStatus: FulfillmentStatus;
  id: string;
  items: OrderItem[];
  note: string | null;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  shippingAddressSnapshot: ShippingAddress | null;
  shippingFeeMinor: string;
  status: OrderStatus;
  subtotalMinor: string;
  taxMinor: string;
  totalMinor: string;
  updatedAt: string;
  userId: string;
}

export type OrderList = PaginatedResult<Order>;
