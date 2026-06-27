import {
  BadRequestException,
  BadGatewayException,
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

export function llmProviderError(message: string): HttpException {
  return new BadGatewayException({
    error: message,
    code: 'LLM_PROVIDER_ERROR',
  });
}

export function extractGenerationError(err: unknown): {
  code: string;
  message: string;
} {
  if (err instanceof HttpException) {
    const response = err.getResponse();
    if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      return {
        code: String(obj.code ?? 'GENERATION_ERROR'),
        message: String(obj.error ?? err.message),
      };
    }
  }

  return {
    code: 'GENERATION_ERROR',
    message: err instanceof Error ? err.message : 'Unknown generation error',
  };
}
