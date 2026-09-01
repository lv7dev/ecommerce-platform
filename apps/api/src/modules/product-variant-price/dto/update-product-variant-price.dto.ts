import { PartialType } from '@nestjs/swagger';
import { CreateProductVariantPriceDto } from './create-product-variant-price.dto';

export class UpdateProductVariantPriceDto extends PartialType(
  CreateProductVariantPriceDto,
) {}
