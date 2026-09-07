import { INestApplication, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Response } from 'supertest';
import { App } from 'supertest/types';
import {
  Currency,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  UserStatus,
} from '../src/generated/prisma/client';
import { configureApp } from '../src/app.bootstrap';
import { AuthGuard } from '../src/modules/auth/guards/auth.guard';
import { PermissionsGuard } from '../src/modules/auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../src/modules/auth/types/authenticated-request.type';
import { OrderController } from '../src/modules/order/order.controller';
import { OrderService } from '../src/modules/order/order.service';

describe('OrderController (e2e)', () => {
  let app: INestApplication<App>;
  let orderServiceMock: {
    checkout: jest.Mock;
    findMine: jest.Mock;
    findOneMine: jest.Mock;
    cancelMine: jest.Mock;
    findAllAdmin: jest.Mock;
    findOneAdmin: jest.Mock;
    updateStatus: jest.Mock;
  };
  const currentUser = {
    id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
    email: 'customer@example.com',
    emailVerifiedAt: '2026-09-06T00:00:00.000Z',
    name: 'Demo Customer',
    status: UserStatus.ACTIVE,
    sessionId: 'session-1',
    roles: ['CUSTOMER'],
    permissions: ['order:create_own', 'order:read_own'],
  };
  const shippingAddress = {
    fullName: 'Demo Customer',
    phone: '0901234567',
    addressLine1: '123 Nguyen Trai',
    district: 'Quan 1',
    province: 'TP. Ho Chi Minh',
    countryCode: 'VN',
  };

  beforeEach(async () => {
    orderServiceMock = {
      checkout: jest.fn(),
      findMine: jest.fn(),
      findOneMine: jest.fn(),
      cancelMine: jest.fn(),
      findAllAdmin: jest.fn(),
      findOneAdmin: jest.fn(),
      updateStatus: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'WEB_ORIGIN'
                ? 'http://localhost:3000'
                : key === 'NODE_ENV'
                  ? 'test'
                  : undefined,
            ),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

          request.user = currentUser;

          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api/checkout (POST) requires shippingAddress', () => {
    return request(app.getHttpServer())
      .post('/api/checkout')
      .set('Idempotency-Key', 'checkout-key')
      .send({ note: 'Giao gio hanh chinh.' })
      .expect(400)
      .expect((response: Response) => {
        const body: unknown = response.body;

        expectRecord(body);
        expect(body.success).toBe(false);
        expect(orderServiceMock.checkout).not.toHaveBeenCalled();
      });
  });

  it('/api/checkout (POST) accepts shippingAddress and passes it to checkout service', () => {
    const order = {
      id: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      orderNumber: 'ORD-20260906-ABC123',
      userId: currentUser.id,
      currency: Currency.VND,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PROCESSING,
      subtotalMinor: '249000',
      discountMinor: '0',
      shippingFeeMinor: '0',
      taxMinor: '0',
      totalMinor: '249000',
      note: 'Giao gio hanh chinh.',
      shippingAddressSnapshot: shippingAddress,
      expiresAt: null,
      cancelledAt: null,
      cancelReason: null,
      items: [],
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:00:00.000Z',
    };

    orderServiceMock.checkout.mockResolvedValue(order);

    return request(app.getHttpServer())
      .post('/api/checkout')
      .set('Idempotency-Key', 'checkout-key')
      .send({
        shippingAddress,
        note: 'Giao gio hanh chinh.',
      })
      .expect(201)
      .expect((response: Response) => {
        const body: unknown = response.body;

        expectRecord(body);
        expect(body.success).toBe(true);
        expect(body.data).toEqual(order);
        expect(orderServiceMock.checkout).toHaveBeenCalledWith(
          currentUser.id,
          'checkout-key',
          {
            shippingAddress,
            note: 'Giao gio hanh chinh.',
          },
        );
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

function expectRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  expect(typeof value).toBe('object');
  expect(value).not.toBeNull();
}
