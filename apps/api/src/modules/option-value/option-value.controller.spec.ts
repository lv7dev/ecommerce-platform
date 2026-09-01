import { Test, TestingModule } from '@nestjs/testing';
import { OptionValueController } from './option-value.controller';
import { OptionValueService } from './option-value.service';

describe('OptionValueController', () => {
  let controller: OptionValueController;
  const optionValueServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptionValueController],
      providers: [
        {
          provide: OptionValueService,
          useValue: optionValueServiceMock,
        },
      ],
    }).compile();

    controller = module.get<OptionValueController>(OptionValueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
