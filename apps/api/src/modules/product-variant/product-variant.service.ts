import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  ProductVariantWithRelations,
  productVariantInclude,
} from './constants/product-variant.include';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { FindProductVariantsQueryDto } from './dto/find-product-variants-query.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import {
  ProductVariantEntity,
  ProductVariantListEntity,
} from './entities/product-variant.entity';
import { handleProductVariantPrismaError } from './helpers/product-variant-prisma-error.helper';
import { toProductVariantEntity } from './mappers/product-variant.mapper';
import { syncProductSearchDocuments } from '../product/helpers/product-search.helper';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    productId: string,
    createProductVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariantEntity> {
    try {
      const variant = await this.prisma.$transaction(async (tx) => {
        const created = await tx.productVariant.create({
          data: {
            product: { connect: { id: productId } },
            ...this.buildCreateData(createProductVariantDto),
          },
          include: productVariantInclude,
        });

        await syncProductSearchDocuments(tx, productId);

        return created;
      });

      return toProductVariantEntity(variant);
    } catch (error) {
      handleProductVariantPrismaError(error);
    }
  }

  async findAll(
    productId: string,
    query: FindProductVariantsQueryDto,
  ): Promise<ProductVariantListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(productId, query);
    const orderBy = this.buildOrderByInput(query);

    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.productVariant.findMany({
        where,
        include: productVariantInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await tx.productVariant.count({ where });

      return { items, total };
    });

    return {
      items: items.map((variant) => toProductVariantEntity(variant)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductVariantEntity> {
    return toProductVariantEntity(await this.ensureVariantExists(id));
  }

  async update(
    id: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ): Promise<ProductVariantEntity> {
    const existing = await this.ensureVariantExists(id);

    try {
      const variant = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.productVariant.update({
          where: { id },
          data: this.buildUpdateData(updateProductVariantDto),
          include: productVariantInclude,
        });

        await syncProductSearchDocuments(tx, existing.productId);

        return updated;
      });

      return toProductVariantEntity(variant);
    } catch (error) {
      handleProductVariantPrismaError(error);
    }
  }

  async remove(id: string): Promise<ProductVariantEntity> {
    const variant = await this.ensureVariantExists(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.productVariant.delete({ where: { id } });
        await syncProductSearchDocuments(tx, variant.productId);
      });

      return toProductVariantEntity(variant);
    } catch (error) {
      handleProductVariantPrismaError(error);
    }
  }

  private async ensureVariantExists(
    id: string,
  ): Promise<ProductVariantWithRelations> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: productVariantInclude,
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  private buildCreateData(
    dto: CreateProductVariantDto,
  ): Omit<Prisma.ProductVariantCreateInput, 'product'> {
    return {
      sku: dto.sku,
      barcode: dto.barcode ?? null,
      imageUrl: dto.imageUrl ?? null,
      stock: dto.stock ?? 0,
      isActive: dto.isActive ?? true,
      optionValues: dto.optionValueIds?.length
        ? {
            create: dto.optionValueIds.map((optionValueId) => ({
              optionValue: { connect: { id: optionValueId } },
            })),
          }
        : undefined,
      prices: dto.prices?.length
        ? {
            create: dto.prices.map((price) => ({
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
          }
        : undefined,
    };
  }

  private buildUpdateData(
    dto: UpdateProductVariantDto,
  ): Prisma.ProductVariantUpdateInput {
    return {
      sku: dto.sku,
      barcode: dto.barcode === undefined ? undefined : (dto.barcode ?? null),
      imageUrl: dto.imageUrl === undefined ? undefined : (dto.imageUrl ?? null),
      stock: dto.stock,
      isActive: dto.isActive,
      optionValues: dto.optionValueIds
        ? {
            deleteMany: {},
            create: dto.optionValueIds.map((optionValueId) => ({
              optionValue: { connect: { id: optionValueId } },
            })),
          }
        : undefined,
      prices: dto.prices
        ? {
            deleteMany: {},
            create: dto.prices.map((price) => ({
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
          }
        : undefined,
    };
  }

  private buildWhereInput(
    productId: string,
    query: FindProductVariantsQueryDto,
  ): Prisma.ProductVariantWhereInput {
    const conditions: Prisma.ProductVariantWhereInput[] = [{ productId }];

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { sku: { contains: query.search, mode: 'insensitive' } },
          { barcode: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.optionValueId) {
      conditions.push({
        optionValues: {
          some: {
            optionValueId: query.optionValueId,
          },
        },
      });
    }

    if (
      query.currency ||
      query.minAmountMinor !== undefined ||
      query.maxAmountMinor !== undefined
    ) {
      conditions.push({
        prices: {
          some: {
            currency: query.currency,
            isActive: true,
            amountMinor: this.buildAmountRange(
              query.minAmountMinor,
              query.maxAmountMinor,
            ),
          },
        },
      });
    }

    return { AND: conditions };
  }

  private buildOrderByInput(
    query: FindProductVariantsQueryDto,
  ): Prisma.ProductVariantOrderByWithRelationInput {
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return {
      [sortBy]: sortOrder,
    };
  }

  private buildAmountRange(
    minAmountMinor?: string,
    maxAmountMinor?: string,
  ): Prisma.BigIntFilter<'ProductVariantPrice'> | undefined {
    if (minAmountMinor !== undefined && !/^\d+$/.test(minAmountMinor)) {
      throw new BadRequestException(
        'minAmountMinor must be a positive integer',
      );
    }

    if (maxAmountMinor !== undefined && !/^\d+$/.test(maxAmountMinor)) {
      throw new BadRequestException(
        'maxAmountMinor must be a positive integer',
      );
    }

    if (minAmountMinor === undefined && maxAmountMinor === undefined) {
      return undefined;
    }

    return {
      gte: minAmountMinor === undefined ? undefined : BigInt(minAmountMinor),
      lte: maxAmountMinor === undefined ? undefined : BigInt(maxAmountMinor),
    };
  }
}
