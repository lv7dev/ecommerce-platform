import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { validateEnvironment } from './config/env.validation';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { OptionModule } from './modules/option/option.module';
import { OptionValueModule } from './modules/option-value/option-value.module';
import { ProductVariantModule } from './modules/product-variant/product-variant.module';
import { ProductVariantPriceModule } from './modules/product-variant-price/product-variant-price.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    CategoryModule,
    OptionModule,
    OptionValueModule,
    AuthModule,
    UserModule,
    ProductModule,
    ProductVariantModule,
    ProductVariantPriceModule,
    CartModule,
    OrderModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
