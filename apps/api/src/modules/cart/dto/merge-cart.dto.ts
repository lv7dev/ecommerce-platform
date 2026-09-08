import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class MergeCartItemDto {
  @ApiProperty({ example: '018f4d7b-7ef3-7b77-9f35-05a34f968d7e' })
  @IsUUID('4')
  variantId: string;

  @ApiProperty({
    description: 'Absolute quantity to keep in the merged cart.',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class MergeCartDto {
  @ApiProperty({ type: [MergeCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items: MergeCartItemDto[];
}
