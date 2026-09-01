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
import { Currency, Locale, ProductStatus } from '../../generated/prisma/client';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  CategoryTranslationEntity,
  ProductCategoryEntity,
  ProductEntity,
  ProductListEntity,
  ProductOptionEntity,
  ProductOptionValueEntity,
  ProductTranslationEntity,
  ProductVariantEntity,
  ProductVariantOptionValueEntity,
  ProductVariantPriceEntity,
} from './entities/product.entity';

const apiSuccessResponseSchema = (
  model: typeof ProductEntity | typeof ProductListEntity,
) => ({
  schema: {
    allOf: [
      {
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
    ],
  },
});

const apiErrorResponseSchema = (statusCode: number, message: string) => ({
  schema: {
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: statusCode },
      message: { oneOf: [{ type: 'string' }, { type: 'array' }] },
      error: { type: 'string', example: message },
      path: { type: 'string', example: '/api/products' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Products')
@ApiExtraModels(
  ProductEntity,
  ProductListEntity,
  ProductTranslationEntity,
  ProductCategoryEntity,
  CategoryTranslationEntity,
  ProductOptionEntity,
  ProductOptionValueEntity,
  ProductVariantEntity,
  ProductVariantOptionValueEntity,
  ProductVariantPriceEntity,
)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'Create a product with translations and variants' })
  @ApiCreatedResponse(apiSuccessResponseSchema(ProductEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @ApiOperation({ summary: 'List products with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'locale', required: false, enum: Locale })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatus,
  })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'currency', required: false, enum: Currency })
  @ApiQuery({ name: 'minAmountMinor', required: false, type: String })
  @ApiQuery({ name: 'maxAmountMinor', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'brand'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse(apiSuccessResponseSchema(ProductListEntity))
  @Get()
  findAll(@Query() query: FindProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a product by localized slug' })
  @ApiParam({ name: 'locale', enum: Locale })
  @ApiParam({ name: 'slug', example: 'ao-thun-cotton-basic' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get('slug/:locale/:slug')
  findBySlug(
    @Param('locale', new ParseEnumPipe(Locale)) locale: Locale,
    @Param('slug') slug: string,
  ) {
    return this.productService.findBySlug(locale, slug);
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a product and replace submitted relations' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
}
