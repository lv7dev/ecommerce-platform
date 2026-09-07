import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OptionWithRelations, optionInclude } from './constants/option.include';
import { CreateOptionDto } from './dto/create-option.dto';
import { FindOptionsQueryDto } from './dto/find-options-query.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { OptionEntity, OptionListEntity } from './entities/option.entity';
import { handleOptionPrismaError } from './helpers/option-prisma-error.helper';
import { toOptionEntity } from './mappers/option.mapper';

@Injectable()
export class OptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOptionDto: CreateOptionDto): Promise<OptionEntity> {
    try {
      const option = await this.prisma.option.create({
        data: this.buildCreateInput(createOptionDto),
        include: optionInclude,
      });

      return toOptionEntity(option);
    } catch (error) {
      handleOptionPrismaError(error);
    }
  }

  async findAll(query: FindOptionsQueryDto): Promise<OptionListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(query);
    const orderBy = this.buildOrderByInput(query);

    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.option.findMany({
        where,
        include: optionInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await tx.option.count({ where });

      return { items, total };
    });

    return {
      items: items.map((option) => toOptionEntity(option)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<OptionEntity> {
    return toOptionEntity(await this.ensureOptionExists(id));
  }

  async update(
    id: string,
    updateOptionDto: UpdateOptionDto,
  ): Promise<OptionEntity> {
    await this.ensureOptionExists(id);

    try {
      const option = await this.prisma.option.update({
        where: { id },
        data: this.buildUpdateInput(updateOptionDto),
        include: optionInclude,
      });

      return toOptionEntity(option);
    } catch (error) {
      handleOptionPrismaError(error);
    }
  }

  async remove(id: string): Promise<OptionEntity> {
    const option = await this.ensureOptionExists(id);

    try {
      await this.prisma.option.delete({ where: { id } });

      return toOptionEntity(option);
    } catch (error) {
      handleOptionPrismaError(error);
    }
  }

  private async ensureOptionExists(id: string): Promise<OptionWithRelations> {
    const option = await this.prisma.option.findUnique({
      where: { id },
      include: optionInclude,
    });

    if (!option) {
      throw new NotFoundException('Option not found');
    }

    return option;
  }

  private buildCreateInput(dto: CreateOptionDto): Prisma.OptionCreateInput {
    return {
      code: dto.code,
      translations: {
        create: dto.translations.map((translation) => ({
          locale: translation.locale,
          name: translation.name,
        })),
      },
      values: dto.values?.length
        ? {
            create: dto.values.map((value) => ({
              code: value.code,
              position: value.position ?? 0,
              translations: {
                create: value.translations.map((translation) => ({
                  locale: translation.locale,
                  value: translation.value,
                })),
              },
            })),
          }
        : undefined,
    };
  }

  private buildUpdateInput(dto: UpdateOptionDto): Prisma.OptionUpdateInput {
    return {
      code: dto.code,
      translations: dto.translations
        ? {
            deleteMany: {},
            create: dto.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
            })),
          }
        : undefined,
      values: dto.values
        ? {
            deleteMany: {},
            create: dto.values.map((value) => ({
              code: value.code,
              position: value.position ?? 0,
              translations: {
                create: value.translations.map((translation) => ({
                  locale: translation.locale,
                  value: translation.value,
                })),
              },
            })),
          }
        : undefined,
    };
  }

  private buildWhereInput(query: FindOptionsQueryDto): Prisma.OptionWhereInput {
    const conditions: Prisma.OptionWhereInput[] = [];

    if (query.locale) {
      conditions.push({
        translations: {
          some: {
            locale: query.locale,
          },
        },
      });
    }

    if (query.code) {
      conditions.push({
        code: {
          contains: query.code,
          mode: 'insensitive',
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
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            values: {
              some: {
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
              },
            },
          },
        ],
      });
    }

    return conditions.length ? { AND: conditions } : {};
  }

  private buildOrderByInput(
    query: FindOptionsQueryDto,
  ): Prisma.OptionOrderByWithRelationInput {
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return {
      [sortBy]: sortOrder,
    };
  }
}
