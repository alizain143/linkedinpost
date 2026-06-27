import {
  BadRequestException,
  HttpException,
  UnprocessableEntityException,
} from '@nestjs/common';

export function generationContextError(
  message: string,
): HttpException {
  return new BadRequestException({
    error: message,
    code: 'GENERATION_CONTEXT_ERROR',
  });
}

export function generationParseError(
  message: string,
): HttpException {
  return new UnprocessableEntityException({
    error: message,
    code: 'GENERATION_PARSE_ERROR',
  });
}
