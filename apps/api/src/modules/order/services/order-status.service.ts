import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { orderInclude, OrderWithRelations } from '../constants/order.include';
import { OrderEntity } from '../entities/order.entity';
import { toOrderEntity } from '../mappers/order.mapper';
import { InventoryReservationService } from './inventory-reservation.service';
import { OrderCancellationService } from './order-cancellation.service';
import { OrderExpirationService } from './order-expiration.service';

interface NextOrderState {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}

@Injectable()
export class OrderStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly orderCancellationService: OrderCancellationService,
    private readonly orderExpirationService: OrderExpirationService,
  ) {}

  async cancelMine(
    userId: string,
    orderId: string,
    cancelOrderDto: CancelOrderDto,
  ): Promise<OrderEntity> {
    await this.orderExpirationService.expireUnpaidOrders();

    const order = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            userId,
          },
          include: orderInclude,
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status === OrderStatus.CANCELLED) {
          return order;
        }

        return this.orderCancellationService.cancelPendingUnpaidOrder(
          tx,
          order,
          cancelOrderDto.reason ?? 'Customer cancelled before payment',
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return toOrderEntity(order);
  }

  async updateStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    await this.orderExpirationService.expireUnpaidOrders();

    const order = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: orderInclude,
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (this.isCancellationRequest(updateOrderStatusDto)) {
          if (order.status === OrderStatus.CANCELLED) {
            return order;
          }

          return this.orderCancellationService.cancelPendingUnpaidOrder(
            tx,
            order,
            updateOrderStatusDto.cancelReason ?? 'Admin cancelled order',
            updateOrderStatusDto.paymentStatus === PaymentStatus.FAILED
              ? PaymentStatus.FAILED
              : undefined,
          );
        }

        const nextState = this.buildNextOrderState(order, updateOrderStatusDto);

        this.ensureOrderCanTransition(order, updateOrderStatusDto, nextState);

        if (
          updateOrderStatusDto.paymentStatus === PaymentStatus.PAID &&
          order.paymentStatus !== PaymentStatus.PAID
        ) {
          await this.consumeReservationIfPending(tx, order);
        }

        return tx.order.update({
          where: { id: order.id },
          data: {
            status: nextState.status,
            paymentStatus: nextState.paymentStatus,
            fulfillmentStatus: nextState.fulfillmentStatus,
            expiresAt:
              updateOrderStatusDto.paymentStatus === PaymentStatus.PAID
                ? null
                : undefined,
          },
          include: orderInclude,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return toOrderEntity(order);
  }

  private async consumeReservationIfPending(
    tx: Prisma.TransactionClient,
    order: OrderWithRelations,
  ): Promise<void> {
    if (
      order.status !== OrderStatus.PENDING_PAYMENT ||
      order.paymentStatus !== PaymentStatus.UNPAID
    ) {
      return;
    }

    await this.inventoryReservationService.consumeReservation(tx, order);
  }

  private isCancellationRequest(dto: UpdateOrderStatusDto): boolean {
    return (
      dto.status === OrderStatus.CANCELLED ||
      dto.fulfillmentStatus === FulfillmentStatus.CANCELLED ||
      dto.paymentStatus === PaymentStatus.FAILED
    );
  }

  private buildNextOrderState(
    order: OrderWithRelations,
    dto: UpdateOrderStatusDto,
  ): NextOrderState {
    const paymentStatus = dto.paymentStatus ?? order.paymentStatus;
    const fulfillmentStatus = dto.fulfillmentStatus ?? order.fulfillmentStatus;
    let status = dto.status ?? order.status;

    if (
      dto.status === undefined &&
      order.status === OrderStatus.PENDING_PAYMENT &&
      paymentStatus === PaymentStatus.PAID
    ) {
      status = OrderStatus.CONFIRMED;
    }

    if (
      dto.status === undefined &&
      order.status === OrderStatus.CONFIRMED &&
      fulfillmentStatus === FulfillmentStatus.DELIVERED
    ) {
      status = OrderStatus.COMPLETED;
    }

    return {
      status,
      paymentStatus,
      fulfillmentStatus,
    };
  }

  private ensureOrderCanTransition(
    order: OrderWithRelations,
    dto: UpdateOrderStatusDto,
    nextState: NextOrderState,
  ): void {
    if (
      dto.status === undefined &&
      dto.paymentStatus === undefined &&
      dto.fulfillmentStatus === undefined
    ) {
      throw new BadRequestException('At least one status field is required');
    }

    if (
      dto.paymentStatus === PaymentStatus.REFUNDED ||
      nextState.paymentStatus === PaymentStatus.REFUNDED
    ) {
      throw new ConflictException('Refund flow is not implemented yet');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Cancelled orders cannot be updated');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new ConflictException('Completed orders cannot be updated');
    }

    if (dto.status === OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order cannot be moved back to pending');
    }

    this.ensurePaymentTransition(order.paymentStatus, nextState.paymentStatus);
    this.ensureFulfillmentTransition(
      order.fulfillmentStatus,
      nextState.fulfillmentStatus,
    );
    this.ensureOrderStatusTransition(order.status, nextState.status);
    this.ensureStateCombinationIsValid(nextState);
  }

  private ensurePaymentTransition(
    current: PaymentStatus,
    next: PaymentStatus,
  ): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.UNPAID]: [PaymentStatus.PAID, PaymentStatus.FAILED],
      [PaymentStatus.PAID]: [],
      [PaymentStatus.FAILED]: [],
      [PaymentStatus.REFUNDED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new ConflictException(
        `Invalid payment status transition from ${current} to ${next}`,
      );
    }
  }

  private ensureFulfillmentTransition(
    current: FulfillmentStatus,
    next: FulfillmentStatus,
  ): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
      [FulfillmentStatus.PENDING]: [
        FulfillmentStatus.PROCESSING,
        FulfillmentStatus.CANCELLED,
      ],
      [FulfillmentStatus.PROCESSING]: [FulfillmentStatus.SHIPPED],
      [FulfillmentStatus.SHIPPED]: [FulfillmentStatus.DELIVERED],
      [FulfillmentStatus.DELIVERED]: [],
      [FulfillmentStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new ConflictException(
        `Invalid fulfillment status transition from ${current} to ${next}`,
      );
    }
  }

  private ensureOrderStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[current].includes(next)) {
      throw new ConflictException(
        `Invalid order status transition from ${current} to ${next}`,
      );
    }
  }

  private ensureStateCombinationIsValid(nextState: NextOrderState): void {
    if (nextState.status === OrderStatus.PENDING_PAYMENT) {
      if (
        nextState.paymentStatus !== PaymentStatus.UNPAID ||
        nextState.fulfillmentStatus !== FulfillmentStatus.PENDING
      ) {
        throw new ConflictException(
          'Pending payment orders must be unpaid and pending fulfillment',
        );
      }

      return;
    }

    if (nextState.status === OrderStatus.CONFIRMED) {
      if (nextState.paymentStatus !== PaymentStatus.PAID) {
        throw new ConflictException('Confirmed orders must be paid');
      }

      if (nextState.fulfillmentStatus === FulfillmentStatus.CANCELLED) {
        throw new ConflictException(
          'Confirmed orders cannot have cancelled fulfillment',
        );
      }

      return;
    }

    if (nextState.status === OrderStatus.COMPLETED) {
      if (
        nextState.paymentStatus !== PaymentStatus.PAID ||
        nextState.fulfillmentStatus !== FulfillmentStatus.DELIVERED
      ) {
        throw new ConflictException(
          'Completed orders must be paid and delivered',
        );
      }
    }
  }
}
