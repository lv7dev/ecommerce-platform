import { Module } from '@nestjs/common';
import { ProductVariantPriceController } from './product-variant-price.controller';
import { ProductVariantPriceService } from './product-variant-price.service';

@Module({
  controllers: [ProductVariantPriceController],
  providers: [ProductVariantPriceService],
})
export class ProductVariantPriceModule {}
