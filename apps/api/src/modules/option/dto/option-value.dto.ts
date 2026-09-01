import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OptionValueTranslationDto } from './option-value-translation.dto';

export class OptionValueDto {
  @ApiProperty({ example: 'black' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  code: string;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiProperty({ type: [OptionValueTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((translation: OptionValueTranslationDto) => translation.locale)
  @ValidateNested({ each: true })
  @Type(() => OptionValueTranslationDto)
  translations: OptionValueTranslationDto[];
}
