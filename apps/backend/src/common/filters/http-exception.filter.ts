import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : { error: exceptionResponse };

    response.status(status).json({
      error: resolveErrorMessage(body, exception.message),
      code: body.code ?? 'REQUEST_FAILED',
      detail: body.detail,
    });
  }
}

/** Prefer app `{ error, code }` body; fall back to Nest validation `message`. */
function resolveErrorMessage(
  body: Record<string, unknown>,
  fallback: string,
): string {
  if (typeof body.error === 'string' && typeof body.code === 'string') {
    return body.error;
  }

  const message = body.message;
  if (Array.isArray(message)) {
    const parts = message.filter((m): m is string => typeof m === 'string');
    if (parts.length > 0) {
      return parts.join('. ');
    }
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }

  return fallback;
}
