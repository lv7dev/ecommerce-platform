import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency, ProductStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CartWithRelations } from './constants/cart.include';
import { CartService } from './cart.service';

describe('CartService', () => {
  const now = new Date('2026-09-06T00:00:00.000Z');

  function createVariant(overrides: Partial<CartVariant> = {}): CartVariant {
    return {
      id: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      productId: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      sku: 'BASIC-TEE-BLACK-M',
      barcode: null,
      imageUrl: null,
      stock: 5,
      reservedStock: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      product: {
        id: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
        brand: 'Luma',
        status: ProductStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
        translations: [
          {
            id: '218f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            productId: '118f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            locale: 'vi',
            name: 'Ao thun cotton basic',
            slug: 'ao-thun-cotton-basic',
            shortDescription: null,
            description: null,
          },
        ],
      },
      optionValues: [],
      prices: [
        {
          id: '318f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          variantId: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
          currency: Currency.VND,
          amountMinor: 249000n,
          compareAtAmountMinor: null,
          isActive: true,
          startsAt: null,
          endsAt: null,
        },
      ],
      ...overrides,
    };
  }

  function createCart(items: CartWithRelations['items']): CartWithRelations {
    return {
      id: '418f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      userId: 'user-1',
      currency: Currency.VND,
      createdAt: now,
      updatedAt: now,
      items,
    };
  }

  function createCartItem(
    quantity: number,
    variant = createVariant(),
  ): CartWithRelations['items'][number] {
    return {
      id: '518f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      cartId: '418f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      variantId: variant.id,
      quantity,
      createdAt: now,
      updatedAt: now,
      variant,
    };
  }

  function createService(txOverrides: Record<string, unknown> = {}) {
    const tx = {
      cart: {
        upsert: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      cartItem: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
      },
      ...txOverrides,
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      cart: {
        upsert: jest.fn(),
      },
      cartItem: {
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    return {
      service: new CartService(prisma),
      prisma,
      tx,
    };
  }

  it('adds an available product variant to the current user cart', async () => {
    const { service, tx } = createService();
    const variant = createVariant();
    const emptyCart = createCart([]);
    const updatedCart = createCart([createCartItem(2, variant)]);

    tx.cart.upsert.mockResolvedValue(emptyCart);
    tx.productVariant.findUnique.mockResolvedValue(variant);
    tx.cart.findUniqueOrThrow.mockResolvedValue(updatedCart);

    await expect(
      service.addItem('user-1', {
        variantId: variant.id,
        quantity: 2,
      }),
    ).resolves.toMatchObject({
      userId: 'user-1',
      subtotalMinor: '498000',
      items: [
        {
          variantId: variant.id,
          quantity: 2,
          isAvailable: true,
        },
      ],
    });
    expect(tx.cartItem.upsert).toHaveBeenCalledTimes(1);

    const [upsertArgs] = tx.cartItem.upsert.mock.calls[0] as [
      {
        create: {
          cartId: string;
          variantId: string;
          quantity: number;
        };
      },
    ];

    expect(upsertArgs.create).toMatchObject({
      cartId: emptyCart.id,
      variantId: variant.id,
      quantity: 2,
    });
  });

  it('rejects adding more than available stock', async () => {
    const { service, tx } = createService();
    const variant = createVariant({ stock: 2, reservedStock: 1 });

    tx.cart.upsert.mockResolvedValue(createCart([]));
    tx.productVariant.findUnique.mockResolvedValue(variant);

    await expect(
      service.addItem('user-1', {
        variantId: variant.id,
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.cartItem.upsert).not.toHaveBeenCalled();
  });

  it('does not update a cart item owned by another user', async () => {
    const { service, prisma } = createService();
    const prismaMock = prisma as unknown as {
      cartItem: { findFirst: jest.Mock };
    };

    prismaMock.cartItem.findFirst.mockResolvedValue(null);

    await expect(
      service.updateItem('user-1', 'cart-item-2', {
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

type CartVariant = CartWithRelations['items'][number]['variant'];
