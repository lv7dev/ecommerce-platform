import { Locale } from '../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

type ProductMutationClient = Pick<
  PrismaService,
  'product' | 'productSearchDocument'
>;

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function syncProductSearchDocuments(
  client: ProductMutationClient,
  productId: string,
): Promise<void> {
  const product = await client.product.findUnique({
    where: { id: productId },
    include: {
      translations: true,
      categories: {
        include: {
          category: {
            include: {
              translations: true,
            },
          },
        },
      },
      variants: {
        include: {
          optionValues: {
            include: {
              optionValue: {
                include: {
                  translations: true,
                  option: {
                    include: {
                      translations: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product) {
    return;
  }

  const sharedContent = [
    product.brand,
    ...product.translations.flatMap((translation) => [
      translation.name,
      translation.slug,
      translation.shortDescription,
      translation.description,
    ]),
    ...product.categories.flatMap(({ category }) =>
      category.translations.flatMap((translation) => [
        translation.name,
        translation.slug,
        translation.description,
      ]),
    ),
    ...product.variants.flatMap((variant) => [
      variant.sku,
      variant.barcode,
      ...variant.optionValues.flatMap(({ optionValue }) => [
        optionValue.code,
        ...optionValue.translations.map((translation) => translation.value),
        optionValue.option.code,
        ...optionValue.option.translations.map(
          (translation) => translation.name,
        ),
      ]),
    ]),
  ]
    .filter(Boolean)
    .join(' ');

  for (const locale of Object.values(Locale)) {
    await client.productSearchDocument.upsert({
      where: {
        productId_locale: {
          productId,
          locale,
        },
      },
      create: {
        productId,
        locale,
        content: sharedContent,
        normalizedContent: normalizeSearchText(sharedContent),
      },
      update: {
        content: sharedContent,
        normalizedContent: normalizeSearchText(sharedContent),
      },
    });
  }
}
