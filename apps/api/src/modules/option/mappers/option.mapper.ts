import { OptionWithRelations } from '../constants/option.include';
import { OptionEntity } from '../entities/option.entity';

export function toOptionEntity(option: OptionWithRelations): OptionEntity {
  return {
    id: option.id,
    code: option.code,
    translations: option.translations.map((translation) => ({
      id: translation.id,
      locale: translation.locale,
      name: translation.name,
    })),
    values: option.values.map((value) => ({
      id: value.id,
      code: value.code,
      position: value.position,
      translations: value.translations.map((translation) => ({
        id: translation.id,
        locale: translation.locale,
        value: translation.value,
      })),
      variantCount: value._count.variants,
    })),
    productCount: option._count.products,
    createdAt: option.createdAt.toISOString(),
    updatedAt: option.updatedAt.toISOString(),
  };
}
