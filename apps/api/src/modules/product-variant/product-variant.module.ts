import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from './product-variant.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
})
export class ProductVariantModule {}
