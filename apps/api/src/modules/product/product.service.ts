import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  buildProductCreateInput,
  buildProductUpdateInput,
} from './builders/product-mutation.builder';
import {
  buildProductOrderByInput,
  buildProductWhereInput,
} from './builders/product-query.builder';
import {
  ProductWithRelations,
  productInclude,
} from './constants/product.include';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductVariantDto } from './dto/product-variant.dto';
import { ProductEntity, ProductListEntity } from './entities/product.entity';
import { handleProductPrismaError } from './helpers/product-prisma-error.helper';
import { syncProductSearchDocuments } from './helpers/product-search.helper';
import { toProductEntity } from './mappers/product.mapper';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: buildProductCreateInput(createProductDto),
          include: productInclude,
        });

        await syncProductSearchDocuments(tx, created.id);

        return tx.product.findUniqueOrThrow({
          where: { id: created.id },
          include: productInclude,
        });
      });

      return toProductEntity(product);
    } catch (error) {
      handleProductPrismaError(error);
    }
  }

  async findAll(query: FindProductsQueryDto): Promise<ProductListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildProductWhereInput(query);
    const orderBy = buildProductOrderByInput(query);

    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await tx.product.count({ where });

      return { items, total };
    });

    return {
      items: items.map((product) => toProductEntity(product)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductEntity> {
    return toProductEntity(await this.ensureProductExists(id));
  }

  async findBySlug(locale: Locale, slug: string): Promise<ProductEntity> {
    const product = await this.prisma.product.findFirst({
      where: {
        translations: {
          some: {
            locale,
            slug,
          },
        },
      },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return toProductEntity(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    await this.ensureProductExists(id);

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: buildProductUpdateInput(updateProductDto),
        });

        if (updateProductDto.variants) {
          await this.syncProductVariants(tx, id, updateProductDto.variants);
        }

        await syncProductSearchDocuments(tx, id);

        return tx.product.findUniqueOrThrow({
          where: { id },
          include: productInclude,
        });
      });

      return toProductEntity(product);
    } catch (error) {
      handleProductPrismaError(error);
    }
  }

  async remove(id: string): Promise<ProductEntity> {
    const product = await this.ensureProductExists(id);

    try {
      await this.prisma.product.delete({ where: { id } });

      return toProductEntity(product);
    } catch (error) {
      handleProductPrismaError(error);
    }
  }

  private async ensureProductExists(id: string): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async syncProductVariants(
    client: Prisma.TransactionClient,
    productId: string,
    variants: ProductVariantDto[],
  ): Promise<void> {
    const existingVariants = await client.productVariant.findMany({
      where: { productId },
      select: {
        id: true,
        sku: true,
      },
    });
    const existingVariantById = new Map(
      existingVariants.map((variant) => [variant.id, variant]),
    );
    const existingVariantBySku = new Map(
      existingVariants.map((variant) => [variant.sku, variant]),
    );
    const retainedVariantIds = new Set<string>();

    for (const variant of variants) {
      const existingVariant = variant.id
        ? existingVariantById.get(variant.id)
        : existingVariantBySku.get(variant.sku);

      if (variant.id && !existingVariant) {
        throw new NotFoundException('Product variant not found');
      }

      if (existingVariant) {
        retainedVariantIds.add(existingVariant.id);
        await client.productVariant.update({
          where: { id: existingVariant.id },
          data: this.buildVariantUpdateData(variant),
        });
        continue;
      }

      const createdVariant = await client.productVariant.create({
        data: {
          product: {
            connect: { id: productId },
          },
          ...this.buildVariantCreateData(variant),
        },
        select: {
          id: true,
        },
      });

      retainedVariantIds.add(createdVariant.id);
    }

    const omittedVariantIds = existingVariants
      .filter((variant) => !retainedVariantIds.has(variant.id))
      .map((variant) => variant.id);

    if (omittedVariantIds.length > 0) {
      await client.productVariant.updateMany({
        where: {
          id: { in: omittedVariantIds },
          productId,
        },
        data: {
          isActive: false,
        },
      });
    }
  }

  private buildVariantCreateData(
    variant: ProductVariantDto,
  ): Omit<Prisma.ProductVariantCreateInput, 'product'> {
    return {
      sku: variant.sku,
      barcode: variant.barcode ?? null,
      imageUrl: variant.imageUrl ?? null,
      stock: variant.stock ?? 0,
      isActive: variant.isActive ?? true,
      optionValues: {
        create: (variant.optionValueIds ?? []).map((optionValueId) => ({
          optionValue: { connect: { id: optionValueId } },
        })),
      },
      prices: {
        create: (variant.prices ?? []).map((price) => ({
          currency: price.currency,
          amountMinor: BigInt(price.amountMinor),
          compareAtAmountMinor:
            price.compareAtAmountMinor === undefined
              ? null
              : BigInt(price.compareAtAmountMinor),
          isActive: price.isActive ?? true,
          startsAt: price.startsAt ? new Date(price.startsAt) : null,
          endsAt: price.endsAt ? new Date(price.endsAt) : null,
        })),
      },
    };
  }

  private buildVariantUpdateData(
    variant: ProductVariantDto,
  ): Prisma.ProductVariantUpdateInput {
    return {
      sku: variant.sku,
      barcode: variant.barcode ?? null,
      imageUrl: variant.imageUrl ?? null,
      stock: variant.stock ?? 0,
      isActive: variant.isActive ?? true,
      optionValues: {
        deleteMany: {},
        create: (variant.optionValueIds ?? []).map((optionValueId) => ({
          optionValue: { connect: { id: optionValueId } },
        })),
      },
      prices: {
        deleteMany: {},
        create: (variant.prices ?? []).map((price) => ({
          currency: price.currency,
          amountMinor: BigInt(price.amountMinor),
          compareAtAmountMinor:
            price.compareAtAmountMinor === undefined
              ? null
              : BigInt(price.compareAtAmountMinor),
          isActive: price.isActive ?? true,
          startsAt: price.startsAt ? new Date(price.startsAt) : null,
          endsAt: price.endsAt ? new Date(price.endsAt) : null,
        })),
      },
    };
  }
}
