import { ProductWithRelations } from '../constants/product.include';
import { ProductEntity } from '../entities/product.entity';

export function toProductEntity(product: ProductWithRelations): ProductEntity {
  return {
    id: product.id,
    brand: product.brand,
    status: product.status,
    translations: product.translations.map((translation) => ({
      id: translation.id,
      locale: translation.locale,
      name: translation.name,
      slug: translation.slug,
      shortDescription: translation.shortDescription,
      description: translation.description,
    })),
    categories: product.categories.map(({ category }) => ({
      id: category.id,
      parentId: category.parentId,
      position: category.position,
      isActive: category.isActive,
      translations: category.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
      })),
    })),
    options: product.options.map(({ option, position }) => ({
      id: option.id,
      code: option.code,
      position,
      translations: option.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
      })),
      values: option.values.map((value) => ({
        id: value.id,
        code: value.code,
        position: value.position,
        translations: value.translations.map((translation) => ({
          locale: translation.locale,
          value: translation.value,
        })),
      })),
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      imageUrl: variant.imageUrl,
      stock: variant.stock,
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
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
