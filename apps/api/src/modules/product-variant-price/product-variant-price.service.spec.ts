import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ProductVariantPriceService } from './product-variant-price.service';

describe('ProductVariantPriceService', () => {
  let service: ProductVariantPriceService;
  const prismaServiceMock = {
    productVariantPrice: {},
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariantPriceService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProductVariantPriceService>(
      ProductVariantPriceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
