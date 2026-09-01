import { CategoryWithRelations } from '../constants/category.include';
import {
  CategoryEntity,
  CategorySummaryEntity,
} from '../entities/category.entity';

type CategorySummary = Pick<
  CategoryWithRelations,
  'id' | 'parentId' | 'position' | 'isActive' | 'translations'
>;

function toCategorySummaryEntity(
  category: CategorySummary,
): CategorySummaryEntity {
  return {
    id: category.id,
    parentId: category.parentId,
    position: category.position,
    isActive: category.isActive,
    translations: category.translations.map((translation) => ({
      id: translation.id,
      locale: translation.locale,
      name: translation.name,
      slug: translation.slug,
      description: translation.description,
    })),
  };
}

export function toCategoryEntity(
  category: CategoryWithRelations,
): CategoryEntity {
  return {
    ...toCategorySummaryEntity(category),
    parent: category.parent ? toCategorySummaryEntity(category.parent) : null,
    children: category.children.map((child) => toCategorySummaryEntity(child)),
    productCount: category._count.products,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
