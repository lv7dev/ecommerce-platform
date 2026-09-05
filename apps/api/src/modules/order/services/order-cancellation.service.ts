import { ConflictException, Injectable } from '@nestjs/common';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { orderInclude, OrderWithRelations } from '../constants/order.include';
import { InventoryReservationService } from './inventory-reservation.service';

@Injectable()
export class OrderCancellationService {
  constructor(
    private readonly inventoryReservationService: InventoryReservationService,
  ) {}

  async cancelPendingUnpaidOrder(
    tx: Prisma.TransactionClient,
    order: OrderWithRelations,
    cancelReason: string,
    paymentStatus: PaymentStatus = order.paymentStatus,
  ): Promise<OrderWithRelations> {
    if (
      order.status !== OrderStatus.PENDING_PAYMENT ||
      order.paymentStatus !== PaymentStatus.UNPAID ||
      order.fulfillmentStatus !== FulfillmentStatus.PENDING
    ) {
      throw new ConflictException(
        'Only pending unpaid orders can be cancelled with reservation release',
      );
    }

    const now = new Date();
    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.UNPAID,
        fulfillmentStatus: FulfillmentStatus.PENDING,
      },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus,
        fulfillmentStatus: FulfillmentStatus.CANCELLED,
        expiresAt: null,
        cancelledAt: now,
        cancelReason,
      },
    });

    if (updated.count !== 1) {
      throw new ConflictException('Order can no longer be cancelled');
    }

    await this.inventoryReservationService.releaseReservation(tx, order);

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: orderInclude,
    });
  }
}
