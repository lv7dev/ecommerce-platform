import { Module } from '@nestjs/common';
import { OptionValueController } from './option-value.controller';
import { OptionValueService } from './option-value.service';

@Module({
  controllers: [OptionValueController],
  providers: [OptionValueService],
})
export class OptionValueModule {}
