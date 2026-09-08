const nodeEnvironments = ['development', 'test', 'production'] as const;
const mailProviders = ['console', 'resend'] as const;
const cookieSameSiteValues = ['lax', 'strict', 'none'] as const;

export type NodeEnvironment = (typeof nodeEnvironments)[number];
export type MailProvider = (typeof mailProviders)[number];
export type CookieSameSite = (typeof cookieSameSiteValues)[number];

export interface EnvironmentVariables {
  AUTH_ACCESS_COOKIE_NAME: string;
  AUTH_CSRF_COOKIE_NAME: string;
  AUTH_CSRF_HEADER_NAME: string;
  AUTH_COOKIE_DOMAIN?: string;
  AUTH_COOKIE_SAMESITE: CookieSameSite;
  AUTH_COOKIE_SECURE: boolean;
  AUTH_REFRESH_COOKIE_NAME: string;
  ADMIN_ORIGIN?: string;
  APP_WEB_URL: string;
  CSRF_TOKEN_TTL_SECONDS: number;
  DATABASE_URL: string;
  EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: number;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TOKEN_TTL_SECONDS: number;
  JWT_REFRESH_TOKEN_TTL_SECONDS: number;
  MAIL_FROM: string;
  MAIL_PROVIDER: MailProvider;
  PASSWORD_RESET_TOKEN_TTL_SECONDS: number;
  NODE_ENV: NodeEnvironment;
  PORT: number;
  RESEND_API_KEY?: string;
  WEB_ORIGIN: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const databaseUrl = getRequiredString(config, 'DATABASE_URL');
  const nodeEnv = getNodeEnvironment(config.NODE_ENV);
  const jwtAccessSecret = getJwtSecret(config.JWT_ACCESS_SECRET, nodeEnv);
  const jwtAccessTokenTtlSeconds = getPositiveInteger(
    config.JWT_ACCESS_TOKEN_TTL_SECONDS,
    15 * 60,
    'JWT_ACCESS_TOKEN_TTL_SECONDS',
  );
  const jwtRefreshTokenTtlSeconds = getPositiveInteger(
    config.JWT_REFRESH_TOKEN_TTL_SECONDS,
    30 * 24 * 60 * 60,
    'JWT_REFRESH_TOKEN_TTL_SECONDS',
  );
  const passwordResetTokenTtlSeconds = getPositiveInteger(
    config.PASSWORD_RESET_TOKEN_TTL_SECONDS,
    60 * 60,
    'PASSWORD_RESET_TOKEN_TTL_SECONDS',
  );
  const emailVerificationTokenTtlSeconds = getPositiveInteger(
    config.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
    24 * 60 * 60,
    'EMAIL_VERIFICATION_TOKEN_TTL_SECONDS',
  );
  const port = getPort(config.PORT);
  const webOrigin = getOptionalString(
    config.WEB_ORIGIN,
    'http://localhost:3000',
  );
  const adminOrigin = getOptionalString(
    config.ADMIN_ORIGIN,
    'http://localhost:3001',
  );
  const appWebUrl = getOptionalString(config.APP_WEB_URL, webOrigin);
  const mailProvider = getMailProvider(config.MAIL_PROVIDER);
  const resendApiKey = getOptionalString(config.RESEND_API_KEY, '');
  const mailFrom = getOptionalString(
    config.MAIL_FROM,
    'E-commerce <onboarding@resend.dev>',
  );
  const authAccessCookieName = getOptionalString(
    config.AUTH_ACCESS_COOKIE_NAME,
    'ep_access_token',
  );
  const authRefreshCookieName = getOptionalString(
    config.AUTH_REFRESH_COOKIE_NAME,
    'ep_refresh_token',
  );
  const authCsrfCookieName = getOptionalString(
    config.AUTH_CSRF_COOKIE_NAME,
    'ep_csrf_token',
  );
  const authCsrfHeaderName = getOptionalString(
    config.AUTH_CSRF_HEADER_NAME,
    'x-csrf-token',
  ).toLowerCase();
  const authCookieDomain = getOptionalString(config.AUTH_COOKIE_DOMAIN, '');
  const authCookieSameSite = getCookieSameSite(config.AUTH_COOKIE_SAMESITE);
  const csrfTokenTtlSeconds = getPositiveInteger(
    config.CSRF_TOKEN_TTL_SECONDS,
    24 * 60 * 60,
    'CSRF_TOKEN_TTL_SECONDS',
  );
  const authCookieSecure = getBoolean(
    config.AUTH_COOKIE_SECURE,
    authCookieSameSite === 'none' || nodeEnv === 'production',
    'AUTH_COOKIE_SECURE',
  );
  if (authCookieSameSite === 'none' && !authCookieSecure) {
    throw new Error(
      'AUTH_COOKIE_SECURE=true is required when AUTH_COOKIE_SAMESITE=none',
    );
  }

