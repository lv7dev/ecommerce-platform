import { OptionValueWithRelations } from '../constants/option-value.include';
import { OptionValueDetailEntity } from '../entities/option-value.entity';

export function toOptionValueEntity(
  optionValue: OptionValueWithRelations,
): OptionValueDetailEntity {
  return {
    id: optionValue.id,
    optionId: optionValue.optionId,
    code: optionValue.code,
    position: optionValue.position,
    option: {
      id: optionValue.option.id,
      code: optionValue.option.code,
      translations: optionValue.option.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
      })),
    },
    translations: optionValue.translations.map((translation) => ({
      id: translation.id,
      locale: translation.locale,
      value: translation.value,
    })),
    variantCount: optionValue._count.variants,
  };
}
