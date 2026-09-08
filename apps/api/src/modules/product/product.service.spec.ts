import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Locale, ProductStatus } from '../../generated/prisma/client';
import { productInclude } from './constants/product.include';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  const prismaServiceMock = {
    product: {
      findFirst: jest.fn(),
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
