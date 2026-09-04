import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ProductVariantPriceController } from './product-variant-price.controller';
import { ProductVariantPriceService } from './product-variant-price.service';

describe('ProductVariantPriceController', () => {
  let controller: ProductVariantPriceController;
  const productVariantPriceServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductVariantPriceController],
      providers: [
        {
          provide: ProductVariantPriceService,
          useValue: productVariantPriceServiceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductVariantPriceController>(
      ProductVariantPriceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
