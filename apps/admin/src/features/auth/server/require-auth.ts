import 'server-only';

import { redirect } from 'next/navigation';
import { apiRequest } from '@/shared/api/client';
import { apiEndpoints } from '@/shared/api/endpoints';
import { isUnauthorizedError } from '@/shared/api/errors';
import { hasAnyRole, hasPermission } from '../permissions';
import type { AuthRole, AuthenticatedUser } from '../types';
import { getAuthCookieHeader } from './session-cookies';

interface RequireAuthOptions {
  permissions?: string[];
  redirectTo?: string;
  roles?: AuthRole[];
}

export async function getServerCurrentUser() {
  const cookieHeader = await getAuthCookieHeader();

  if (!cookieHeader) {
    return null;
  }

  try {
    return await apiRequest<AuthenticatedUser>(apiEndpoints.auth.me, {
      cache: 'no-store',
      headers: {
        Cookie: cookieHeader,
      },
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
}

export async function requireAuth(options: RequireAuthOptions = {}) {
  const { permissions = [], redirectTo = '/login', roles = [] } = options;
  const user = await getServerCurrentUser();

  if (!user) {
    redirect(redirectTo);
  }

  const canAccessRole = roles.length === 0 || hasAnyRole(user, roles);
  const canAccessPermission =
    permissions.length === 0 || permissions.every((permission) => hasPermission(user, permission));

  if (!canAccessRole || !canAccessPermission) {
    redirect('/');
  }

  return user;
}
