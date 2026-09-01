import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  Currency,
  Locale,
  ProductStatus,
} from '../../../generated/prisma/client';

export class FindProductsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: Locale, example: Locale.vi })
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 'Luma' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description:
      'Search by product text, slug, SKU, category, or option value.',
    example: 'ao thun black',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter products in a category.',
  })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({
    enum: Currency,
    description: 'Currency used when filtering variant prices.',
    example: Currency.VND,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Minimum amount in minor units for an active variant price.',
    example: '100000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  minAmountMinor?: string;

  @ApiPropertyOptional({
    description: 'Maximum amount in minor units for an active variant price.',
    example: '500000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  maxAmountMinor?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'brand'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'brand'])
  sortBy?: 'createdAt' | 'updatedAt' | 'brand' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
