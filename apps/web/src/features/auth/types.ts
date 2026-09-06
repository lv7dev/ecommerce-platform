export type AuthRole = 'ADMIN' | 'CUSTOMER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AuthenticatedUser {
  email: string;
  id: string;
  name: string;
  permissions: string[];
  roles: AuthRole[];
  sessionId?: string;
  status: UserStatus;
}

export interface AuthEmailVerification {
  expiresAt: string;
}

export interface AuthSession {
  emailVerification?: AuthEmailVerification;
  expiresIn: number;
  user: AuthenticatedUser;
}
