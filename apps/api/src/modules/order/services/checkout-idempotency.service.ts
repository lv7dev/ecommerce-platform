import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CheckoutIdempotencyStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CartWithRelations } from '../../cart/constants/cart.include';
import { CheckoutDto } from '../dto/checkout.dto';
import { orderInclude, OrderWithRelations } from '../constants/order.include';

@Injectable()
export class CheckoutIdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeKey(idempotencyKey: string | undefined): string {
    const normalizedKey = idempotencyKey?.trim();

    if (!normalizedKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    if (normalizedKey.length > 120) {
      throw new BadRequestException(
        'Idempotency-Key header must be at most 120 characters',
      );
    }

    return normalizedKey;
  }

  ensureSameCheckoutRequestWhenCartExists(
    existingRequestHash: string,
    cart: CartWithRelations | null,
    checkoutDto: CheckoutDto | undefined,
  ): void {
    if (!cart || cart.items.length === 0) {
      return;
    }

    const currentRequestHash = this.createRequestHash(cart, checkoutDto);

    if (existingRequestHash !== currentRequestHash) {
      throw new ConflictException(
        'Idempotency-Key was reused with a different checkout request',
      );
    }
  }

  handleExistingKey(existingKey: {
    status: CheckoutIdempotencyStatus;
    order: OrderWithRelations | null;
  }): OrderWithRelations {
    if (existingKey.status === CheckoutIdempotencyStatus.SUCCEEDED) {
      if (!existingKey.order) {
        throw new ConflictException(
          'Checkout idempotency key has no order result',
        );
      }

      return existingKey.order;
    }

    throw new ConflictException(
      'Checkout idempotency key is already being processed',
    );
  }

  async findOrderByKey(
    userId: string,
    key: string,
  ): Promise<OrderWithRelations | null> {
    const idempotencyKey = await this.prisma.checkoutIdempotencyKey.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      include: {
        order: {
          include: orderInclude,
        },
      },
    });

    return idempotencyKey?.order ?? null;
  }

  createRequestHash(
    cart: CartWithRelations,
    checkoutDto: CheckoutDto | undefined,
  ): string {
    const payload = {
      version: 1,
      currency: cart.currency,
      note: checkoutDto?.note ?? null,
      shippingAddress: checkoutDto?.shippingAddress ?? null,
      items: cart.items
        .map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }))
        .sort((left, right) => left.variantId.localeCompare(right.variantId)),
    };

    return createHash('sha256')
      .update(JSON.stringify(payload), 'utf8')
      .digest('hex');
  }
}
