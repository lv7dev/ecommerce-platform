import { BadRequestException } from '@nestjs/common';
import {
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CartWithRelations } from '../../cart/constants/cart.include';
import { CheckoutDto } from '../dto/checkout.dto';
import { OrderWithRelations } from '../constants/order.include';
import { CheckoutService } from './checkout.service';
import { CheckoutIdempotencyService } from './checkout-idempotency.service';
import { InventoryReservationService } from './inventory-reservation.service';
import { OrderExpirationService } from './order-expiration.service';

describe('CheckoutService', () => {
  const now = new Date('2026-09-06T00:00:00.000Z');
  const checkoutDto: CheckoutDto = {
    shippingAddress: {
      fullName: 'Demo Customer',
      phone: '0901234567',
      addressLine1: '123 Nguyen Trai',
      district: 'Quan 1',
      province: 'TP. Ho Chi Minh',
      countryCode: 'VN',
    },
    note: 'Giao gio hanh chinh.',
  };

  function createVariant(): CartWithRelations['items'][number]['variant'] {
    return {
      id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      productId: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      sku: 'BASIC-TEE-BLACK-M',
      barcode: null,
      imageUrl: null,
      stock: 5,
      reservedStock: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      product: {
        id: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
        brand: 'Luma',
        status: ProductStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
        translations: [
          {
            id: '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            productId: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            locale: 'vi',
            name: 'Ao thun cotton basic',
            slug: 'ao-thun-cotton-basic',
            shortDescription: null,
            description: null,
          },
        ],
      },
      optionValues: [],
      prices: [
        {
          id: '318f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          variantId: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          currency: Currency.VND,
          amountMinor: 249000n,
          compareAtAmountMinor: null,
          isActive: true,
          startsAt: null,
          endsAt: null,
        },
      ],
    };
  }

  function createCart(items: CartWithRelations['items']): CartWithRelations {
    return {
      id: '418f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      userId: 'user-1',
      currency: Currency.VND,
      createdAt: now,
      updatedAt: now,
      items,
    };
  }

  function createCartItem(quantity = 1): CartWithRelations['items'][number] {
    const variant = createVariant();

    return {
      id: '518f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      cartId: '418f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      variantId: variant.id,
      quantity,
      createdAt: now,
      updatedAt: now,
      variant,
    };
  }

  function createOrder(cartItem = createCartItem()): OrderWithRelations {
    const shippingAddressSnapshot = { ...checkoutDto.shippingAddress };

    return {
      id: '618f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      orderNumber: 'ORD-20260906-ABC123',
      userId: 'user-1',
      currency: Currency.VND,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.UNPAID,
      fulfillmentStatus: FulfillmentStatus.PENDING,
      subtotalMinor: 249000n,
      discountMinor: 0n,
      shippingFeeMinor: 0n,
      taxMinor: 0n,
      totalMinor: 249000n,
      note: checkoutDto.note ?? null,
      shippingAddressSnapshot,
      expiresAt: now,
      cancelledAt: null,
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: '718f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          orderId: '618f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          variantId: cartItem.variantId,
          productId: cartItem.variant.productId,
          productName: 'Ao thun cotton basic',
          variantName: null,
          sku: cartItem.variant.sku,
          imageUrl: cartItem.variant.imageUrl,
          unitAmountMinor: 249000n,
          quantity: cartItem.quantity,
          lineTotalMinor: 249000n,
          snapshot: {},
          createdAt: now,
        },
      ],
    };
  }

  function createService() {
    const tx = {
      checkoutIdempotencyKey: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      cart: {
        findUnique: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
      cartItem: {
        deleteMany: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;
    const checkoutIdempotencyService = {
      normalizeKey: jest.fn((key: string | undefined) => key ?? 'key-1'),
      ensureSameCheckoutRequestWhenCartExists: jest.fn(),
      createRequestHash: jest.fn(() => 'request-hash'),
      handleExistingKey: jest.fn(),
      findOrderByKey: jest.fn(),
    } as unknown as jest.Mocked<CheckoutIdempotencyService>;
    const reserveStockMock = jest.fn();
    const expireUnpaidOrdersMock = jest.fn();
    const inventoryReservationService = {
      reserveStock: reserveStockMock,
    } as unknown as jest.Mocked<InventoryReservationService>;
    const orderExpirationService = {
      expireUnpaidOrders: expireUnpaidOrdersMock,
    } as unknown as jest.Mocked<OrderExpirationService>;

    return {
      service: new CheckoutService(
        prisma,
        checkoutIdempotencyService,
        inventoryReservationService,
        orderExpirationService,
      ),
      checkoutIdempotencyService,
      inventoryReservationService,
      orderExpirationService,
      reserveStockMock,
      expireUnpaidOrdersMock,
      tx,
    };
  }

  it('rejects checkout when the user cart is empty', async () => {
    const { service, tx } = createService();

    tx.checkoutIdempotencyKey.findUnique.mockResolvedValue(null);
    tx.cart.findUnique.mockResolvedValue(createCart([]));

    await expect(
      service.checkout('user-1', 'checkout-key', checkoutDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('creates an order from cart lines, snapshots shipping address, and clears the cart', async () => {
    const { service, tx, reserveStockMock } = createService();
    const cartItem = createCartItem();
    const cart = createCart([cartItem]);
    const order = createOrder(cartItem);

    tx.checkoutIdempotencyKey.findUnique.mockResolvedValue(null);
    tx.cart.findUnique.mockResolvedValue(cart);
    tx.order.create.mockResolvedValue(order);

    await expect(
      service.checkout('user-1', 'checkout-key', checkoutDto),
    ).resolves.toMatchObject({
      id: order.id,
      subtotalMinor: '249000',
      totalMinor: '249000',
      shippingAddressSnapshot: checkoutDto.shippingAddress,
      items: [
        {
          variantId: cartItem.variantId,
          unitAmountMinor: '249000',
          quantity: 1,
        },
      ],
    });
    expect(reserveStockMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        item: cartItem,
        unitAmountMinor: 249000n,
        lineTotalMinor: 249000n,
      }),
    );
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: cart.id },
    });
    expect(tx.checkoutIdempotencyKey.update).toHaveBeenCalledTimes(1);

    const [idempotencyUpdateArgs] = tx.checkoutIdempotencyKey.update.mock
      .calls[0] as [{ data: { orderId: string } }];

    expect(idempotencyUpdateArgs.data).toMatchObject({
      orderId: order.id,
    });
  });
});
