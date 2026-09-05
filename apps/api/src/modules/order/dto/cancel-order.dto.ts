import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Tôi muốn thay đổi sản phẩm.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
