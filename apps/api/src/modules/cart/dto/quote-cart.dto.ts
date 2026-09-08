import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency } from '../../../generated/prisma/client';

export class QuoteCartItemDto {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  @IsUUID('4')
  variantId: string;

  @ApiProperty({
    description: 'Quantity currently stored in the guest cart.',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class QuoteCartDto {
  @ApiPropertyOptional({ enum: Currency, example: Currency.VND })
  @IsOptional()
  @IsEnum(Currency)
  currency: Currency = Currency.VND;

  @ApiProperty({ type: [QuoteCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteCartItemDto)
  items: QuoteCartItemDto[];
}
