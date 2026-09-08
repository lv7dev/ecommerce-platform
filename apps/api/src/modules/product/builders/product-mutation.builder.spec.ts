import {
  Currency,
  Locale,
  ProductStatus,
} from '../../../generated/prisma/client';
import {
  buildProductCreateInput,
  buildProductUpdateInput,
} from './product-mutation.builder';

describe('product mutation builder', () => {
  it('builds create input with defaults and nested product data', () => {
    expect(
      buildProductCreateInput({
        categoryIds: ['118f4d7b-7ef3-4b77-9f35-05a34f968d7e'],
        optionIds: [
          '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          '318f4d7b-7ef3-4b77-9f35-05a34f968d7e',
        ],
        translations: [
          {
            description: 'Ao thun cotton mem.',
            locale: Locale.vi,
            name: 'Ao thun cotton',
            shortDescription: 'Ao thun basic',
            slug: 'ao-thun-cotton',
          },
        ],
        variants: [
          {
            optionValueIds: ['418f4d7b-7ef3-4b77-9f35-05a34f968d7e'],
            prices: [
              {
                amountMinor: '249000',
                compareAtAmountMinor: '299000',
                currency: Currency.VND,
                endsAt: '2026-12-31T23:59:59.999Z',
                startsAt: '2026-09-01T00:00:00.000Z',
              },
            ],
            sku: 'BASIC-TEE-BLACK-M',
            stock: 20,
          },
        ],
      }),
    ).toEqual({
      brand: null,
      categories: {
        create: [{ categoryId: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e' }],
      },
      options: {
        create: [
          {
            optionId: '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            position: 0,
          },
          {
            optionId: '318f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            position: 1,
          },
        ],
      },
      status: ProductStatus.DRAFT,
      translations: {
        create: [
          {
            description: 'Ao thun cotton mem.',
            locale: Locale.vi,
            name: 'Ao thun cotton',
            shortDescription: 'Ao thun basic',
            slug: 'ao-thun-cotton',
          },
        ],
      },
      variants: {
        create: [
          {
            barcode: null,
            imageUrl: null,
            isActive: true,
            optionValues: {
              create: [
                {
                  optionValueId: '418f4d7b-7ef3-4b77-9f35-05a34f968d7e',
                },
              ],
            },
            prices: {
              create: [
                {
                  amountMinor: BigInt(249000),
                  compareAtAmountMinor: BigInt(299000),
                  currency: Currency.VND,
                  endsAt: new Date('2026-12-31T23:59:59.999Z'),
                  isActive: true,
                  startsAt: new Date('2026-09-01T00:00:00.000Z'),
                },
              ],
            },
            sku: 'BASIC-TEE-BLACK-M',
            stock: 20,
          },
        ],
      },
    });
  });

  it('omits optional nested create inputs when arrays are empty', () => {
    expect(
      buildProductCreateInput({
        brand: 'Luma',
        categoryIds: [],
        optionIds: [],
        status: ProductStatus.ACTIVE,
        translations: [
          {
            locale: Locale.en,
            name: 'Basic cotton tee',
            slug: 'basic-cotton-tee',
          },
        ],
        variants: [],
      }),
    ).toEqual({
      brand: 'Luma',
      categories: undefined,
      options: undefined,
      status: ProductStatus.ACTIVE,
      translations: {
        create: [
          {
            description: undefined,
            locale: Locale.en,
            name: 'Basic cotton tee',
            shortDescription: undefined,
            slug: 'basic-cotton-tee',
          },
        ],
      },
      variants: undefined,
    });
  });

  it('replaces only submitted relations when building update input', () => {
    expect(
      buildProductUpdateInput({
        brand: null,
        categoryIds: ['118f4d7b-7ef3-4b77-9f35-05a34f968d7e'],
        optionIds: ['218f4d7b-7ef3-4b77-9f35-05a34f968d7e'],
        translations: [
          {
            locale: Locale.vi,
            name: 'Ao thun moi',
            slug: 'ao-thun-moi',
          },
        ],
        variants: [
          {
            barcode: '8938505974123',
            imageUrl: 'https://placehold.co/800x800?text=Tee',
            isActive: false,
            prices: [
              {
                amountMinor: '199000',
                currency: Currency.VND,
                isActive: false,
              },
            ],
            sku: 'BASIC-TEE-WHITE-M',
          },
        ],
      } as unknown as Parameters<typeof buildProductUpdateInput>[0]),
    ).toEqual({
      brand: null,
      categories: {
        create: [{ categoryId: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e' }],
        deleteMany: {},
      },
      options: {
        create: [
          {
            optionId: '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            position: 0,
          },
        ],
        deleteMany: {},
      },
      status: undefined,
      translations: {
        create: [
          {
            description: undefined,
            locale: Locale.vi,
            name: 'Ao thun moi',
            shortDescription: undefined,
            slug: 'ao-thun-moi',
          },
        ],
        deleteMany: {},
      },
      variants: {
        create: [
          {
            barcode: '8938505974123',
            imageUrl: 'https://placehold.co/800x800?text=Tee',
            isActive: false,
            optionValues: undefined,
            prices: {
              create: [
                {
                  amountMinor: BigInt(199000),
                  compareAtAmountMinor: null,
                  currency: Currency.VND,
                  endsAt: null,
                  isActive: false,
                  startsAt: null,
                },
              ],
            },
            sku: 'BASIC-TEE-WHITE-M',
            stock: 0,
          },
        ],
        deleteMany: {},
      },
    });
  });
});
