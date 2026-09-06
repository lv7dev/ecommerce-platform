import {
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../../generated/prisma/client';
import { OrderWithRelations } from '../constants/order.include';
import { InventoryReservationService } from './inventory-reservation.service';
import { OrderCancellationService } from './order-cancellation.service';

describe('OrderCancellationService', () => {
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
      shippingAddressSnapshot: {},
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

  it('cancels a pending unpaid order and releases its reservation', async () => {
    const order = createPendingOrder();
    const cancelledOrder: OrderWithRelations = {
      ...order,
      status: OrderStatus.CANCELLED,
      fulfillmentStatus: FulfillmentStatus.CANCELLED,
      expiresAt: null,
      cancelledAt: now,
      cancelReason: 'Customer cancelled before payment',
    };
    const releaseReservationMock = jest.fn();
    const inventoryReservationService = {
      releaseReservation: releaseReservationMock,
    } as unknown as jest.Mocked<InventoryReservationService>;
    const service = new OrderCancellationService(inventoryReservationService);
    const tx = {
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(cancelledOrder),
      },
    };

    await expect(
      service.cancelPendingUnpaidOrder(
        tx as never,
        order,
        'Customer cancelled before payment',
      ),
    ).resolves.toMatchObject({
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.UNPAID,
      fulfillmentStatus: FulfillmentStatus.CANCELLED,
      expiresAt: null,
    });
    expect(tx.order.updateMany).toHaveBeenCalledTimes(1);

    const [updateManyArgs] = tx.order.updateMany.mock.calls[0] as [
      {
        where: {
          id: string;
          status: OrderStatus;
          paymentStatus: PaymentStatus;
          fulfillmentStatus: FulfillmentStatus;
        };
      },
    ];

    expect(updateManyArgs.where).toMatchObject({
      id: order.id,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.UNPAID,
      fulfillmentStatus: FulfillmentStatus.PENDING,
    });
    expect(releaseReservationMock).toHaveBeenCalledWith(tx, order);
  });
});
