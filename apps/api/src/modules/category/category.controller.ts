import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FindCategoriesQueryDto } from './dto/find-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryEntity,
  CategoryListEntity,
  CategorySummaryEntity,
  CategoryTranslationEntity,
} from './entities/category.entity';

const apiSuccessResponseSchema = (
  model: typeof CategoryEntity | typeof CategoryListEntity,
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
      path: { type: 'string', example: '/api/categories' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Categories')
@ApiExtraModels(
  CategoryEntity,
  CategoryListEntity,
  CategorySummaryEntity,
  CategoryTranslationEntity,
)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Create a category with translations' })
  @ApiCreatedResponse(apiSuccessResponseSchema(CategoryEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('category:create')
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @ApiOperation({ summary: 'List categories with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'locale', required: false, enum: Locale })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  @ApiQuery({ name: 'rootOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['position', 'createdAt', 'updatedAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse(apiSuccessResponseSchema(CategoryListEntity))
  @Get()
  findAll(@Query() query: FindCategoriesQueryDto) {
    return this.categoryService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a category by localized slug' })
  @ApiParam({ name: 'locale', enum: Locale })
  @ApiParam({ name: 'slug', example: 'ao-thun' })
  @ApiOkResponse(apiSuccessResponseSchema(CategoryEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get('slug/:locale/:slug')
  findBySlug(
    @Param('locale', new ParseEnumPipe(Locale)) locale: Locale,
    @Param('slug') slug: string,
  ) {
    return this.categoryService.findBySlug(locale, slug);
  }

  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(CategoryEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a category and replace translations' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(CategoryEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('category:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(CategoryEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('category:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
