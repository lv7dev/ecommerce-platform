import 'server-only';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '../constants';
import type { AuthTokens } from '../types';

const isProduction = process.env.NODE_ENV === 'production';

export async function getAccessTokenCookie() {
  return (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;
}

export async function getRefreshTokenCookie() {
  return (await cookies()).get(AUTH_COOKIE_NAMES.refreshToken)?.value ?? null;
}

export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();
  const sharedOptions = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
  };

  cookieStore.set(AUTH_COOKIE_NAMES.accessToken, tokens.accessToken, {
    ...sharedOptions,
    maxAge: tokens.expiresIn,
  });
  cookieStore.set(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken, {
    ...sharedOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAMES.accessToken);
  cookieStore.delete(AUTH_COOKIE_NAMES.refreshToken);
}
