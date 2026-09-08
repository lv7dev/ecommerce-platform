import 'server-only';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '../constants';

export async function getAccessTokenCookie() {
  return (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;
}

export async function getRefreshTokenCookie() {
  return (await cookies()).get(AUTH_COOKIE_NAMES.refreshToken)?.value ?? null;
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAMES.accessToken);
  cookieStore.delete(AUTH_COOKIE_NAMES.refreshToken);
}

export async function getAuthCookieHeader() {
  const [accessToken, refreshToken] = await Promise.all([
    getAccessTokenCookie(),
    getRefreshTokenCookie(),
  ]);
  const cookiePairs = [
    accessToken ? `${AUTH_COOKIE_NAMES.accessToken}=${accessToken}` : null,
    refreshToken ? `${AUTH_COOKIE_NAMES.refreshToken}=${refreshToken}` : null,
  ].filter(Boolean);

  return cookiePairs.length > 0 ? cookiePairs.join('; ') : null;
}
