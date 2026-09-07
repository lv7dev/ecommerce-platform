import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const commonPasswords = new Set([
  '000000000000',
  '111111111111',
  '123123123123',
  '123456789012',
  '1234567890',
  '123456789',
  '12345678',
  '123456789a',
  'abc123456789',
  'admin123456',
  'administrator',
  'changeme',
  'defaultpassword',
  'iloveyou',
  'letmein',
  'myspace1',
  'password',
  'password1',
  'password12',
  'password123',
  'password1234',
  'password12345',
  'password123456',
  'passwordpassword',
  'p@ssw0rd',
  'qazwsxedc',
  'qwerty',
  'qwerty123',
  'qwerty12345',
  'qwertyuiop',
  'qwertyuiop12',
  'welcome',
  'welcome123',
  'welcome12345',
  'zaq12wsx',
]);

@ValidatorConstraint({ name: 'passwordPolicy', async: false })
export class PasswordPolicyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isAllowedPassword(value);
  }

  defaultMessage(args: ValidationArguments): string {
    const value = typeof args.value === 'string' ? args.value : '';

    if (value.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (value.length > PASSWORD_MAX_LENGTH) {
      return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
    }

    if (isCommonPassword(value)) {
      return 'Password is too common. Please choose a more unique password.';
    }

    return 'Password does not meet the password policy.';
  }
}

export function PasswordPolicy(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      constraints: [],
      options: validationOptions,
      propertyName,
      target: object.constructor,
      validator: PasswordPolicyConstraint,
    });
  };
}

function isAllowedPassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH &&
    !isCommonPassword(password)
  );
}

function isCommonPassword(password: string): boolean {
  const normalizedPassword = normalizePasswordForCommonCheck(password);

  return commonPasswords.has(normalizedPassword);
}

function normalizePasswordForCommonCheck(password: string): string {
  return password
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, '');
}
