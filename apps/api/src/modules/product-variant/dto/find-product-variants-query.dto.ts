import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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
import { Currency } from '../../../generated/prisma/client';

export class FindProductVariantsQueryDto {
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'BASIC-TEE' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter variants by selected option value.',
  })
  @IsOptional()
  @IsUUID('4')
  optionValueId?: string;

  @ApiPropertyOptional({ enum: Currency, example: Currency.VND })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ example: '100000' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  minAmountMinor?: string;

  @ApiPropertyOptional({ example: '500000' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  maxAmountMinor?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'sku', 'stock'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'sku', 'stock'])
  sortBy?: 'createdAt' | 'updatedAt' | 'sku' | 'stock' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
