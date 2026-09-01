import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ProductStatus } from '../../../generated/prisma/client';
import { ProductTranslationDto } from './product-translation.dto';
import { ProductVariantDto } from './product-variant.dto';

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'Luma' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ type: [ProductTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((translation: ProductTranslationDto) => translation.locale)
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations: ProductTranslationDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Category IDs attached to this product.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  categoryIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Option IDs available for this product.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  optionIds?: string[];

  @ApiPropertyOptional({ type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((variant: ProductVariantDto) => variant.sku)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
