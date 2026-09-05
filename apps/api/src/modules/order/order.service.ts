import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { FindAdminOrdersQueryDto } from './dto/find-admin-orders-query.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderEntity, OrderListEntity } from './entities/order.entity';
import { orderInclude } from './constants/order.include';
import { toOrderEntity } from './mappers/order.mapper';
import { CheckoutService } from './services/checkout.service';
import { OrderExpirationService } from './services/order-expiration.service';
import { OrderStatusService } from './services/order-status.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutService: CheckoutService,
    private readonly orderExpirationService: OrderExpirationService,
    private readonly orderStatusService: OrderStatusService,
  ) {}

  async checkout(
    userId: string,
    idempotencyKey: string | undefined,
    checkoutDto: CheckoutDto | undefined,
  ): Promise<OrderEntity> {
    return this.checkoutService.checkout(userId, idempotencyKey, checkoutDto);
  }

  async findMine(
    userId: string,
    query: FindOrdersQueryDto,
  ): Promise<OrderListEntity> {
    await this.orderExpirationService.expireUnpaidOrders();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = { userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => toOrderEntity(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneMine(userId: string, orderId: string): Promise<OrderEntity> {
    await this.orderExpirationService.expireUnpaidOrders();

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return toOrderEntity(order);
  }

  async findAllAdmin(query: FindAdminOrdersQueryDto): Promise<OrderListEntity> {
    await this.orderExpirationService.expireUnpaidOrders();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = {
      status: query.status,
      paymentStatus: query.paymentStatus,
      fulfillmentStatus: query.fulfillmentStatus,
      userId: query.userId,
      orderNumber: query.orderNumber
        ? { contains: query.orderNumber, mode: 'insensitive' }
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => toOrderEntity(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneAdmin(orderId: string): Promise<OrderEntity> {
    await this.orderExpirationService.expireUnpaidOrders();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return toOrderEntity(order);
  }

  async cancelMine(
    userId: string,
    orderId: string,
    cancelOrderDto: CancelOrderDto,
  ): Promise<OrderEntity> {
    return this.orderStatusService.cancelMine(userId, orderId, cancelOrderDto);
  }

  async updateStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    return this.orderStatusService.updateStatus(orderId, updateOrderStatusDto);
  }
}
