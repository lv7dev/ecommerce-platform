import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductVariantPriceController } from './product-variant-price.controller';
import { ProductVariantPriceService } from './product-variant-price.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductVariantPriceController],
  providers: [ProductVariantPriceService],
})
export class ProductVariantPriceModule {}
