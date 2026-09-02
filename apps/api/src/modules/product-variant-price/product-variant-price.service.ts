import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  ProductVariantPriceWithRelations,
  productVariantPriceInclude,
} from './constants/product-variant-price.include';
import { CreateProductVariantPriceDto } from './dto/create-product-variant-price.dto';
import { FindProductVariantPricesQueryDto } from './dto/find-product-variant-prices-query.dto';
import { UpdateProductVariantPriceDto } from './dto/update-product-variant-price.dto';
import {
  ProductVariantPriceDetailEntity,
  ProductVariantPriceListEntity,
} from './entities/product-variant-price.entity';
import { handleProductVariantPricePrismaError } from './helpers/product-variant-price-prisma-error.helper';
import { toProductVariantPriceEntity } from './mappers/product-variant-price.mapper';

@Injectable()
export class ProductVariantPriceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    variantId: string,
    createPriceDto: CreateProductVariantPriceDto,
  ): Promise<ProductVariantPriceDetailEntity> {
    try {
      const price = await this.prisma.productVariantPrice.create({
        data: {
          variant: { connect: { id: variantId } },
          ...this.buildCreateData(createPriceDto),
        },
        include: productVariantPriceInclude,
      });

      return toProductVariantPriceEntity(price);
    } catch (error) {
      handleProductVariantPricePrismaError(error);
    }
  }

  async findAll(
    variantId: string,
    query: FindProductVariantPricesQueryDto,
  ): Promise<ProductVariantPriceListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(variantId, query);
    const orderBy = this.buildOrderByInput(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productVariantPrice.findMany({
        where,
        include: productVariantPriceInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productVariantPrice.count({ where }),
    ]);

    return {
      items: items.map((price) => toProductVariantPriceEntity(price)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductVariantPriceDetailEntity> {
    return toProductVariantPriceEntity(await this.ensurePriceExists(id));
  }

  async update(
    id: string,
    updatePriceDto: UpdateProductVariantPriceDto,
  ): Promise<ProductVariantPriceDetailEntity> {
    await this.ensurePriceExists(id);

    try {
      const price = await this.prisma.productVariantPrice.update({
        where: { id },
        data: this.buildUpdateData(updatePriceDto),
        include: productVariantPriceInclude,
      });

      return toProductVariantPriceEntity(price);
    } catch (error) {
      handleProductVariantPricePrismaError(error);
    }
  }

  async remove(id: string): Promise<ProductVariantPriceDetailEntity> {
    const price = await this.ensurePriceExists(id);

    try {
      await this.prisma.productVariantPrice.delete({ where: { id } });

      return toProductVariantPriceEntity(price);
    } catch (error) {
      handleProductVariantPricePrismaError(error);
    }
  }

  private async ensurePriceExists(
    id: string,
  ): Promise<ProductVariantPriceWithRelations> {
    const price = await this.prisma.productVariantPrice.findUnique({
      where: { id },
      include: productVariantPriceInclude,
    });

    if (!price) {
      throw new NotFoundException('Product variant price not found');
    }

    return price;
  }

  private buildCreateData(
    dto: CreateProductVariantPriceDto,
  ): Omit<Prisma.ProductVariantPriceCreateInput, 'variant'> {
    return {
      currency: dto.currency,
      amountMinor: BigInt(dto.amountMinor),
      compareAtAmountMinor:
        dto.compareAtAmountMinor === undefined
          ? null
          : BigInt(dto.compareAtAmountMinor),
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    };
  }

  private buildUpdateData(
    dto: UpdateProductVariantPriceDto,
  ): Prisma.ProductVariantPriceUpdateInput {
    return {
      currency: dto.currency,
      amountMinor:
        dto.amountMinor === undefined ? undefined : BigInt(dto.amountMinor),
      compareAtAmountMinor:
        dto.compareAtAmountMinor === undefined
          ? undefined
          : BigInt(dto.compareAtAmountMinor),
      isActive: dto.isActive,
      startsAt: dto.startsAt === undefined ? undefined : new Date(dto.startsAt),
      endsAt: dto.endsAt === undefined ? undefined : new Date(dto.endsAt),
    };
  }

  private buildWhereInput(
    variantId: string,
    query: FindProductVariantPricesQueryDto,
  ): Prisma.ProductVariantPriceWhereInput {
    const conditions: Prisma.ProductVariantPriceWhereInput[] = [{ variantId }];

    if (query.currency) {
      conditions.push({ currency: query.currency });
    }

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    return { AND: conditions };
  }

  private buildOrderByInput(
    query: FindProductVariantPricesQueryDto,
  ): Prisma.ProductVariantPriceOrderByWithRelationInput {
    const sortBy = query.sortBy ?? 'currency';
    const sortOrder = query.sortOrder ?? 'asc';

    return {
      [sortBy]: sortOrder,
    };
  }
}
