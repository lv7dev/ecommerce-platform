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
import { Currency } from '../../generated/prisma/client';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { FindProductVariantsQueryDto } from './dto/find-product-variants-query.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import {
  ProductVariantEntity,
  ProductVariantListEntity,
  ProductVariantOptionValueEntity,
  ProductVariantPriceEntity,
} from './entities/product-variant.entity';
import { ProductVariantService } from './product-variant.service';

const apiSuccessResponseSchema = (
  model: typeof ProductVariantEntity | typeof ProductVariantListEntity,
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
      path: { type: 'string', example: '/api/product-variants' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Product Variants')
@ApiExtraModels(
  ProductVariantEntity,
  ProductVariantListEntity,
  ProductVariantOptionValueEntity,
  ProductVariantPriceEntity,
)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller()
export class ProductVariantController {
  constructor(private readonly productVariantService: ProductVariantService) {}

  @ApiOperation({ summary: 'Create a variant under a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiCreatedResponse(apiSuccessResponseSchema(ProductVariantEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @Post('products/:productId/variants')
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createProductVariantDto: CreateProductVariantDto,
  ) {
    return this.productVariantService.create(
      productId,
      createProductVariantDto,
    );
  }

  @ApiOperation({ summary: 'List variants under a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'optionValueId', required: false, type: String })
  @ApiQuery({ name: 'currency', required: false, enum: Currency })
  @ApiQuery({ name: 'minAmountMinor', required: false, type: String })
  @ApiQuery({ name: 'maxAmountMinor', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'sku', 'stock'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantListEntity))
  @Get('products/:productId/variants')
  findAll(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: FindProductVariantsQueryDto,
  ) {
    return this.productVariantService.findAll(productId, query);
  }

  @ApiOperation({ summary: 'Get a product variant by ID' })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get('product-variants/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Patch('product-variants/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
  ) {
    return this.productVariantService.update(id, updateProductVariantDto);
  }

  @ApiOperation({ summary: 'Delete a product variant' })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Delete('product-variants/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantService.remove(id);
  }
}
