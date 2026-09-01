import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OptionService } from './option.service';

describe('OptionService', () => {
  let service: OptionService;
  const prismaServiceMock = {
    option: {},
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<OptionService>(OptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
