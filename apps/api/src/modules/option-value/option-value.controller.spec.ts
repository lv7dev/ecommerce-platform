import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
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
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OptionValueController>(OptionValueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
