import {
  isUUID,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/** Workspace template UUID or `system:*` preset id. */
export function isMediaTemplateId(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) {
    return false;
  }
  if (value.startsWith('system:')) {
    return /^system:[a-z0-9-]+$/.test(value);
  }
  return isUUID(value);
}

export function IsMediaTemplateId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMediaTemplateId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return value === undefined || value === null || isMediaTemplateId(value);
        },
        defaultMessage() {
          return 'mediaTemplateId must be a UUID or system preset id';
        },
      },
    });
  };
}
