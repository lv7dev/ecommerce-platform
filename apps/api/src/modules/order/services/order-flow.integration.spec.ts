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
import { CartWithRelations } from '../../cart/constants/cart.include';
import { OrderWithRelations } from '../constants/order.include';
import { CheckoutDto } from '../dto/checkout.dto';
import { CheckoutIdempotencyService } from './checkout-idempotency.service';
import { CheckoutService } from './checkout.service';
import { InventoryReservationService } from './inventory-reservation.service';
import { OrderCancellationService } from './order-cancellation.service';
import { OrderExpirationService } from './order-expiration.service';

const now = new Date('2026-09-06T00:00:00.000Z');

describe('Order checkout inventory flow integration', () => {
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

  it('creates an order from cart, reserves stock, clears cart, expires unpaid order, and releases stock', async () => {
    const store = createOrderFlowStore();
    const prisma = createPrismaFake(store);
    const inventoryReservationService = new InventoryReservationService();
    const orderCancellationService = new OrderCancellationService(
      inventoryReservationService,
    );
    const orderExpirationService = new OrderExpirationService(
      prisma,
      orderCancellationService,
    );
    const checkoutService = new CheckoutService(
      prisma,
      new CheckoutIdempotencyService(prisma),
      inventoryReservationService,
      orderExpirationService,
    );

    const order = await checkoutService.checkout(
      store.userId,
      'checkout-attempt-1',
      checkoutDto,
    );

    expect(order).toMatchObject({
      currency: Currency.VND,
      fulfillmentStatus: FulfillmentStatus.PENDING,
      items: [
        {
          productName: 'Ao thun cotton basic',
          quantity: 2,
          unitAmountMinor: '249000',
          variantId: store.variant.id,
        },
      ],
      paymentStatus: PaymentStatus.UNPAID,
      shippingAddressSnapshot: checkoutDto.shippingAddress,
      status: OrderStatus.PENDING_PAYMENT,
      subtotalMinor: '498000',
      totalMinor: '498000',
    });
    expect(store.variant.reservedStock).toBe(2);
    expect(store.variant.stock).toBe(5);
    expect(store.cart.items).toHaveLength(0);
    expect(store.idempotencyKeys[0]).toMatchObject({
      key: 'checkout-attempt-1',
      orderId: order.id,
      status: CheckoutIdempotencyStatus.SUCCEEDED,
      userId: store.userId,
    });

    store.orders[0].expiresAt = new Date('2026-09-06T00:29:59.000Z');

    await orderExpirationService.expireUnpaidOrders();

    expect(store.orders[0]).toMatchObject({
      cancelReason: 'Payment window expired',
      expiresAt: null,
      fulfillmentStatus: FulfillmentStatus.CANCELLED,
      paymentStatus: PaymentStatus.UNPAID,
      status: OrderStatus.CANCELLED,
    });
    expect(store.orders[0].cancelledAt).toBeInstanceOf(Date);
    expect(store.variant.reservedStock).toBe(0);
    expect(store.variant.stock).toBe(5);
  });
});

interface CheckoutIdempotencyKeyRecord {
  key: string;
  orderId: string | null;
  requestHash: string;
  status: CheckoutIdempotencyStatus;
  userId: string;
}

interface OrderFlowStore {
  cart: CartWithRelations;
  idempotencyKeys: CheckoutIdempotencyKeyRecord[];
  orders: OrderWithRelations[];
  userId: string;
  variant: CartWithRelations['items'][number]['variant'];
}

function createOrderFlowStore(): OrderFlowStore {
  const userId = 'user-1';
  const variant = createVariant();
  const cartItem: CartWithRelations['items'][number] = {
    id: 'cart-item-1',
    cartId: 'cart-1',
    variantId: variant.id,
    quantity: 2,
    createdAt: now,
    updatedAt: now,
    variant,
  };

  return {
    cart: {
      id: cartItem.cartId,
      userId,
      currency: Currency.VND,
      createdAt: now,
      updatedAt: now,
      items: [cartItem],
    },
    idempotencyKeys: [],
    orders: [],
    userId,
    variant,
  };
}

