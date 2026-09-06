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

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  tokenType?: 'Bearer';
}

export interface AuthSession extends AuthTokens {
  user: AuthenticatedUser;
}
