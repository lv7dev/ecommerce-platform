import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { OptionTranslationDto } from './option-translation.dto';
import { OptionValueDto } from './option-value.dto';

export class CreateOptionDto {
  @ApiProperty({ example: 'color' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  code: string;

  @ApiProperty({ type: [OptionTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((translation: OptionTranslationDto) => translation.locale)
  @ValidateNested({ each: true })
  @Type(() => OptionTranslationDto)
  translations: OptionTranslationDto[];

  @ApiPropertyOptional({ type: [OptionValueDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((value: OptionValueDto) => value.code)
  @ValidateNested({ each: true })
  @Type(() => OptionValueDto)
  values?: OptionValueDto[];
}
