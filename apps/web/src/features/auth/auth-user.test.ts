import { describe, expect, it } from 'vitest';
import { toAuthenticatedUser } from './auth-user';
import type { AuthUser } from './types';

describe('toAuthenticatedUser', () => {
  it('maps role and permission entities into session claims', () => {
    const user: AuthUser = {
      createdAt: '2026-01-01T00:00:00.000Z',
      email: 'customer@example.com',
      emailVerifiedAt: null,
      id: 'user_1',
      lastLoginAt: null,
      name: 'Customer',
      permissions: [
        {
          action: 'read',
          code: 'products:read',
          id: 'permission_1',
          name: 'Read products',
          resource: 'products',
        },
      ],
      roles: [
        {
          code: 'CUSTOMER',
          id: 'role_1',
          name: 'Customer',
        },
      ],
      status: 'ACTIVE',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(toAuthenticatedUser(user)).toMatchObject({
      email: 'customer@example.com',
      emailVerifiedAt: null,
      permissions: ['products:read'],
      roles: ['CUSTOMER'],
      sessionId: '',
    });
  });
});
