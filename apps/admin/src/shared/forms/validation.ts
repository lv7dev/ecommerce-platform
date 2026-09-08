import { z } from 'zod';

export const emailSchema = z.string().trim().email();

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

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`)
  .refine((password) => !isCommonPassword(password), {
    message: 'Password is too common. Please choose a more unique password.',
  });

export const requiredStringSchema = z.string().trim().min(1, 'This field is required.');

export type FieldErrors<TField extends string = string> = Partial<Record<TField, string>>;

export interface FormResult<TField extends string = string> {
  fieldErrors?: FieldErrors<TField>;
  formError?: string;
  success: boolean;
}

function isCommonPassword(password: string) {
  return commonPasswords.has(normalizePasswordForCommonCheck(password));
}

function normalizePasswordForCommonCheck(password: string) {
  return password
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, '');
}
