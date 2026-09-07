export type AuthRole = 'ADMIN' | 'CUSTOMER' | (string & {});

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | (string & {});

export interface AuthenticatedUser {
  email: string;
  emailVerifiedAt: string | null;
  id: string;
  name: string | null;
  permissions: string[];
  roles: AuthRole[];
  sessionId: string;
  status: UserStatus;
}

export interface AuthTranslation {
  description?: string | null;
  locale: string;
  name: string;
}

export interface AuthRoleEntity {
  code: AuthRole;
  description?: string | null;
  id: string;
  name: string;
  translations?: AuthTranslation[];
}

export interface AuthPermissionEntity {
  action: string;
  code: string;
  description?: string | null;
  id: string;
  name: string;
  resource: string;
  translations?: AuthTranslation[];
}

export interface AuthUser {
  createdAt: string;
  email: string;
  emailVerifiedAt?: string | null;
  id: string;
  lastLoginAt?: string | null;
  name: string | null;
  permissions: AuthPermissionEntity[];
  roles: AuthRoleEntity[];
  status: UserStatus;
  updatedAt: string;
}

export interface AuthEmailVerification {
  expiresAt: string;
}

export interface AuthSession {
  emailVerification?: AuthEmailVerification;
  expiresIn: number;
  user: AuthUser;
}

export interface LogoutResult {
  success: boolean;
}

export interface ForgotPasswordResult {
  accepted: boolean;
  expiresAt?: string;
}

export interface ResetPasswordResult {
  reset: boolean;
}

export interface RequestEmailVerificationResult {
  accepted: boolean;
  alreadyVerified: boolean;
  expiresAt?: string;
}

export interface VerifyEmailResult {
  user: AuthUser;
  verified: boolean;
}
