import type {
  Currency,
  Locale,
  Product,
  ProductEmbeddedCategory,
  ProductEmbeddedVariant,
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
    variants.find(
      (variant) =>
        variant.isActive && variant.prices.some((price) => isUsablePrice(price, currency)),
    ) ??
    variants.find((variant) => variant.isActive) ??
    variants[0] ??
    null
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
