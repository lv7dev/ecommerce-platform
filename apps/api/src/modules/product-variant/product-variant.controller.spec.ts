import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from './product-variant.service';

describe('ProductVariantController', () => {
  let controller: ProductVariantController;
  const productVariantServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductVariantController],
      providers: [
        {
          provide: ProductVariantService,
          useValue: productVariantServiceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductVariantController>(ProductVariantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
