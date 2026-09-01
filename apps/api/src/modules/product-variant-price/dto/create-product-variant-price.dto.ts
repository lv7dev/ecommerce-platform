import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Currency } from '../../../generated/prisma/client';

export class CreateProductVariantPriceDto {
  @ApiProperty({ enum: Currency, example: Currency.VND })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({
    example: '249000',
    description: 'Amount in minor units. VND 249000 = 249,000 VND.',
  })
  @IsString()
  @Matches(/^\d+$/)
  amountMinor: string;

  @ApiPropertyOptional({
    example: '299000',
    description: 'Original amount in minor units.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  compareAtAmountMinor?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
