import { env } from '@/shared/config/env';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/shared/types/api';
import { ApiClientError, isApiErrorResponse } from './errors';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = object;

export interface ApiRequestContext {
  init: RequestInit;
  options: ApiRequestOptions;
  path: string;
  url: URL;
}

export interface ApiResponseContext {
  payload: unknown;
  request: ApiRequestContext;
  response: Response;
}

export interface ApiErrorContext {
  error: unknown;
  payload?: unknown;
  request: ApiRequestContext;
  response?: Response;
}

export type ApiRequestInterceptor = (
  context: ApiRequestContext,
) => ApiRequestContext | Promise<ApiRequestContext>;

export type ApiResponseInterceptor = (
  context: ApiResponseContext,
) => ApiResponseContext | Promise<ApiResponseContext>;

export type ApiErrorInterceptor = (context: ApiErrorContext) => unknown | Promise<unknown>;

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  authToken?: string | null;
  body?: BodyInit | object | null;
  errorInterceptors?: ApiErrorInterceptor[];
  query?: QueryParams;
  requestInterceptors?: ApiRequestInterceptor[];
  responseInterceptors?: ApiResponseInterceptor[];
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const request = await createRequestContext(path, options);
  let response: Response;

  try {
    response = await fetch(request.url, request.init);
  } catch (error) {
    throw await applyErrorInterceptors({
      error: createNetworkError(error, request),
      request,
    });
  }

  const payload = await parseResponse(response);
  const responseContext = await applyResponseInterceptors({
    payload,
    request,
    response,
  });

  if (!responseContext.response.ok) {
    throw await applyErrorInterceptors({
      error: createApiError(responseContext),
      payload: responseContext.payload,
      request,
      response: responseContext.response,
    });
  }

  if (isApiSuccessResponse<T>(responseContext.payload)) {
    return responseContext.payload.data;
  }

  return responseContext.payload as T;
}

async function createRequestContext(path: string, options: ApiRequestOptions) {
  const {
    authToken,
    body,
    errorInterceptors,
    headers,
    query,
    requestInterceptors,
    responseInterceptors,
    ...requestInit
  } = options;
  const context: ApiRequestContext = {
    init: {
      ...requestInit,
      body: serializeBody(body),
      credentials: requestInit.credentials ?? 'include',
      headers: buildHeaders(headers, body, authToken),
    },
    options: {
      ...options,
      errorInterceptors,
      requestInterceptors,
      responseInterceptors,
    },
    path,
    url: buildApiUrl(path, query),
  };

  return applyRequestInterceptors(context);
}

async function applyRequestInterceptors(context: ApiRequestContext) {
  let resolvedContext = context;

  for (const interceptor of context.options.requestInterceptors ?? []) {
    resolvedContext = await interceptor(resolvedContext);
  }

  return resolvedContext;
}

async function applyResponseInterceptors(context: ApiResponseContext) {
  let resolvedContext = context;

  for (const interceptor of context.request.options.responseInterceptors ?? []) {
    resolvedContext = await interceptor(resolvedContext);
  }

  return resolvedContext;
}

async function applyErrorInterceptors(context: ApiErrorContext) {
  let resolvedError = context.error;

  for (const interceptor of context.request.options.errorInterceptors ?? []) {
    resolvedError = await interceptor({
      ...context,
      error: resolvedError,
    });
  }

  return resolvedError;
}

function buildApiUrl(path: string, query?: QueryParams) {
  const url = new URL(path.startsWith('http') ? path : `${env.apiUrl}/${path.replace(/^\//, '')}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const values = Array.isArray(value) ? value : [value];

      for (const item of values) {
        if (isQueryValue(item) && item !== null && item !== undefined && item !== '') {
          url.searchParams.append(key, String(item));
        }
      }
    }
  }

  return url;
}

function buildHeaders(
  headers: HeadersInit | undefined,
  body: ApiRequestOptions['body'],
  authToken: string | null | undefined,
) {
  const resolvedHeaders = new Headers(headers);

  if (body && !(body instanceof FormData) && !resolvedHeaders.has('Content-Type')) {
    resolvedHeaders.set('Content-Type', 'application/json');
  }

  if (authToken) {
    resolvedHeaders.set('Authorization', `Bearer ${authToken}`);
  }

  return resolvedHeaders;
}

function serializeBody(body: ApiRequestOptions['body']) {
  if (!body || body instanceof FormData || typeof body === 'string') {
    return body ?? undefined;
  }

  return JSON.stringify(body);
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return Boolean(
    value && typeof value === 'object' && 'success' in value && value.success === true,
  );
}

function isQueryValue(value: unknown): value is QueryValue {
  return ['boolean', 'number', 'string', 'undefined'].includes(typeof value) || value === null;
}

function createApiError(context: ApiResponseContext) {
  const payload = isApiErrorResponse(context.payload) ? context.payload : undefined;
  const method = context.request.init.method ?? 'GET';

  return new ApiClientError({
    message: getErrorMessage(payload) ?? context.response.statusText,
    method,
    payload,
    status: context.response.status,
    url: context.request.url.toString(),
  });
}

function createNetworkError(error: unknown, request: ApiRequestContext) {
  const method = request.init.method ?? 'GET';

  return new ApiClientError({
    cause: error,
    message: error instanceof Error ? error.message : 'Network request failed',
    method,
    status: 0,
    url: request.url.toString(),
  });
}

function getErrorMessage(payload?: ApiErrorResponse) {
  if (!payload) {
    return undefined;
  }

  return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
}
