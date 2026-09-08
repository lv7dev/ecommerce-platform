import { Test, TestingModule } from '@nestjs/testing';
import { Locale, ProductStatus } from '../../generated/prisma/client';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  const productServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: productServiceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductController>(ProductController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates product creation to the service', () => {
    const dto = {
      status: ProductStatus.ACTIVE,
      translations: [
        {
          locale: Locale.vi,
          name: 'Ao thun cotton',
          slug: 'ao-thun-cotton',
        },
      ],
    };
    const product = { id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e' };

    productServiceMock.create.mockReturnValue(product);

    expect(controller.create(dto)).toBe(product);
    expect(productServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('delegates list queries to the service', () => {
    const query = {
      locale: Locale.vi,
      search: 'ao thun',
      status: ProductStatus.ACTIVE,
    };
    const productList = {
      items: [],
      limit: 20,
      page: 1,
      total: 0,
      totalPages: 0,
    };

    productServiceMock.findAll.mockReturnValue(productList);

    expect(controller.findAll(query)).toBe(productList);
    expect(productServiceMock.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates localized slug lookup to the service', () => {
    const product = { id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e' };

    productServiceMock.findBySlug.mockReturnValue(product);

    expect(controller.findBySlug(Locale.vi, 'ao-thun-cotton')).toBe(product);
    expect(productServiceMock.findBySlug).toHaveBeenCalledWith(
      Locale.vi,
      'ao-thun-cotton',
    );
  });

  it('delegates update and delete operations to the service', () => {
    const id = '018f4d7b-7ef3-4b77-9f35-05a34f968d7e';
    const dto = { brand: 'Luma' };
    const product = { id };

    productServiceMock.update.mockReturnValue(product);
    productServiceMock.remove.mockReturnValue(product);

    expect(controller.update(id, dto)).toBe(product);
    expect(controller.remove(id)).toBe(product);
    expect(productServiceMock.update).toHaveBeenCalledWith(id, dto);
    expect(productServiceMock.remove).toHaveBeenCalledWith(id);
  });
});
