import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale } from '../../generated/prisma/client';
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
}
