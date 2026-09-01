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
import { CreateOptionDto } from './dto/create-option.dto';
import { FindOptionsQueryDto } from './dto/find-options-query.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import {
  OptionEntity,
  OptionListEntity,
  OptionTranslationEntity,
  OptionValueEntity,
  OptionValueTranslationEntity,
} from './entities/option.entity';
import { OptionService } from './option.service';

const apiSuccessResponseSchema = (
  model: typeof OptionEntity | typeof OptionListEntity,
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
      path: { type: 'string', example: '/api/options' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Options')
@ApiExtraModels(
  OptionEntity,
  OptionListEntity,
  OptionTranslationEntity,
  OptionValueEntity,
  OptionValueTranslationEntity,
)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller('options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @ApiOperation({ summary: 'Create an option with values and translations' })
  @ApiCreatedResponse(apiSuccessResponseSchema(OptionEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @Post()
  create(@Body() createOptionDto: CreateOptionDto) {
    return this.optionService.create(createOptionDto);
  }

  @ApiOperation({ summary: 'List options with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'locale', required: false, enum: Locale })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['code', 'createdAt', 'updatedAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse(apiSuccessResponseSchema(OptionListEntity))
  @Get()
  findAll(@Query() query: FindOptionsQueryDto) {
    return this.optionService.findAll(query);
  }

  @ApiOperation({ summary: 'Get an option by ID' })
  @ApiParam({ name: 'id', description: 'Option UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OptionEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an option and replace submitted values' })
  @ApiParam({ name: 'id', description: 'Option UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OptionEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOptionDto: UpdateOptionDto,
  ) {
    return this.optionService.update(id, updateOptionDto);
  }

  @ApiOperation({ summary: 'Delete an option' })
  @ApiParam({ name: 'id', description: 'Option UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OptionEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionService.remove(id);
  }
}
