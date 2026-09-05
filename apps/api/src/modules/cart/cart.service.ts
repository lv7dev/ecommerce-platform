import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Currency, Prisma, ProductStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { isPrismaError } from '../../common/helpers/prisma-error.helper';
import { cartInclude } from './constants/cart.include';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartEntity } from './entities/cart.entity';
import {
  getActivePrice,
  getAvailableStock,
  toCartEntity,
} from './mappers/cart.mapper';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string): Promise<CartEntity> {
    return toCartEntity(await this.getOrCreateCart(userId));
  }

  async addItem(
    userId: string,
    addCartItemDto: AddCartItemDto,
  ): Promise<CartEntity> {
    try {
      const cart = await this.prisma.$transaction(
        async (tx) => {
          const cart = await tx.cart.upsert({
            where: { userId },
            create: {
              userId,
              currency: Currency.VND,
            },
            update: {},
            include: cartInclude,
          });
          const existingItem = cart.items.find(
            (item) => item.variantId === addCartItemDto.variantId,
          );
          const nextQuantity =
            (existingItem?.quantity ?? 0) + addCartItemDto.quantity;

          await this.ensureVariantCanBeAdded(
            addCartItemDto.variantId,
            cart.currency,
            nextQuantity,
            tx,
          );

          await tx.cartItem.upsert({
            where: {
              cartId_variantId: {
                cartId: cart.id,
                variantId: addCartItemDto.variantId,
              },
            },
            create: {
              cartId: cart.id,
              variantId: addCartItemDto.variantId,
              quantity: addCartItemDto.quantity,
            },
            update: {
              quantity: {
                increment: addCartItemDto.quantity,
              },
            },
          });

          const updatedCart = await tx.cart.findUniqueOrThrow({
            where: { id: cart.id },
            include: cartInclude,
          });
          const updatedItem = updatedCart.items.find(
            (item) => item.variantId === addCartItemDto.variantId,
          );

          if (
            !updatedItem ||
            updatedItem.quantity > getAvailableStock(updatedItem)
          ) {
            throw new ConflictException(
              'Insufficient stock for product variant',
            );
          }

          return updatedCart;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return toCartEntity(cart);
    } catch (error) {
      if (isPrismaError(error, 'P2034')) {
        throw new ConflictException(
          'Cart update conflicted with another transaction, please retry',
        );
      }

      throw error;
    }
  }

  async updateItem(
    userId: string,
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartEntity> {
    const item = await this.findOwnedCartItem(userId, cartItemId);

    await this.ensureVariantCanBeAdded(
      item.variantId,
      item.cart.currency,
      updateCartItemDto.quantity,
    );

    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: updateCartItemDto.quantity },
    });

    return toCartEntity(await this.getOrCreateCart(userId));
  }

  async removeItem(userId: string, cartItemId: string): Promise<CartEntity> {
    await this.findOwnedCartItem(userId, cartItemId);

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return toCartEntity(await this.getOrCreateCart(userId));
  }

  async clear(userId: string): Promise<CartEntity> {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return toCartEntity(await this.getOrCreateCart(userId));
  }

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: {
        userId,
        currency: Currency.VND,
      },
      update: {},
      include: cartInclude,
    });
  }

  private async findOwnedCartItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId },
      },
      include: {
        cart: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return item;
  }

  private async ensureVariantCanBeAdded(
    variantId: string,
    currency: Currency,
    requestedQuantity: number,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const variant = await client.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: {
            translations: {
              orderBy: {
                locale: 'asc',
              },
            },
          },
        },
        optionValues: {
          include: {
            optionValue: {
              include: {
                translations: {
                  orderBy: {
                    locale: 'asc',
                  },
                },
                option: {
                  include: {
                    translations: {
                      orderBy: {
                        locale: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        prices: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const cartItemLike = {
      id: '',
      cartId: '',
      variantId: variant.id,
      quantity: requestedQuantity,
      createdAt: new Date(),
      updatedAt: new Date(),
      variant,
    };

    if (variant.product.status !== ProductStatus.ACTIVE || !variant.isActive) {
      throw new BadRequestException('Product variant is not available');
    }

    if (variant.stock - variant.reservedStock < requestedQuantity) {
      throw new BadRequestException('Insufficient stock for product variant');
    }

    if (!getActivePrice(cartItemLike, currency)) {
      throw new BadRequestException(
        'Product variant does not have an active price for cart currency',
      );
    }
  }
}
