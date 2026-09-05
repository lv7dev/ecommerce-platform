import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
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
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { FindAdminOrdersQueryDto } from './dto/find-admin-orders-query.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  OrderEntity,
  OrderItemEntity,
  OrderListEntity,
} from './entities/order.entity';
import { OrderService } from './order.service';

const apiSuccessResponseSchema = (
  model: typeof OrderEntity | typeof OrderListEntity,
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
      path: { type: 'string', example: '/api/checkout' },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2026-09-01T00:00:00.000Z',
      },
    },
  },
});

@ApiTags('Orders')
@ApiExtraModels(OrderEntity, OrderItemEntity, OrderListEntity)
@ApiBearerAuth()
@ApiBadRequestResponse(
  apiErrorResponseSchema(HttpStatus.BAD_REQUEST, 'Bad Request'),
)
@UseGuards(AuthGuard, PermissionsGuard)
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: 'Checkout my cart and create an order' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key for this checkout attempt.',
    example: 'checkout_018f4d7b7ef37b779f3505a34f968d7e',
  })
  @ApiCreatedResponse(apiSuccessResponseSchema(OrderEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @RequirePermissions('order:create_own')
  @Post('checkout')
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.orderService.checkout(user.id, idempotencyKey, checkoutDto);
  }

  @ApiOperation({ summary: 'List my orders' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse(apiSuccessResponseSchema(OrderListEntity))
  @RequirePermissions('order:read_own')
  @Get('orders')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.orderService.findMine(user.id, query);
  }

  @ApiOperation({ summary: 'Get one of my orders' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OrderEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @RequirePermissions('order:read_own')
  @Get('orders/:id')
  findOneMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orderService.findOneMine(user.id, id);
  }

  @ApiOperation({ summary: 'Cancel one of my pending unpaid orders' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OrderEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @RequirePermissions('order:create_own')
  @Post('orders/:id/cancel')
  cancelMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.orderService.cancelMine(user.id, id, cancelOrderDto);
  }

  @ApiOperation({ summary: 'List orders as staff or admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'fulfillmentStatus', required: false })
  @ApiQuery({ name: 'orderNumber', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiOkResponse(apiSuccessResponseSchema(OrderListEntity))
  @RequirePermissions('order:read')
  @Get('admin/orders')
  findAllAdmin(@Query() query: FindAdminOrdersQueryDto) {
    return this.orderService.findAllAdmin(query);
  }

  @ApiOperation({ summary: 'Get an order as staff or admin' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OrderEntity))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @RequirePermissions('order:read')
  @Get('admin/orders/:id')
  findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOneAdmin(id);
  }

  @ApiOperation({ summary: 'Update an order status as staff or admin' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse(apiSuccessResponseSchema(OrderEntity))
  @ApiConflictResponse(apiErrorResponseSchema(HttpStatus.CONFLICT, 'Conflict'))
  @ApiNotFoundResponse(
    apiErrorResponseSchema(HttpStatus.NOT_FOUND, 'Not Found'),
  )
  @RequirePermissions('order:update_status')
  @Patch('admin/orders/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto);
  }
}
