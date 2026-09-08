import type { AuthRole, AuthenticatedUser } from './types';

export function hasRole(user: Pick<AuthenticatedUser, 'roles'> | null | undefined, role: AuthRole) {
  return Boolean(user?.roles.includes(role));
}

export function hasAnyRole(
  user: Pick<AuthenticatedUser, 'roles'> | null | undefined,
  roles: AuthRole[],
) {
  return Boolean(user && roles.some((role) => user.roles.includes(role)));
}

export function hasPermission(
  user: Pick<AuthenticatedUser, 'permissions'> | null | undefined,
  permission: string,
) {
  return Boolean(user?.permissions.includes(permission));
}
