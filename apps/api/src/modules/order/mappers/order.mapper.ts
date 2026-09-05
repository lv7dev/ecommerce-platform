import { OrderWithRelations } from '../constants/order.include';
import { OrderEntity } from '../entities/order.entity';

export function toOrderEntity(order: OrderWithRelations): OrderEntity {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    currency: order.currency,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    subtotalMinor: order.subtotalMinor.toString(),
    discountMinor: order.discountMinor.toString(),
    shippingFeeMinor: order.shippingFeeMinor.toString(),
    taxMinor: order.taxMinor.toString(),
    totalMinor: order.totalMinor.toString(),
    note: order.note,
    shippingAddressSnapshot: order.shippingAddressSnapshot,
    expiresAt: order.expiresAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    items: order.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitAmountMinor: item.unitAmountMinor.toString(),
      quantity: item.quantity,
      lineTotalMinor: item.lineTotalMinor.toString(),
      snapshot: item.snapshot,
      createdAt: item.createdAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
