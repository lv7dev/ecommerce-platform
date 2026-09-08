import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { GuestCartController } from './guest-cart.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CartController, GuestCartController],
  providers: [CartService],
})
export class CartModule {}
