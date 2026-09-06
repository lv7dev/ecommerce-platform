import { describe, expect, it } from 'vitest';
import {
  ApiClientError,
  getApiErrorMessage,
  isForbiddenError,
  isNotFoundError,
  isUnauthorizedError,
  shouldRetryApiError,
} from './errors';

describe('api errors', () => {
  it('normalizes backend payload messages', () => {
    const error = new ApiClientError({
      message: 'Invalid input',
      method: 'POST',
      payload: {
        error: 'Bad Request',
        message: ['email must be valid', 'password is required'],
        path: '/api/auth/login',
        statusCode: 400,
        success: false,
        timestamp: '2026-09-06T00:00:00.000Z',
      },
      status: 400,
      url: 'http://localhost:4000/api/auth/login',
    });

    expect(getApiErrorMessage(error)).toBe('email must be valid, password is required');
  });

  it('detects auth and not found errors', () => {
    const unauthorized = new ApiClientError({
      message: 'Unauthorized',
      method: 'GET',
      status: 401,
      url: 'http://localhost:4000/api/auth/me',
    });
    const forbidden = new ApiClientError({
      message: 'Forbidden',
      method: 'GET',
      status: 403,
      url: 'http://localhost:4000/api/admin',
    });
    const notFound = new ApiClientError({
      message: 'Not found',
      method: 'GET',
      status: 404,
      url: 'http://localhost:4000/api/products/missing',
    });

    expect(isUnauthorizedError(unauthorized)).toBe(true);
    expect(isForbiddenError(forbidden)).toBe(true);
    expect(isNotFoundError(notFound)).toBe(true);
  });

  it('retries transient API errors only', () => {
    expect(
      shouldRetryApiError(
        new ApiClientError({
          message: 'Network error',
          method: 'GET',
          status: 0,
          url: 'http://localhost:4000/api/products',
        }),
      ),
    ).toBe(true);
    expect(
      shouldRetryApiError(
        new ApiClientError({
          message: 'Bad request',
          method: 'GET',
          status: 400,
          url: 'http://localhost:4000/api/products',
        }),
      ),
    ).toBe(false);
  });
});