function createVariant(): CartWithRelations['items'][number]['variant'] {
  return {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'BASIC-TEE-BLACK-M',
    barcode: null,
    imageUrl: null,
    stock: 5,
    reservedStock: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    product: {
      id: 'product-1',
      brand: 'Luma',
      status: ProductStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      translations: [
        {
          id: 'product-translation-1',
          productId: 'product-1',
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
        id: 'price-1',
        variantId: 'variant-1',
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

function createPrismaFake(store: OrderFlowStore): PrismaService {
  const tx = {
    $executeRaw: jest.fn(
      (strings: TemplateStringsArray, ...values: unknown[]) =>
        executeInventoryQuery(store, strings.join(' '), values),
    ),
    cart: {
      findUnique: jest.fn(({ where }: { where: { userId: string } }) =>
        Promise.resolve(where.userId === store.userId ? store.cart : null),
      ),
    },
    cartItem: {
      deleteMany: jest.fn(({ where }: { where: { cartId: string } }) => {
        const deletedCount = store.cart.items.filter(
          (item) => item.cartId === where.cartId,
        ).length;

        store.cart.items = store.cart.items.filter(
          (item) => item.cartId !== where.cartId,
        );

        return Promise.resolve({ count: deletedCount });
      }),
    },
    checkoutIdempotencyKey: {
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            key: string;
            requestHash: string;
            status: CheckoutIdempotencyStatus;
            userId: string;
          };
        }) => {
          store.idempotencyKeys.push({
            ...data,
            orderId: null,
          });

          return Promise.resolve(data);
        },
      ),
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { userId_key: { key: string; userId: string } };
        }) => {
          const existingKey = findIdempotencyKey(store, where.userId_key);

          return Promise.resolve(
            existingKey
              ? {
                  ...existingKey,
                  order: existingKey.orderId
                    ? findOrder(store, existingKey.orderId)
                    : null,
                }
              : null,
          );
        },
      ),
      update: jest.fn(
        ({
          data,
          where,
        }: {
          data: {
            orderId: string;
            status: CheckoutIdempotencyStatus;
          };
          where: { userId_key: { key: string; userId: string } };
        }) => {
          const existingKey = findIdempotencyKey(store, where.userId_key);

          if (!existingKey) {
            throw new Error('Checkout idempotency key not found');
          }

          existingKey.orderId = data.orderId;
          existingKey.status = data.status;

          return Promise.resolve(existingKey);
        },
      ),
    },
    order: {
      create: jest.fn(({ data }: { data: CreateOrderData }) => {
        const createdOrder: OrderWithRelations = {
          id: `order-${store.orders.length + 1}`,
          orderNumber: data.orderNumber,
          userId: data.userId,
          currency: data.currency,
          status: data.status,
          paymentStatus: data.paymentStatus,
          fulfillmentStatus: data.fulfillmentStatus,
          subtotalMinor: data.subtotalMinor,
          discountMinor: 0n,
          shippingFeeMinor: 0n,
          taxMinor: 0n,
          totalMinor: data.totalMinor,
          note: data.note,
          shippingAddressSnapshot: data.shippingAddressSnapshot,
          expiresAt: data.expiresAt,
          cancelledAt: null,
          cancelReason: null,
          createdAt: now,
          updatedAt: now,
          items: data.items.create.map((item, index) => ({
            id: `order-item-${index + 1}`,
            orderId: `order-${store.orders.length + 1}`,
            variantId: item.variantId,
            productId: item.productId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            imageUrl: item.imageUrl,
            unitAmountMinor: item.unitAmountMinor,
            quantity: item.quantity,
            lineTotalMinor: item.lineTotalMinor,
            snapshot: item.snapshot,
            createdAt: now,
          })),
        };

        store.orders.push(createdOrder);

        return Promise.resolve(createdOrder);
      }),
      findMany: jest.fn(({ where, take }: FindManyOrdersArgs) =>
        Promise.resolve(
          store.orders
            .filter((order) => isExpiredPendingUnpaidOrder(order, where))
            .slice(0, take),
        ),
      ),
      findUniqueOrThrow: jest.fn(({ where }: { where: { id: string } }) => {
        const order = findOrder(store, where.id);

        if (!order) {
          throw new Error('Order not found');
        }

        return Promise.resolve(order);
      }),
      updateMany: jest.fn(({ data, where }: UpdateManyOrdersArgs) => {
        const order = store.orders.find(
          (candidate) =>
            candidate.id === where.id &&
            candidate.status === where.status &&
            candidate.paymentStatus === where.paymentStatus &&
            candidate.fulfillmentStatus === where.fulfillmentStatus,
        );

        if (!order) {
          return Promise.resolve({ count: 0 });
        }

        Object.assign(order, data);

        return Promise.resolve({ count: 1 });
      }),
    },
  };

  return {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    checkoutIdempotencyKey: tx.checkoutIdempotencyKey,
  } as unknown as PrismaService;
}

