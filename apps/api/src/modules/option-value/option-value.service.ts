import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  OptionValueWithRelations,
  optionValueInclude,
} from './constants/option-value.include';
import { CreateOptionValueDto } from './dto/create-option-value.dto';
import { FindOptionValuesQueryDto } from './dto/find-option-values-query.dto';
import { UpdateOptionValueDto } from './dto/update-option-value.dto';
import {
  OptionValueDetailEntity,
  OptionValueListEntity,
} from './entities/option-value.entity';
import { handleOptionValuePrismaError } from './helpers/option-value-prisma-error.helper';
import { toOptionValueEntity } from './mappers/option-value.mapper';
import { syncProductSearchDocuments } from '../product/helpers/product-search.helper';

@Injectable()
export class OptionValueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    optionId: string,
    createOptionValueDto: CreateOptionValueDto,
  ): Promise<OptionValueDetailEntity> {
    try {
      const optionValue = await this.prisma.optionValue.create({
        data: {
          option: { connect: { id: optionId } },
          code: createOptionValueDto.code,
          position: createOptionValueDto.position ?? 0,
          translations: {
            create: createOptionValueDto.translations.map((translation) => ({
              locale: translation.locale,
              value: translation.value,
            })),
          },
        },
        include: optionValueInclude,
      });

      return toOptionValueEntity(optionValue);
    } catch (error) {
      handleOptionValuePrismaError(error);
    }
  }

  async findAll(
    optionId: string,
    query: FindOptionValuesQueryDto,
  ): Promise<OptionValueListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(optionId, query);
    const orderBy = this.buildOrderByInput(query);

    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.optionValue.findMany({
        where,
        include: optionValueInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await tx.optionValue.count({ where });

      return { items, total };
    });

    return {
      items: items.map((optionValue) => toOptionValueEntity(optionValue)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<OptionValueDetailEntity> {
    return toOptionValueEntity(await this.ensureOptionValueExists(id));
  }

  async update(
    id: string,
    updateOptionValueDto: UpdateOptionValueDto,
  ): Promise<OptionValueDetailEntity> {
    await this.ensureOptionValueExists(id);
    const productIds = await this.findProductIdsUsingOptionValue(id);

    try {
      const optionValue = await this.prisma.optionValue.update({
        where: { id },
        data: {
          code: updateOptionValueDto.code,
          position: updateOptionValueDto.position,
          translations: updateOptionValueDto.translations
            ? {
                deleteMany: {},
                create: updateOptionValueDto.translations.map(
                  (translation) => ({
                    locale: translation.locale,
                    value: translation.value,
                  }),
                ),
              }
            : undefined,
        },
        include: optionValueInclude,
      });

      await Promise.all(
        productIds.map((productId) =>
          syncProductSearchDocuments(this.prisma, productId),
        ),
      );

      return toOptionValueEntity(optionValue);
    } catch (error) {
      handleOptionValuePrismaError(error);
    }
  }

  async remove(id: string): Promise<OptionValueDetailEntity> {
    const optionValue = await this.ensureOptionValueExists(id);

    try {
      await this.prisma.optionValue.delete({ where: { id } });

      return toOptionValueEntity(optionValue);
    } catch (error) {
      handleOptionValuePrismaError(error);
    }
  }

  private async ensureOptionValueExists(
    id: string,
  ): Promise<OptionValueWithRelations> {
    const optionValue = await this.prisma.optionValue.findUnique({
      where: { id },
      include: optionValueInclude,
    });

    if (!optionValue) {
      throw new NotFoundException('Option value not found');
    }

    return optionValue;
  }

  private async findProductIdsUsingOptionValue(
    optionValueId: string,
  ): Promise<string[]> {
    const links = await this.prisma.variantOptionValue.findMany({
      where: { optionValueId },
      select: {
        variant: {
          select: {
            productId: true,
          },
        },
      },
    });

    return [...new Set(links.map((link) => link.variant.productId))];
  }

  private buildWhereInput(
    optionId: string,
    query: FindOptionValuesQueryDto,
  ): Prisma.OptionValueWhereInput {
    const conditions: Prisma.OptionValueWhereInput[] = [{ optionId }];

    if (query.locale) {
      conditions.push({
        translations: {
          some: {
            locale: query.locale,
          },
        },
      });
    }

    if (query.search) {
      conditions.push({
        OR: [
          {
            code: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            translations: {
              some: {
                locale: query.locale,
                value: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    return { AND: conditions };
  }

  private buildOrderByInput(
    query: FindOptionValuesQueryDto,
  ): Prisma.OptionValueOrderByWithRelationInput {
    const sortBy = query.sortBy ?? 'position';
    const sortOrder = query.sortOrder ?? 'asc';

    return {
      [sortBy]: sortOrder,
    };
  }
}
