import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Locale } from '../../generated/prisma/client';
import { OptionValueTranslationEntity } from '../../shared/entities';
import { CreateOptionValueDto } from './dto/create-option-value.dto';
import { FindOptionValuesQueryDto } from './dto/find-option-values-query.dto';
import { UpdateOptionValueDto } from './dto/update-option-value.dto';
import {
  OptionValueDetailEntity,
  OptionValueListEntity,
  OptionValueOptionSummaryEntity,
} from './entities/option-value.entity';
import { OptionValueService } from './option-value.service';

const apiSuccessResponseSchema = (
  model: typeof OptionValueDetailEntity | typeof OptionValueListEntity,
) => ({
  schema: {
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: getSchemaPath(model) },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

const apiErrorResponseSchema = (statusCode: number, message: string) => ({
  schema: {
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: statusCode },
      message: { oneOf: [{ type: 'string' }, { type: 'array' }] },
      error: { type: 'string', example: message },
      path: { type: 'string', example: '/api/option-values' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Option Values')
@ApiExtraModels(
  OptionValueDetailEntity,
  OptionValueListEntity,
  OptionValueOptionSummaryEntity,
  OptionValueTranslationEntity,
)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller()
export class OptionValueController {
  constructor(private readonly optionValueService: OptionValueService) {}

  @ApiOperation({ summary: 'Create an option value under an option' })
  @ApiParam({ name: 'optionId', description: 'Option UUID' })
  @ApiCreatedResponse(apiSuccessResponseSchema(OptionValueDetailEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @Post('options/:optionId/values')
  create(
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Body() createOptionValueDto: CreateOptionValueDto,
  ) {
    return this.optionValueService.create(optionId, createOptionValueDto);
  }

  @ApiOperation({ summary: 'List option values under an option' })
  @ApiParam({ name: 'optionId', description: 'Option UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'locale', required: false, enum: Locale })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['position', 'code'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse(apiSuccessResponseSchema(OptionValueListEntity))
  @Get('options/:optionId/values')
  findAll(
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Query() query: FindOptionValuesQueryDto,
  ) {
    return this.optionValueService.findAll(optionId, query);
  }

  @ApiOperation({ summary: 'Get an option value by ID' })
  @ApiParam({ name: 'id', description: 'Option value UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OptionValueDetailEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get('option-values/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionValueService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an option value and replace translations' })
  @ApiParam({ name: 'id', description: 'Option value UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OptionValueDetailEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Patch('option-values/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOptionValueDto: UpdateOptionValueDto,
  ) {
    return this.optionValueService.update(id, updateOptionValueDto);
  }

  @ApiOperation({ summary: 'Delete an option value' })
  @ApiParam({ name: 'id', description: 'Option value UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OptionValueDetailEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Delete('option-values/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionValueService.remove(id);
  }
}
