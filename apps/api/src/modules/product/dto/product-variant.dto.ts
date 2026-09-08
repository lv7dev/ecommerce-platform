import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductVariantPriceDto } from './product-variant-price.dto';

export class ProductVariantDto {
  @ApiPropertyOptional({
    description:
      'Existing variant ID. Used when updating products to keep historical cart and order references stable.',
    example: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
  })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiProperty({ example: 'BASIC-TEE-BLACK-M' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sku: string;

  @ApiPropertyOptional({ example: '8938505974123' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  barcode?: string;

  @ApiPropertyOptional({
    example: 'https://placehold.co/800x800?text=Basic+Cotton+T-shirt',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 20, default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'Option value IDs attached to this variant.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  optionValueIds?: string[];

  @ApiPropertyOptional({ type: [ProductVariantPriceDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((price: ProductVariantPriceDto) => price.currency)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantPriceDto)
  prices?: ProductVariantPriceDto[];
}
