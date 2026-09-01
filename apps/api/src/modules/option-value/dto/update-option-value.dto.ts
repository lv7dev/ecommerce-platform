import { PartialType } from '@nestjs/swagger';
import { CreateOptionValueDto } from './create-option-value.dto';

export class UpdateOptionValueDto extends PartialType(CreateOptionValueDto) {}
