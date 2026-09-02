import { ProductVariantPriceWithRelations } from '../constants/product-variant-price.include';
import { ProductVariantPriceDetailEntity } from '../entities/product-variant-price.entity';

export function toProductVariantPriceEntity(
  price: ProductVariantPriceWithRelations,
): ProductVariantPriceDetailEntity {
  return {
    id: price.id,
    variantId: price.variantId,
    currency: price.currency,
    amountMinor: price.amountMinor.toString(),
    compareAtAmountMinor: price.compareAtAmountMinor?.toString() ?? null,
    isActive: price.isActive,
    startsAt: price.startsAt?.toISOString() ?? null,
    endsAt: price.endsAt?.toISOString() ?? null,
    variant: {
      id: price.variant.id,
      productId: price.variant.productId,
      sku: price.variant.sku,
    },
  };
}
