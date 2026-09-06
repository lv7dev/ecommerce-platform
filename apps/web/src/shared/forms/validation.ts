import { z } from 'zod';

export const emailSchema = z.string().trim().email();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.');

export const requiredStringSchema = z.string().trim().min(1, 'This field is required.');

export type FieldErrors<TField extends string = string> = Partial<Record<TField, string>>;

export interface FormResult<TField extends string = string> {
  fieldErrors?: FieldErrors<TField>;
  formError?: string;
  success: boolean;
}
