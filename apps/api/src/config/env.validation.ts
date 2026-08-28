const nodeEnvironments = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof nodeEnvironments)[number];

export interface EnvironmentVariables {
  DATABASE_URL: string;
  NODE_ENV: NodeEnvironment;
  PORT: number;
  WEB_ORIGIN: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const databaseUrl = getRequiredString(config, 'DATABASE_URL');
  const nodeEnv = getNodeEnvironment(config.NODE_ENV);
  const port = getPort(config.PORT);
  const webOrigin = getOptionalString(
    config.WEB_ORIGIN,
    'http://localhost:3000',
  );

  return {
    ...config,
    DATABASE_URL: databaseUrl,
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
