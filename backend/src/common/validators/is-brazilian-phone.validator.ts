import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { PhoneUtils } from '../utils/phone.utils';

/**
 * Custom validator decorator for Brazilian phone numbers
 * Validates that the phone number follows Brazilian mobile format:
 * - DDD (2 digits, starting with 1-9)
 * - 9 (mobile indicator)
 * - 8 digits
 *
 * Accepts formats:
 * - (34) 99876-5432
 * - 34998765432
 * - 34 99876-5432
 *
 * @param validationOptions - Optional validation options
 */
export function IsBrazilianPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBrazilianPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Telefone deve estar no formato brasileiro válido (DDD + 9 dígitos). Exemplo: (34) 99876-5432',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && PhoneUtils.validateBrazilianPhone(value);
        },
      },
    });
  };
}
