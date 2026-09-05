import { ProductVariantWithRelations } from '../constants/product-variant.include';
import { ProductVariantEntity } from '../entities/product-variant.entity';

export function toProductVariantEntity(
  variant: ProductVariantWithRelations,
): ProductVariantEntity {
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    barcode: variant.barcode,
    imageUrl: variant.imageUrl,
    stock: variant.stock,
    reservedStock: variant.reservedStock,
    availableStock: variant.stock - variant.reservedStock,
    isActive: variant.isActive,
    optionValues: variant.optionValues.map(({ optionValue }) => ({
      id: optionValue.id,
      code: optionValue.code,
      optionCode: optionValue.option.code,
      translations: optionValue.translations.map((translation) => ({
        locale: translation.locale,
        value: translation.value,
      })),
    })),
    prices: variant.prices.map((price) => ({
      id: price.id,
      currency: price.currency,
      amountMinor: price.amountMinor.toString(),
      compareAtAmountMinor: price.compareAtAmountMinor?.toString() ?? null,
      isActive: price.isActive,
      startsAt: price.startsAt?.toISOString() ?? null,
      endsAt: price.endsAt?.toISOString() ?? null,
    })),
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  };
}
