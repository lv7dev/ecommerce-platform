import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CategoryWithRelations,
  categoryInclude,
} from './constants/category.include';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FindCategoriesQueryDto } from './dto/find-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity, CategoryListEntity } from './entities/category.entity';
import { handleCategoryPrismaError } from './helpers/category-prisma-error.helper';
import { toCategoryEntity } from './mappers/category.mapper';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    try {
      const category = await this.prisma.category.create({
        data: this.buildCreateInput(createCategoryDto),
        include: categoryInclude,
      });

      return toCategoryEntity(category);
    } catch (error) {
      handleCategoryPrismaError(error);
    }
  }

  async findAll(query: FindCategoriesQueryDto): Promise<CategoryListEntity> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhereInput(query);
    const orderBy = this.buildOrderByInput(query);

    const { items, total } = await this.prisma.$transaction(async (tx) => {
      const items = await tx.category.findMany({
        where,
        include: categoryInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await tx.category.count({ where });

      return { items, total };
    });

    return {
      items: items.map((category) => toCategoryEntity(category)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CategoryEntity> {
    return toCategoryEntity(await this.ensureCategoryExists(id));
  }

  async findBySlug(locale: Locale, slug: string): Promise<CategoryEntity> {
    const category = await this.prisma.category.findFirst({
      where: {
        translations: {
          some: {
            locale,
            slug,
          },
        },
      },
      include: categoryInclude,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return toCategoryEntity(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    await this.ensureCategoryExists(id);

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: this.buildUpdateInput(updateCategoryDto),
        include: categoryInclude,
      });

      return toCategoryEntity(category);
    } catch (error) {
      handleCategoryPrismaError(error);
    }
  }

  async remove(id: string): Promise<CategoryEntity> {
    const category = await this.ensureCategoryExists(id);

    try {
      await this.prisma.category.delete({ where: { id } });

      return toCategoryEntity(category);
    } catch (error) {
      handleCategoryPrismaError(error);
    }
  }

  private async ensureCategoryExists(
    id: string,
  ): Promise<CategoryWithRelations> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: categoryInclude,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private buildCreateInput(dto: CreateCategoryDto): Prisma.CategoryCreateInput {
    return {
      parent:
        dto.parentId === undefined || dto.parentId === null
          ? undefined
          : { connect: { id: dto.parentId } },
      position: dto.position ?? 0,
      isActive: dto.isActive ?? true,
      translations: {
        create: dto.translations.map((translation) => ({
          locale: translation.locale,
          name: translation.name,
          slug: translation.slug,
          description: translation.description,
        })),
      },
    };
  }

  private buildUpdateInput(dto: UpdateCategoryDto): Prisma.CategoryUpdateInput {
    return {
      parent:
        dto.parentId === undefined
          ? undefined
          : dto.parentId === null
            ? { disconnect: true }
            : { connect: { id: dto.parentId } },
      position: dto.position,
      isActive: dto.isActive,
      translations: dto.translations
        ? {
            deleteMany: {},
            create: dto.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              slug: translation.slug,
              description: translation.description,
            })),
          }
        : undefined,
    };
  }

  private buildWhereInput(
    query: FindCategoriesQueryDto,
  ): Prisma.CategoryWhereInput {
    const conditions: Prisma.CategoryWhereInput[] = [];

    if (query.locale) {
      conditions.push({
        translations: {
          some: {
            locale: query.locale,
          },
        },
      });
    }

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    if (query.parentId) {
      conditions.push({ parentId: query.parentId });
    }

    if (query.rootOnly) {
      conditions.push({ parentId: null });
    }

    if (query.search) {
      conditions.push({
        translations: {
          some: {
            locale: query.locale,
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      });
    }

    return conditions.length ? { AND: conditions } : {};
  }

  private buildOrderByInput(
    query: FindCategoriesQueryDto,
  ): Prisma.CategoryOrderByWithRelationInput {
    const sortBy = query.sortBy ?? 'position';
    const sortOrder = query.sortOrder ?? 'asc';

    return {
      [sortBy]: sortOrder,
    };
  }
}
