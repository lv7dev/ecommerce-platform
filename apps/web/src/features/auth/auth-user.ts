import type { AuthenticatedUser, AuthUser } from './types';

export function toAuthenticatedUser(user: AuthUser, sessionId = ''): AuthenticatedUser {
  return {
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    id: user.id,
    name: user.name,
    permissions: user.permissions.map((permission) => permission.code),
    roles: user.roles.map((role) => role.code),
    sessionId,
    status: user.status,
  };
}
