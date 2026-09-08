import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { QuoteCartDto } from './dto/quote-cart.dto';
import {
  CartEntity,
  CartItemEntity,
  CartItemOptionValueEntity,
} from './entities/cart.entity';

const apiSuccessResponseSchema = (model: typeof CartEntity) => ({
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
      path: { type: 'string', example: '/api/cart/quote' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Cart')
@ApiExtraModels(CartEntity, CartItemEntity, CartItemOptionValueEntity)
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@Controller('cart')
export class GuestCartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Quote a guest cart from current product data' })
  @ApiOkResponse(apiSuccessResponseSchema(CartEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() quoteCartDto: QuoteCartDto) {
    return this.cartService.quoteGuestCart(quoteCartDto);
  }
}
