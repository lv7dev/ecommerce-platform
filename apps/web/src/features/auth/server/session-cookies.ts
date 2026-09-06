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
