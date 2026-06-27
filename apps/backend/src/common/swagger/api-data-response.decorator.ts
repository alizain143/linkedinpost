import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

export const ApiDataResponse = <TModel extends Type<unknown>>(
  model: TModel,
  options?: { isArray?: boolean; description?: string; status?: 200 | 201 },
) => {
  const schema = {
    type: 'object' as const,
    required: ['data'],
    properties: {
      data: options?.isArray
        ? {
            type: 'array' as const,
            items: { $ref: getSchemaPath(model) },
          }
        : { $ref: getSchemaPath(model) },
    },
  };

  const ResponseDecorator =
    options?.status === 201 ? ApiCreatedResponse : ApiOkResponse;

  return applyDecorators(
    ApiExtraModels(model),
    ResponseDecorator({
      description: options?.description,
      schema,
    }),
  );
};
