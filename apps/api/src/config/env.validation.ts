const nodeEnvironments = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof nodeEnvironments)[number];

export interface EnvironmentVariables {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TOKEN_TTL_SECONDS: number;
  JWT_REFRESH_TOKEN_TTL_SECONDS: number;
  PASSWORD_RESET_TOKEN_TTL_SECONDS: number;
  EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: number;
  NODE_ENV: NodeEnvironment;
  PORT: number;
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

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_ACCESS_TOKEN_TTL_SECONDS: jwtAccessTokenTtlSeconds,
    JWT_REFRESH_TOKEN_TTL_SECONDS: jwtRefreshTokenTtlSeconds,
    PASSWORD_RESET_TOKEN_TTL_SECONDS: passwordResetTokenTtlSeconds,
    EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: emailVerificationTokenTtlSeconds,
    NODE_ENV: nodeEnv,
    PORT: port,
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
