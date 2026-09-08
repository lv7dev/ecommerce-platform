import type { ApiErrorResponse } from '@/shared/types/api';

export class ApiClientError extends Error {
  readonly cause?: unknown;
  readonly method: string;
  readonly payload?: ApiErrorResponse;
  readonly status: number;
  readonly url: string;

  constructor(input: {
    message: string;
    cause?: unknown;
    method: string;
    payload?: ApiErrorResponse;
    status: number;
    url: string;
  }) {
    super(input.message);
    this.name = 'ApiClientError';
    this.cause = input.cause;
    this.method = input.method;
    this.payload = input.payload;
    this.status = input.status;
    this.url = input.url;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (isApiClientError(error)) {
    return getApiPayloadMessage(error.payload) ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown) {
  return isApiClientError(error) && error.status === 401;
}

export function isForbiddenError(error: unknown) {
  return isApiClientError(error) && error.status === 403;
}

export function isNotFoundError(error: unknown) {
  return isApiClientError(error) && error.status === 404;
}

export function shouldRetryApiError(error: unknown) {
  if (!isApiClientError(error)) {
    return true;
  }

  return error.status === 0 || error.status >= 500 || error.status === 408 || error.status === 429;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return Boolean(
    value && typeof value === 'object' && 'success' in value && value.success === false,
  );
}

function getApiPayloadMessage(payload?: ApiErrorResponse) {
  if (!payload) {
    return undefined;
  }

  return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
}
