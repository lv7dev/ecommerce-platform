import { apiRequest, type ApiRequestOptions } from '@/shared/api/client';
import { apiEndpoints } from '@/shared/api/endpoints';
import { isUnauthorizedError } from '@/shared/api/errors';
import type {
  AuthenticatedUser,
  AuthSession,
  ForgotPasswordResult,
  LogoutResult,
  RequestEmailVerificationResult,
  ResetPasswordResult,
  VerifyEmailResult,
} from './types';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './schemas';
import { clearAuthSessionHint } from './session-hint';

export function login(input: LoginInput) {
  return apiRequest<AuthSession>(apiEndpoints.auth.login, {
    body: input,
    method: 'POST',
  });
}

export function register(input: RegisterInput) {
  return apiRequest<AuthSession>(apiEndpoints.auth.register, {
    body: input,
    method: 'POST',
  });
}

export function logout() {
  return apiRequest<LogoutResult>(apiEndpoints.auth.logout, {
    body: {},
    method: 'POST',
  });
}

export function forgotPassword(input: ForgotPasswordInput) {
  return apiRequest<ForgotPasswordResult>(apiEndpoints.auth.forgotPassword, {
    body: input,
    method: 'POST',
  });
}

export function resetPassword(input: ResetPasswordInput) {
  return apiRequest<ResetPasswordResult>(apiEndpoints.auth.resetPassword, {
    body: input,
    method: 'POST',
  });
}

export function requestEmailVerification() {
  return apiRequestWithSessionRefresh<RequestEmailVerificationResult>(
    apiEndpoints.auth.requestEmailVerification,
    {
      body: {},
      method: 'POST',
    },
  );
}

export function verifyEmail(input: VerifyEmailInput) {
  return apiRequest<VerifyEmailResult>(apiEndpoints.auth.verifyEmail, {
    body: input,
    method: 'POST',
  });
}

export async function getMe() {
  try {
    return await apiRequestWithSessionRefresh<AuthenticatedUser>(apiEndpoints.auth.me);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      clearAuthSessionHint();
      return null;
    }

    throw error;
  }
}

export function refreshSession() {
  return apiRequest<AuthSession>(apiEndpoints.auth.refresh, {
    body: {},
    method: 'POST',
  });
}

let refreshPromise: Promise<AuthSession> | null = null;

export async function apiRequestWithSessionRefresh<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (!isUnauthorizedError(error) || path === apiEndpoints.auth.refresh) {
      throw error;
    }

    await refreshSessionOnce();

    return apiRequest<T>(path, options);
  }
}

async function refreshSessionOnce() {
  refreshPromise ??= refreshSession().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
