import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OptionValueController } from './option-value.controller';
import { OptionValueService } from './option-value.service';

@Module({
  imports: [AuthModule],
  controllers: [OptionValueController],
  providers: [OptionValueService],
})
export class OptionValueModule {}
