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
import { CreateProductVariantPriceDto } from './dto/create-product-variant-price.dto';
import { FindProductVariantPricesQueryDto } from './dto/find-product-variant-prices-query.dto';
import { UpdateProductVariantPriceDto } from './dto/update-product-variant-price.dto';
import {
  ProductVariantPriceDetailEntity,
  ProductVariantPriceListEntity,
  ProductVariantPriceVariantSummaryEntity,
} from './entities/product-variant-price.entity';
import { ProductVariantPriceService } from './product-variant-price.service';

const apiSuccessResponseSchema = (
  model:
    | typeof ProductVariantPriceDetailEntity
    | typeof ProductVariantPriceListEntity,
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
      path: { type: 'string', example: '/api/product-variant-prices' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Product Variant Prices')
@ApiExtraModels(
  ProductVariantPriceDetailEntity,
  ProductVariantPriceListEntity,
  ProductVariantPriceVariantSummaryEntity,
)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller()
export class ProductVariantPriceController {
  constructor(
    private readonly productVariantPriceService: ProductVariantPriceService,
  ) {}

  @ApiOperation({ summary: 'Create a price under a product variant' })
  @ApiParam({ name: 'variantId', description: 'Product variant UUID' })
  @ApiCreatedResponse(apiSuccessResponseSchema(ProductVariantPriceDetailEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @Post('product-variants/:variantId/prices')
  create(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() createPriceDto: CreateProductVariantPriceDto,
  ) {
    return this.productVariantPriceService.create(variantId, createPriceDto);
  }

  @ApiOperation({ summary: 'List prices under a product variant' })
  @ApiParam({ name: 'variantId', description: 'Product variant UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'currency', required: false, enum: Currency })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['currency', 'amountMinor', 'startsAt', 'endsAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantPriceListEntity))
  @Get('product-variants/:variantId/prices')
  findAll(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Query() query: FindProductVariantPricesQueryDto,
  ) {
    return this.productVariantPriceService.findAll(variantId, query);
  }

  @ApiOperation({ summary: 'Get a product variant price by ID' })
  @ApiParam({ name: 'id', description: 'Product variant price UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantPriceDetailEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Get('product-variant-prices/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantPriceService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a product variant price' })
  @ApiParam({ name: 'id', description: 'Product variant price UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantPriceDetailEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Patch('product-variant-prices/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePriceDto: UpdateProductVariantPriceDto,
  ) {
    return this.productVariantPriceService.update(id, updatePriceDto);
  }

  @ApiOperation({ summary: 'Delete a product variant price' })
  @ApiParam({ name: 'id', description: 'Product variant price UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(ProductVariantPriceDetailEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Delete('product-variant-prices/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productVariantPriceService.remove(id);
  }
}
