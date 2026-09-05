import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MaxLength(32)
  phone: string;

  @ApiProperty({ example: '123 Nguyễn Trãi' })
  @IsString()
  @MaxLength(255)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Tầng 5, căn 502' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Phường Bến Thành' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ward?: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsString()
  @MaxLength(120)
  district: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsString()
  @MaxLength(120)
  province: string;

  @ApiPropertyOptional({ example: '700000' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'VN', default: 'VN' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;
}
