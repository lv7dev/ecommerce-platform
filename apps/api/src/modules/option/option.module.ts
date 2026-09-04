import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OptionController } from './option.controller';
import { OptionService } from './option.service';

@Module({
  imports: [AuthModule],
  controllers: [OptionController],
  providers: [OptionService],
})
export class OptionModule {}
