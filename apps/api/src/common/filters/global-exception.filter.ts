import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const normalizedResponse = this.normalizeExceptionResponse(
      exceptionResponse,
      statusCode,
    );

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const responseBody: ApiErrorResponse = {
      success: false,
      statusCode,
      message: normalizedResponse.message,
      error: normalizedResponse.error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(responseBody);
  }

  private normalizeExceptionResponse(
    exceptionResponse: string | object | null,
    statusCode: HttpStatus,
  ): {
    message: string | string[];
    error?: string;
  } {
    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
      };
    }

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const response = exceptionResponse as HttpExceptionResponse;

      return {
        message: response.message ?? 'Request failed',
        error: response.error,
      };
    }

    return {
      message:
        statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : 'Request failed',
    };
  }
}
