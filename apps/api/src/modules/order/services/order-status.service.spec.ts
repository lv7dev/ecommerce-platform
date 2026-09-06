import {
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderWithRelations } from '../constants/order.include';
import { InventoryReservationService } from './inventory-reservation.service';
import { OrderCancellationService } from './order-cancellation.service';
import { OrderExpirationService } from './order-expiration.service';
import { OrderStatusService } from './order-status.service';

describe('OrderStatusService', () => {
  const now = new Date('2026-09-06T00:00:00.000Z');

  function createPendingOrder(): OrderWithRelations {
    return {
      id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
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
      note: null,
      shippingAddressSnapshot: {
        fullName: 'Demo Customer',
        phone: '0901234567',
        addressLine1: '123 Nguyen Trai',
        district: 'Quan 1',
        province: 'TP. Ho Chi Minh',
        countryCode: 'VN',
      },
      expiresAt: now,
      cancelledAt: null,
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          orderId: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          variantId: '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          productId: '318f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          productName: 'Ao thun cotton basic',
          variantName: null,
          sku: 'BASIC-TEE-BLACK-M',
          imageUrl: null,
          unitAmountMinor: 249000n,
          quantity: 1,
          lineTotalMinor: 249000n,
          snapshot: {},
          createdAt: now,
        },
      ],
    };
  }

  function createService() {
    const order = createPendingOrder();
    const updatedOrder: OrderWithRelations = {
      ...order,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      expiresAt: null,
    };
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockResolvedValue(updatedOrder),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;
    const consumeReservationMock = jest.fn();
    const expireUnpaidOrdersMock = jest.fn();
    const inventoryReservationService = {
      consumeReservation: consumeReservationMock,
    } as unknown as jest.Mocked<InventoryReservationService>;
    const orderCancellationService =
      {} as unknown as jest.Mocked<OrderCancellationService>;
    const orderExpirationService = {
      expireUnpaidOrders: expireUnpaidOrdersMock,
    } as unknown as jest.Mocked<OrderExpirationService>;

    return {
      service: new OrderStatusService(
        prisma,
        inventoryReservationService,
        orderCancellationService,
        orderExpirationService,
      ),
      inventoryReservationService,
      orderExpirationService,
      consumeReservationMock,
      expireUnpaidOrdersMock,
      tx,
      order,
    };
  }

  it('marks a pending unpaid order as paid, consumes reservation, and confirms it', async () => {
    const { service, tx, consumeReservationMock, expireUnpaidOrdersMock } =
      createService();
    const dto: UpdateOrderStatusDto = {
      paymentStatus: PaymentStatus.PAID,
    };

    await expect(
      service.updateStatus('018f4d7b-7ef3-4b77-9f35-05a34f968d7e', dto),
    ).resolves.toMatchObject({
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PENDING,
      expiresAt: null,
    });
    expect(expireUnpaidOrdersMock).toHaveBeenCalledTimes(1);
    expect(consumeReservationMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.UNPAID,
      }),
    );
    expect(tx.order.update).toHaveBeenCalledTimes(1);

    const [updateArgs] = tx.order.update.mock.calls[0] as [
      {
        data: {
          status: OrderStatus;
          paymentStatus: PaymentStatus;
          fulfillmentStatus: FulfillmentStatus;
          expiresAt: Date | null;
        };
      },
    ];

    expect(updateArgs.data).toMatchObject({
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PENDING,
      expiresAt: null,
    });
  });
});
