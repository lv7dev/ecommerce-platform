import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Locale, Prisma, ProductStatus } from '../../generated/prisma/client';
import { productInclude } from './constants/product.include';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  const prismaServiceMock = {
    product: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    productSearchDocument: {},
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds a product by localized slug', async () => {
    const product = createProductRecord();

    prismaServiceMock.product.findFirst.mockResolvedValue(product);

    await expect(
      service.findBySlug(Locale.vi, 'ao-thun-cotton'),
    ).resolves.toEqual({
      brand: 'Luma',
      categories: [],
      createdAt: '2026-09-01T00:00:00.000Z',
      id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      options: [],
      status: ProductStatus.ACTIVE,
      translations: [
        {
          description: 'Ao thun cotton mem.',
          id: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          locale: Locale.vi,
          name: 'Ao thun cotton',
          shortDescription: 'Ao thun basic',
          slug: 'ao-thun-cotton',
        },
      ],
      updatedAt: '2026-09-02T00:00:00.000Z',
      variants: [],
    });

    expect(prismaServiceMock.product.findFirst).toHaveBeenCalledWith({
      include: productInclude,
      where: {
        translations: {
          some: {
            locale: Locale.vi,
            slug: 'ao-thun-cotton',
          },
        },
      },
    });
  });

  it('throws not found when localized slug does not match a product', async () => {
    prismaServiceMock.product.findFirst.mockResolvedValue(null);

    await expect(
      service.findBySlug(Locale.en, 'missing-product'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates submitted variants and deactivates omitted variants instead of deleting them', async () => {
    const productId = '018f4d7b-7ef3-4b77-9f35-05a34f968d7e';
    const existingVariantId = '218f4d7b-7ef3-4b77-9f35-05a34f968d7e';
    const omittedVariantId = '318f4d7b-7ef3-4b77-9f35-05a34f968d7e';
    const createdVariantId = '418f4d7b-7ef3-4b77-9f35-05a34f968d7e';
    const product = createProductRecord();
    const tx = createTransactionMock(product, createdVariantId);

    prismaServiceMock.product.findUnique.mockResolvedValue(product);
    prismaServiceMock.$transaction.mockImplementation(runTransactionWith(tx));

    await service.update(productId, {
      variants: [
        {
          id: existingVariantId,
          optionValueIds: ['518f4d7b-7ef3-4b77-9f35-05a34f968d7e'],
          prices: [
            {
              amountMinor: '249000',
              currency: 'VND',
            },
          ],
          sku: 'BASIC-TEE-BLACK-M',
          stock: 20,
        },
        {
          prices: [
            {
              amountMinor: '199000',
              currency: 'VND',
            },
          ],
          sku: 'BASIC-TEE-WHITE-M',
          stock: 12,
        },
      ],
    });

    const productUpdateArgs = getMockCallArg<Prisma.ProductUpdateArgs>(
      tx.product.update,
    );

    expect(productUpdateArgs.where).toEqual({ id: productId });
    expect(productUpdateArgs.data).toHaveProperty('variants', undefined);
    expect(tx.productVariant.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        sku: true,
      },
      where: { productId },
    });

    const variantUpdateArgs = getMockCallArg<Prisma.ProductVariantUpdateArgs>(
      tx.productVariant.update,
    );
    const variantUpdateData =
      variantUpdateArgs.data as VariantUpdateDataForAssert;

    expect(variantUpdateArgs.where).toEqual({ id: existingVariantId });
    expect(variantUpdateData).toMatchObject({
      isActive: true,
      optionValues: {
        create: [
          {
            optionValue: {
              connect: { id: '518f4d7b-7ef3-4b77-9f35-05a34f968d7e' },
            },
          },
        ],
        deleteMany: {},
      },
      prices: {
        deleteMany: {},
      },
      sku: 'BASIC-TEE-BLACK-M',
      stock: 20,
    });
    expect(variantUpdateData.prices?.create[0]).toEqual(
      expect.objectContaining({
        amountMinor: BigInt(249000),
        currency: 'VND',
      }),
    );

    const variantCreateArgs = getMockCallArg<Prisma.ProductVariantCreateArgs>(
      tx.productVariant.create,
    );
    const variantCreateData =
      variantCreateArgs.data as VariantCreateDataForAssert;

    expect(variantCreateArgs.select).toEqual({
      id: true,
    });
    expect(variantCreateData).toMatchObject({
      product: {
        connect: { id: productId },
      },
      sku: 'BASIC-TEE-WHITE-M',
      stock: 12,
    });
    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({
      data: {
        isActive: false,
      },
      where: {
        id: { in: [omittedVariantId] },
        productId,
      },
    });
  });

  it('throws not found when updating a variant ID outside the product', async () => {
    const product = createProductRecord();
    const tx = createTransactionMock(product);

    prismaServiceMock.product.findUnique.mockResolvedValue(product);
    prismaServiceMock.$transaction.mockImplementation(runTransactionWith(tx));

    await expect(
      service.update(product.id, {
        variants: [
          {
            id: '918f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            sku: 'UNKNOWN-SKU',
          },
        ],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

function createProductRecord() {
  return {
    brand: 'Luma',
    categories: [],
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
    options: [],
    status: ProductStatus.ACTIVE,
    translations: [
      {
        description: 'Ao thun cotton mem.',
        id: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
        locale: Locale.vi,
        name: 'Ao thun cotton',
        shortDescription: 'Ao thun basic',
        slug: 'ao-thun-cotton',
      },
    ],
    updatedAt: new Date('2026-09-02T00:00:00.000Z'),
    variants: [],
  };
}

function createTransactionMock(
  product = createProductRecord(),
  createdVariantId = '418f4d7b-7ef3-4b77-9f35-05a34f968d7e',
) {
  return {
    product: {
      findUnique: jest.fn().mockResolvedValue(product),
      findUniqueOrThrow: jest.fn().mockResolvedValue(product),
      update: jest.fn(),
    },
    productSearchDocument: {
      upsert: jest.fn(),
    },
    productVariant: {
      create: jest.fn().mockResolvedValue({ id: createdVariantId }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          sku: 'BASIC-TEE-BLACK-M',
        },
        {
          id: '318f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          sku: 'BASIC-TEE-BLUE-M',
        },
      ]),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

type TransactionMock = ReturnType<typeof createTransactionMock>;

type VariantUpdateDataForAssert = {
  isActive?: boolean;
  optionValues?: {
    create: {
      optionValue: {
        connect: {
          id: string;
        };
      };
    }[];
    deleteMany: Record<string, never>;
  };
  prices?: {
    create: {
      amountMinor: bigint;
      currency: string;
    }[];
    deleteMany: Record<string, never>;
  };
  sku?: string;
  stock?: number;
};

type VariantCreateDataForAssert = {
  product?: {
    connect: {
      id: string;
    };
  };
  sku?: string;
  stock?: number;
};

function runTransactionWith(tx: TransactionMock) {
  return <T>(callback: (client: TransactionMock) => Promise<T>): Promise<T> =>
    callback(tx);
}

function getMockCallArg<TArg>(
  mock: { mock: { calls: [TArg, ...unknown[]][] } },
  callIndex = 0,
): TArg {
  const call = mock.mock.calls[callIndex];

  if (!call) {
    throw new Error(`Expected mock call at index ${callIndex}`);
  }

  return call[0];
}
