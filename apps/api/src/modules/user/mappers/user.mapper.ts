import {
  AccessTranslationEntity,
  UserEntity,
  UserPermissionEntity,
  UserRoleEntity,
} from '../entities/user.entity';
import { UserWithAuthRelations } from '../constants/user.include';

export function toUserEntity(user: UserWithAuthRelations): UserEntity {
  const permissionMap = new Map<string, UserPermissionEntity>();

  const roles: UserRoleEntity[] = user.roles.map(({ role }) => {
    for (const rolePermission of role.permissions) {
      permissionMap.set(rolePermission.permission.code, {
        code: rolePermission.permission.code,
        name: rolePermission.permission.name,
        description: rolePermission.permission.description,
        translations: rolePermission.permission.translations.map(
          toAccessTranslationEntity,
        ),
      });
    }

    return {
      code: role.code,
      name: role.name,
      description: role.description,
      translations: role.translations.map(toAccessTranslationEntity),
    };
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    roles,
    permissions: [...permissionMap.values()].sort((a, b) =>
      a.code.localeCompare(b.code),
    ),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function toAccessTranslationEntity(translation: {
  locale: AccessTranslationEntity['locale'];
  name: string;
  description: string | null;
}): AccessTranslationEntity {
  return {
    locale: translation.locale,
    name: translation.name,
    description: translation.description,
  };
}
