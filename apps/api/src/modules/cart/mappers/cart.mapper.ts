import {
  Currency,
  Prisma,
  ProductStatus,
} from '../../../generated/prisma/client';
import {
  CartItemWithRelations,
  CartWithRelations,
} from '../constants/cart.include';
import { CartEntity, CartItemEntity } from '../entities/cart.entity';

export function toCartEntity(cart: CartWithRelations): CartEntity {
  const items = cart.items.map((item) => toCartItemEntity(item, cart.currency));
  const subtotalMinor = items.reduce(
    (total, item) =>
      item.lineTotalMinor === null
        ? total
        : total + BigInt(item.lineTotalMinor),
    0n,
  );

  return {
    id: cart.id,
    userId: cart.userId,
    currency: cart.currency,
    subtotalMinor: subtotalMinor.toString(),
    items,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

export function toCartItemEntity(
  item: CartItemWithRelations,
  currency: Currency,
): CartItemEntity {
  const price = getActivePrice(item, currency);
  const unavailableReason = getUnavailableReason(item, currency);
  const availableStock = getAvailableStock(item);
  const lineTotalMinor =
    price === null ? null : price.amountMinor * BigInt(item.quantity);

  return {
    id: item.id,
    variantId: item.variantId,
    productId: item.variant.productId,
    productName: getProductName(item),
    variantName: getVariantName(item),
    sku: item.variant.sku,
    imageUrl: item.variant.imageUrl,
    quantity: item.quantity,
    stock: item.variant.stock,
    reservedStock: item.variant.reservedStock,
    availableStock,
    unitAmountMinor: price?.amountMinor.toString() ?? null,
    lineTotalMinor: lineTotalMinor?.toString() ?? null,
    isAvailable: unavailableReason === null,
    unavailableReason,
    optionValues: getOptionValueSummaries(item),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function getActivePrice(
  item: CartItemWithRelations,
  currency: Currency,
): CartItemWithRelations['variant']['prices'][number] | null {
  const now = new Date();

  return (
    item.variant.prices.find(
      (price) =>
        price.currency === currency &&
        price.isActive &&
        (!price.startsAt || price.startsAt <= now) &&
        (!price.endsAt || price.endsAt >= now),
    ) ?? null
  );
}

export function getProductName(item: CartItemWithRelations): string {
  return (
    item.variant.product.translations.find(
      (translation) => translation.locale === 'vi',
    )?.name ??
    item.variant.product.translations[0]?.name ??
    item.variant.sku
  );
}

export function getVariantName(item: CartItemWithRelations): string | null {
  const optionNames = getOptionValueSummaries(item).map(
    (optionValue) => `${optionValue.optionName}: ${optionValue.valueName}`,
  );

  return optionNames.length ? optionNames.join(' / ') : null;
}

export function toOrderItemSnapshot(
  item: CartItemWithRelations,
  currency: Currency,
): Prisma.InputJsonValue {
  const price = getActivePrice(item, currency);

  return {
    product: {
      id: item.variant.productId,
      translations: item.variant.product.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
      })),
    },
    variant: {
      id: item.variantId,
      sku: item.variant.sku,
      barcode: item.variant.barcode,
      imageUrl: item.variant.imageUrl,
      optionValues: getOptionValueSummaries(item),
    },
    price: price
      ? {
          currency: price.currency,
          amountMinor: price.amountMinor.toString(),
          compareAtAmountMinor: price.compareAtAmountMinor?.toString() ?? null,
        }
      : null,
  };
}

function getUnavailableReason(
  item: CartItemWithRelations,
  currency: Currency,
): string | null {
  if (item.variant.product.status !== ProductStatus.ACTIVE) {
    return 'PRODUCT_INACTIVE';
  }

  if (!item.variant.isActive) {
    return 'VARIANT_INACTIVE';
  }

  if (getAvailableStock(item) < item.quantity) {
    return 'INSUFFICIENT_STOCK';
  }

  if (!getActivePrice(item, currency)) {
    return 'PRICE_UNAVAILABLE';
  }

  return null;
}

export function getAvailableStock(item: CartItemWithRelations): number {
  return item.variant.stock - item.variant.reservedStock;
}

function getOptionValueSummaries(item: CartItemWithRelations) {
  return item.variant.optionValues.map(({ optionValue }) => {
    const optionName =
      optionValue.option.translations.find(
        (translation) => translation.locale === 'vi',
      )?.name ??
      optionValue.option.translations[0]?.name ??
      optionValue.option.code;
    const valueName =
      optionValue.translations.find(
        (translation) => translation.locale === 'vi',
      )?.value ??
      optionValue.translations[0]?.value ??
      optionValue.code;

    return {
      optionCode: optionValue.option.code,
      optionName,
      valueCode: optionValue.code,
      valueName,
    };
  });
}