  if (mailProvider === 'resend' && !resendApiKey) {
    throw new Error('RESEND_API_KEY is required when MAIL_PROVIDER=resend');
  }

  if (nodeEnv === 'production' && mailProvider === 'console') {
    throw new Error('MAIL_PROVIDER=resend is required in production');
  }

  return {
    ...config,
    AUTH_ACCESS_COOKIE_NAME: authAccessCookieName,
    AUTH_CSRF_COOKIE_NAME: authCsrfCookieName,
    AUTH_CSRF_HEADER_NAME: authCsrfHeaderName,
    AUTH_COOKIE_DOMAIN: authCookieDomain || undefined,
    AUTH_COOKIE_SAMESITE: authCookieSameSite,
    AUTH_COOKIE_SECURE: authCookieSecure,
    AUTH_REFRESH_COOKIE_NAME: authRefreshCookieName,
    ADMIN_ORIGIN: adminOrigin,
    APP_WEB_URL: appWebUrl,
    CSRF_TOKEN_TTL_SECONDS: csrfTokenTtlSeconds,
    DATABASE_URL: databaseUrl,
    EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: emailVerificationTokenTtlSeconds,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_ACCESS_TOKEN_TTL_SECONDS: jwtAccessTokenTtlSeconds,
    JWT_REFRESH_TOKEN_TTL_SECONDS: jwtRefreshTokenTtlSeconds,
    MAIL_FROM: mailFrom,
    MAIL_PROVIDER: mailProvider,
    PASSWORD_RESET_TOKEN_TTL_SECONDS: passwordResetTokenTtlSeconds,
    NODE_ENV: nodeEnv,
    PORT: port,
    RESEND_API_KEY: resendApiKey || undefined,
    WEB_ORIGIN: webOrigin,
  };
}

function getRequiredString(
  config: Record<string, unknown>,
  key: keyof EnvironmentVariables,
): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }

  return value;
}

function getOptionalString(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

function getJwtSecret(value: unknown, nodeEnv: NodeEnvironment): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (nodeEnv === 'production') {
    throw new Error('JWT_ACCESS_SECRET is required in production');
  }

  return 'dev-access-secret-change-me';
}

function getPositiveInteger(
  value: unknown,
  fallback: number,
  key: keyof EnvironmentVariables,
): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsedValue;
}

function getNodeEnvironment(value: unknown): NodeEnvironment {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'development';
  }

  if (nodeEnvironments.includes(value as NodeEnvironment)) {
    return value as NodeEnvironment;
  }

  throw new Error(`NODE_ENV must be one of: ${nodeEnvironments.join(', ')}`);
}

function getMailProvider(value: unknown): MailProvider {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'console';
  }

  if (mailProviders.includes(value as MailProvider)) {
    return value as MailProvider;
  }

  throw new Error(`MAIL_PROVIDER must be one of: ${mailProviders.join(', ')}`);
}

function getCookieSameSite(value: unknown): CookieSameSite {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'none';
  }

  const normalizedValue = value.trim().toLowerCase();

  if (cookieSameSiteValues.includes(normalizedValue as CookieSameSite)) {
    return normalizedValue as CookieSameSite;
  }

  throw new Error(
    `AUTH_COOKIE_SAMESITE must be one of: ${cookieSameSiteValues.join(', ')}`,
  );
}

function getBoolean(
  value: unknown,
  fallback: boolean,
  key: keyof EnvironmentVariables,
): boolean {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1', 'yes'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no'].includes(normalizedValue)) {
      return false;
    }
  }

  throw new Error(`${key} must be a boolean`);
}

function getPort(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 4000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}