interface CreateOrderData {
  currency: Currency;
  expiresAt: Date;
  fulfillmentStatus: FulfillmentStatus;
  items: {
    create: Array<{
      imageUrl: string | null;
      lineTotalMinor: bigint;
      productId: string;
      productName: string;
      quantity: number;
      sku: string;
      snapshot: Prisma.JsonValue;
      unitAmountMinor: bigint;
      variantId: string;
      variantName: string | null;
    }>;
  };
  note: string | null;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  shippingAddressSnapshot: Prisma.JsonValue;
  status: OrderStatus;
  subtotalMinor: bigint;
  totalMinor: bigint;
  userId: string;
}

interface FindManyOrdersArgs {
  take: number;
  where: {
    expiresAt: {
      lte: Date;
    };
    fulfillmentStatus: FulfillmentStatus;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
  };
}

interface UpdateManyOrdersArgs {
  data: Partial<OrderWithRelations>;
  where: {
    fulfillmentStatus: FulfillmentStatus;
    id: string;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
  };
}

function executeInventoryQuery(
  store: OrderFlowStore,
  sql: string,
  values: unknown[],
) {
  if (sql.includes('FROM "products"')) {
    return Promise.resolve(reserveStock(store, values));
  }

  if (sql.includes('"reserved_stock" = "reserved_stock" -')) {
    return Promise.resolve(releaseReservation(store, values));
  }

  throw new Error(`Unsupported inventory query: ${sql}`);
}

function reserveStock(store: OrderFlowStore, values: unknown[]) {
  const quantity = Number(values[0]);
  const variantId = String(values[1]);
  const productStatus = values[2];
  const availableQuantity = store.variant.stock - store.variant.reservedStock;

  if (
    variantId !== store.variant.id ||
    productStatus !== ProductStatus.ACTIVE ||
    !store.variant.isActive ||
    store.variant.product.status !== ProductStatus.ACTIVE ||
    availableQuantity < quantity
  ) {
    return 0;
  }

  store.variant.reservedStock += quantity;

  return 1;
}

function releaseReservation(store: OrderFlowStore, values: unknown[]) {
  const quantity = Number(values[0]);
  const variantId = String(values[1]);

  if (
    variantId !== store.variant.id ||
    store.variant.reservedStock < quantity
  ) {
    return 0;
  }

  store.variant.reservedStock -= quantity;

  return 1;
}

function findIdempotencyKey(
  store: OrderFlowStore,
  where: { key: string; userId: string },
) {
  return store.idempotencyKeys.find(
    (idempotencyKey) =>
      idempotencyKey.userId === where.userId &&
      idempotencyKey.key === where.key,
  );
}

function findOrder(store: OrderFlowStore, orderId: string) {
  return store.orders.find((order) => order.id === orderId) ?? null;
}

function isExpiredPendingUnpaidOrder(
  order: OrderWithRelations,
  where: FindManyOrdersArgs['where'],
) {
  return (
    order.status === where.status &&
    order.paymentStatus === where.paymentStatus &&
    order.fulfillmentStatus === where.fulfillmentStatus &&
    order.expiresAt !== null &&
    order.expiresAt <= where.expiresAt.lte
  );
}
