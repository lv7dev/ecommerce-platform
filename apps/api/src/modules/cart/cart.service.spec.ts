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

  it('merges selected cart variants with absolute quantities', async () => {
    const { service, tx } = createService();
    const existingVariant = createVariant();
    const newVariant = createVariant({
      id: '618f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      sku: 'BASIC-TEE-WHITE-M',
    });
    const omittedVariant = createVariant({
      id: '718f4d7b-7ef3-4b77-9f35-05a34f968d7e',
      sku: 'BASIC-TEE-BLUE-M',
    });
    const serverCart = createCart([
      createCartItem(1, existingVariant),
      createCartItem(2, omittedVariant),
    ]);
    const mergedCart = createCart([
      createCartItem(3, existingVariant),
      createCartItem(1, newVariant),
    ]);

    tx.cart.upsert.mockResolvedValue(serverCart);
    tx.productVariant.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => {
        if (where.id === existingVariant.id) {
          return Promise.resolve(existingVariant);
        }

        if (where.id === newVariant.id) {
          return Promise.resolve(newVariant);
        }

        return Promise.resolve(null);
      },
    );
    tx.cart.findUniqueOrThrow.mockResolvedValue(mergedCart);

    await expect(
      service.merge('user-1', {
        items: [
          {
            quantity: 3,
            variantId: existingVariant.id,
          },
          {
            quantity: 1,
            variantId: newVariant.id,
          },
        ],
      }),
    ).resolves.toMatchObject({
      items: [
        {
          quantity: 3,
          variantId: existingVariant.id,
        },
        {
          quantity: 1,
          variantId: newVariant.id,
        },
      ],
      subtotalMinor: '996000',
    });

    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
      where: {
        cartId: serverCart.id,
        variantId: {
          notIn: [existingVariant.id, newVariant.id],
        },
      },
    });
    expect(tx.cartItem.upsert).toHaveBeenCalledTimes(2);
    expect(tx.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          cartId: serverCart.id,
          quantity: 3,
          variantId: existingVariant.id,
        },
        update: {
          quantity: 3,
        },
      }),
    );
    expect(tx.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          cartId: serverCart.id,
          quantity: 1,
          variantId: newVariant.id,
        },
        update: {
          quantity: 1,
        },
      }),
    );
  });

  it('clears account cart when merge keeps no variants', async () => {
    const { service, tx } = createService();
    const serverCart = createCart([createCartItem(1)]);
    const emptyCart = createCart([]);

    tx.cart.upsert.mockResolvedValue(serverCart);
    tx.cart.findUniqueOrThrow.mockResolvedValue(emptyCart);

    await expect(
      service.merge('user-1', {
        items: [],
      }),
    ).resolves.toMatchObject({
      items: [],
      subtotalMinor: '0',
    });

    expect(tx.productVariant.findUnique).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
      where: {
        cartId: serverCart.id,
      },
    });
    expect(tx.cartItem.upsert).not.toHaveBeenCalled();
  });

  it('rejects duplicate variants in a merge request', async () => {
    const { service, tx } = createService();
    const variant = createVariant();

    await expect(
      service.merge('user-1', {
        items: [
          {
            quantity: 1,
            variantId: variant.id,
          },
          {
            quantity: 2,
            variantId: variant.id,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.cart.upsert).not.toHaveBeenCalled();
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
