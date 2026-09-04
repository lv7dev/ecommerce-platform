import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
