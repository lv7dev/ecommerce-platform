import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OptionValueService } from './option-value.service';

describe('OptionValueService', () => {
  let service: OptionValueService;
  const prismaServiceMock = {
    optionValue: {},
    variantOptionValue: {},
    product: {},
    productSearchDocument: {},
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionValueService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<OptionValueService>(OptionValueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
