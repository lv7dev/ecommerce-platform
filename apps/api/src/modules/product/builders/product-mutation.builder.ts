import { Prisma, ProductStatus } from '../../../generated/prisma/client';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductVariantDto } from '../dto/product-variant.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

export function buildProductCreateInput(
  dto: CreateProductDto,
): Prisma.ProductCreateInput {
  return {
    brand: dto.brand ?? null,
    status: dto.status ?? ProductStatus.DRAFT,
    translations: {
      create: dto.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
        shortDescription: translation.shortDescription,
        description: translation.description,
      })),
    },
    categories: buildProductCategoryCreateInput(dto.categoryIds),
    options: buildProductOptionCreateInput(dto.optionIds),
    variants: buildProductVariantCreateInput(dto.variants),
  };
}

export function buildProductUpdateInput(
  dto: UpdateProductDto,
): Prisma.ProductUpdateInput {
  return {
    brand: dto.brand === undefined ? undefined : (dto.brand ?? null),
    status: dto.status,
    translations: dto.translations
      ? {
          deleteMany: {},
          create: dto.translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
            shortDescription: translation.shortDescription,
            description: translation.description,
          })),
        }
      : undefined,
    categories: dto.categoryIds
      ? {
          deleteMany: {},
          create: dto.categoryIds.map((categoryId) => ({
            categoryId,
          })),
        }
      : undefined,
    options: dto.optionIds
      ? {
          deleteMany: {},
          create: dto.optionIds.map((optionId, position) => ({
            optionId,
            position,
          })),
        }
      : undefined,
    variants: dto.variants
      ? {
          deleteMany: {},
          create: dto.variants.map((variant) =>
            buildProductVariantCreateInputItem(variant),
          ),
        }
      : undefined,
  };
}

function buildProductCategoryCreateInput(categoryIds?: string[]) {
  if (!categoryIds?.length) {
    return undefined;
  }

  return {
    create: categoryIds.map((categoryId) => ({ categoryId })),
  };
}

function buildProductOptionCreateInput(optionIds?: string[]) {
  if (!optionIds?.length) {
    return undefined;
  }

  return {
    create: optionIds.map((optionId, position) => ({
      optionId,
      position,
    })),
  };
}

function buildProductVariantCreateInput(variants?: ProductVariantDto[]) {
  if (!variants?.length) {
    return undefined;
  }

  return {
    create: variants.map((variant) =>
      buildProductVariantCreateInputItem(variant),
    ),
  };
}

function buildProductVariantCreateInputItem(variant: ProductVariantDto) {
  return {
    sku: variant.sku,
    barcode: variant.barcode ?? null,
    imageUrl: variant.imageUrl ?? null,
    stock: variant.stock ?? 0,
    isActive: variant.isActive ?? true,
    optionValues: variant.optionValueIds?.length
      ? {
          create: variant.optionValueIds.map((optionValueId) => ({
            optionValueId,
          })),
        }
      : undefined,
    prices: variant.prices?.length
      ? {
          create: variant.prices.map((price) => ({
            currency: price.currency,
            amountMinor: BigInt(price.amountMinor),
            compareAtAmountMinor:
              price.compareAtAmountMinor === undefined
                ? null
                : BigInt(price.compareAtAmountMinor),
            isActive: price.isActive ?? true,
            startsAt: price.startsAt ? new Date(price.startsAt) : null,
            endsAt: price.endsAt ? new Date(price.endsAt) : null,
          })),
        }
      : undefined,
  };
}
