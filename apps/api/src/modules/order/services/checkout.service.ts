import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  CheckoutIdempotencyStatus,
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { isPrismaError } from '../../../common/helpers/prisma-error.helper';
import {
  cartInclude,
  CartItemWithRelations,
} from '../../cart/constants/cart.include';
import {
  getActivePrice,
  getProductName,
  getVariantName,
  toOrderItemSnapshot,
} from '../../cart/mappers/cart.mapper';
import { orderInclude } from '../constants/order.include';
import { CheckoutDto } from '../dto/checkout.dto';
import { OrderEntity } from '../entities/order.entity';
import { toOrderEntity } from '../mappers/order.mapper';
import { CheckoutIdempotencyService } from './checkout-idempotency.service';
import {
  CheckoutLine,
  InventoryReservationService,
} from './inventory-reservation.service';
import { OrderExpirationService } from './order-expiration.service';

const PAYMENT_EXPIRY_MINUTES = 30;

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutIdempotencyService: CheckoutIdempotencyService,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly orderExpirationService: OrderExpirationService,
  ) {}

  async checkout(
    userId: string,
    idempotencyKey: string | undefined,
    checkoutDto: CheckoutDto,
  ): Promise<OrderEntity> {
    const normalizedKey =
      this.checkoutIdempotencyService.normalizeKey(idempotencyKey);

    try {
      await this.orderExpirationService.expireUnpaidOrders();

      const order = await this.prisma.$transaction(
        async (tx) => {
          const existingKey = await tx.checkoutIdempotencyKey.findUnique({
            where: {
              userId_key: {
                userId,
                key: normalizedKey,
              },
            },
            include: {
              order: {
                include: orderInclude,
              },
            },
          });

          const cart = await tx.cart.findUnique({
            where: { userId },
            include: cartInclude,
          });

          if (existingKey) {
            this.checkoutIdempotencyService.ensureSameCheckoutRequestWhenCartExists(
              existingKey.requestHash,
              cart,
              checkoutDto,
            );

            return this.checkoutIdempotencyService.handleExistingKey(
              existingKey,
            );
          }

          if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
          }

          const requestHash = this.checkoutIdempotencyService.createRequestHash(
            cart,
            checkoutDto,
          );

          await tx.checkoutIdempotencyKey.create({
            data: {
              userId,
              key: normalizedKey,
              requestHash,
              status: CheckoutIdempotencyStatus.PROCESSING,
            },
          });

          const lines = cart.items.map((item) =>
            this.buildCheckoutLine(item, cart.currency),
          );

          for (const line of lines) {
            await this.inventoryReservationService.reserveStock(tx, line);
          }

          const subtotalMinor = lines.reduce(
            (total, line) => total + line.lineTotalMinor,
            0n,
          );
          const totalMinor = subtotalMinor;

          const createdOrder = await tx.order.create({
            data: {
              orderNumber: this.generateOrderNumber(),
              userId,
              currency: cart.currency,
              status: OrderStatus.PENDING_PAYMENT,
              paymentStatus: PaymentStatus.UNPAID,
              fulfillmentStatus: FulfillmentStatus.PENDING,
              subtotalMinor,
              totalMinor,
              note: checkoutDto.note ?? null,
              shippingAddressSnapshot:
                this.buildShippingAddressSnapshot(checkoutDto),
              expiresAt: this.getPaymentExpiresAt(),
              items: {
                create: lines.map((line) => ({
                  variantId: line.item.variantId,
                  productId: line.item.variant.productId,
                  productName: getProductName(line.item),
                  variantName: getVariantName(line.item),
                  sku: line.item.variant.sku,
                  imageUrl: line.item.variant.imageUrl,
                  unitAmountMinor: line.unitAmountMinor,
                  quantity: line.item.quantity,
                  lineTotalMinor: line.lineTotalMinor,
                  snapshot: toOrderItemSnapshot(line.item, cart.currency),
                })),
              },
            },
            include: orderInclude,
          });

          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });

          await tx.checkoutIdempotencyKey.update({
            where: {
              userId_key: {
                userId,
                key: normalizedKey,
              },
            },
            data: {
              status: CheckoutIdempotencyStatus.SUCCEEDED,
              orderId: createdOrder.id,
            },
          });

          return createdOrder;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return toOrderEntity(order);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        const existingOrder =
          await this.checkoutIdempotencyService.findOrderByKey(
            userId,
            normalizedKey,
          );

        if (existingOrder) {
          return toOrderEntity(existingOrder);
        }
      }

      if (isPrismaError(error, 'P2034')) {
        throw new ConflictException(
          'Checkout conflicted with another transaction, please retry',
        );
      }

      throw error;
    }
  }

  private buildCheckoutLine(
    item: CartItemWithRelations,
    currency: Currency,
  ): CheckoutLine {
    if (item.quantity <= 0) {
      throw new BadRequestException(
        'Cart item quantity must be greater than 0',
      );
    }

    if (item.variant.product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        `Product for SKU ${item.variant.sku} is not active`,
      );
    }

    if (!item.variant.isActive) {
      throw new BadRequestException(
        `Product variant SKU ${item.variant.sku} is not active`,
      );
    }

    const price = getActivePrice(item, currency);

    if (!price) {
      throw new BadRequestException(
        `Product variant SKU ${item.variant.sku} has no active price`,
      );
    }

    return {
      item,
      unitAmountMinor: price.amountMinor,
      lineTotalMinor: price.amountMinor * BigInt(item.quantity),
    };
  }

  private buildShippingAddressSnapshot(
    checkoutDto: CheckoutDto,
  ): Prisma.InputJsonValue {
    const { shippingAddress: address } = checkoutDto;

    return {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? null,
      ward: address.ward ?? null,
      district: address.district,
      province: address.province,
      postalCode: address.postalCode ?? null,
      countryCode: address.countryCode ?? 'VN',
    };
  }

  private getPaymentExpiresAt(): Date {
    return new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const datePart = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('');
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `ORD-${datePart}-${randomPart}`;
  }
}
