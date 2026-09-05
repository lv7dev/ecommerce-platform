import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CheckoutIdempotencyService } from './services/checkout-idempotency.service';
import { CheckoutService } from './services/checkout.service';
import { InventoryReservationService } from './services/inventory-reservation.service';
import { OrderCancellationService } from './services/order-cancellation.service';
import { OrderExpirationService } from './services/order-expiration.service';
import { OrderStatusService } from './services/order-status.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    CheckoutService,
    CheckoutIdempotencyService,
    InventoryReservationService,
    OrderCancellationService,
    OrderExpirationService,
    OrderStatusService,
  ],
})
export class OrderModule {}
