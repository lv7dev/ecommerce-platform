import type { CartItem } from '@/features/cart/types';
import type {
  Currency,
  Locale,
  Product,
  ProductEmbeddedCategory,
  ProductEmbeddedVariant,
  ProductEmbeddedOption,
  ProductVariantOptionValueSummary,
  ProductTranslation,
  ProductVariantPriceSummary,
} from './types';

export interface ProductCardViewModel {
  availableStock: number;
  brand: string | null;
  categories: string[];
  compareAtAmountMinor: number | null;
  currency: Currency;
  description: string | null;
  href: string;
  id: string;
  imageUrl: string | null;
  name: string;
  priceAmountMinor: number | null;
  slug: string;
  variantId: string | null;
  variantCount: number;
}

export function toProductCardViewModel(
  product: Product,
  locale: Locale = 'vi',
  currency: Currency = 'VND',
): ProductCardViewModel {
  const translation = getLocalizedTranslation(product.translations, locale);
  const variant = getPrimaryVariant(product.variants, currency);
  const price = variant ? getActivePrice(variant.prices, currency) : null;
  const categories = product.categories
    .map((category) => getLocalizedCategoryName(category, locale))
    .filter((category): category is string => Boolean(category));

  return {
    availableStock: variant?.availableStock ?? 0,
    brand: product.brand,
    categories,
    compareAtAmountMinor: price?.compareAtAmountMinor ? Number(price.compareAtAmountMinor) : null,
    currency: price?.currency ?? currency,
    description: translation?.shortDescription ?? translation?.description ?? null,
    href: translation ? `/products/${translation.slug}` : `/products/${product.id}`,
    id: product.id,
    imageUrl: variant?.imageUrl ?? null,
    name: translation?.name ?? product.brand ?? 'Untitled product',
    priceAmountMinor: price ? Number(price.amountMinor) : null,
    slug: translation?.slug ?? product.id,
    variantId: variant?.id ?? null,
    variantCount: product.variants.length,
  };
}

export function getLocalizedTranslation(translations: ProductTranslation[], locale: Locale) {
  return (
    translations.find((translation) => translation.locale === locale) ?? translations[0] ?? null
  );
}

export function getPrimaryVariant(variants: ProductEmbeddedVariant[], currency: Currency) {
  return (
    getPurchasableVariant(variants, currency) ??
    variants.find(
      (variant) =>
        variant.isActive && variant.prices.some((price) => isUsablePrice(price, currency)),
    ) ??
    variants.find((variant) => variant.isActive) ??
    variants[0] ??
    null
  );
}

export function getPurchasableVariant(variants: ProductEmbeddedVariant[], currency: Currency) {
  return (
    variants.find(
      (variant) =>
        variant.isActive &&
        variant.availableStock > 0 &&
        Boolean(getActivePrice(variant.prices, currency)),
    ) ?? null
  );
}

export function getActivePrice(prices: ProductVariantPriceSummary[], currency: Currency) {
  const now = Date.now();

  return (
    prices.find((price) => {
      if (!isUsablePrice(price, currency)) {
        return false;
      }

      const startsAt = price.startsAt ? Date.parse(price.startsAt) : null;
      const endsAt = price.endsAt ? Date.parse(price.endsAt) : null;

      return (startsAt === null || startsAt <= now) && (endsAt === null || endsAt >= now);
    }) ??
    prices.find((price) => isUsablePrice(price, currency)) ??
    null
  );
}

export function toGuestCartItem(
  product: Product,
  variant: ProductEmbeddedVariant,
  locale: Locale = 'vi',
  currency: Currency = 'VND',
  quantity = 1,
): CartItem | null {
  const translation = getLocalizedTranslation(product.translations, locale);
  const price = getActivePrice(variant.prices, currency);

  if (!price) {
    return null;
  }

  return {
    availableStock: variant.availableStock,
    createdAt: new Date().toISOString(),
    currency,
    id: variant.id,
    imageUrl: variant.imageUrl,
    isAvailable: product.status === 'ACTIVE' && variant.isActive && variant.availableStock > 0,
    lineTotalMinor: (BigInt(price.amountMinor) * BigInt(quantity)).toString(),
    optionValues: variant.optionValues.map((optionValue) => ({
      optionCode: optionValue.optionCode,
      optionName: getOptionName(product.options, optionValue.optionCode, locale),
      valueCode: optionValue.code,
      valueName: getOptionValueName(optionValue, locale),
    })),
    productId: product.id,
    productName: translation?.name ?? product.brand ?? variant.sku,
    quantity,
    reservedStock: variant.reservedStock,
    sku: variant.sku,
    stock: variant.stock,
    unavailableReason: null,
    unitAmountMinor: price.amountMinor,
    updatedAt: new Date().toISOString(),
    variantId: variant.id,
    variantName: formatVariantName(product, variant, locale),
  };
}

export function formatVariantName(
  product: Product,
  variant: ProductEmbeddedVariant,
  locale: Locale,
) {
  const optionValues = sortOptionValues(product, variant.optionValues);

  if (!optionValues.length) {
    return null;
  }

  return optionValues
    .map((optionValue) => {
      const optionName = getOptionName(product.options, optionValue.optionCode, locale);
      const valueName = getOptionValueName(optionValue, locale);

      return `${optionName}: ${valueName}`;
    })
    .join(' / ');
}

function isUsablePrice(price: ProductVariantPriceSummary, currency: Currency) {
  return price.currency === currency && price.isActive;
}

function getLocalizedCategoryName(category: ProductEmbeddedCategory, locale: Locale) {
  return (
    category.translations.find((translation) => translation.locale === locale)?.name ??
    category.translations[0]?.name ??
    null
  );
}

function sortOptionValues(product: Product, optionValues: ProductVariantOptionValueSummary[]) {
  return [...optionValues].sort((left, right) => {
    const leftIndex = product.options.findIndex((option) => option.code === left.optionCode);
    const rightIndex = product.options.findIndex((option) => option.code === right.optionCode);

    return normalizeOptionIndex(leftIndex) - normalizeOptionIndex(rightIndex);
  });
}

function normalizeOptionIndex(index: number) {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getOptionName(options: ProductEmbeddedOption[], optionCode: string, locale: Locale) {
  const option = options.find((item) => item.code === optionCode);

  return (
    option?.translations.find((translation) => translation.locale === locale)?.name ??
    option?.translations[0]?.name ??
    optionCode
  );
}

function getOptionValueName(optionValue: ProductVariantOptionValueSummary, locale: Locale) {
  return (
    optionValue.translations.find((translation) => translation.locale === locale)?.value ??
    optionValue.translations[0]?.value ??
    optionValue.code
  );
}
