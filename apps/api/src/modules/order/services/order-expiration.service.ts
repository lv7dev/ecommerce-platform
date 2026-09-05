import { Injectable } from '@nestjs/common';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { orderInclude } from '../constants/order.include';
import { OrderCancellationService } from './order-cancellation.service';

@Injectable()
export class OrderExpirationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderCancellationService: OrderCancellationService,
  ) {}

  async expireUnpaidOrders(): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction(
      async (tx) => {
        const expiredOrders = await tx.order.findMany({
          where: {
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.UNPAID,
            fulfillmentStatus: FulfillmentStatus.PENDING,
            expiresAt: {
              lte: now,
            },
          },
          include: orderInclude,
          take: 100,
        });

        for (const order of expiredOrders) {
          await this.orderCancellationService.cancelPendingUnpaidOrder(
            tx,
            order,
            'Payment window expired',
          );
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
