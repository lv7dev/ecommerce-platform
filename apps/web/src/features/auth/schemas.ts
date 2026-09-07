import { z } from 'zod';
import { emailSchema, passwordSchema, requiredStringSchema } from '@/shared/forms/validation';

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredStringSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const registerSchema = z
  .object({
    confirmPassword: requiredStringSchema,
    email: emailSchema,
    name: z.string().trim().max(120, 'Name must be at most 120 characters.').optional(),
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    confirmPassword: requiredStringSchema,
    password: passwordSchema,
    token: requiredStringSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: requiredStringSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type RegisterInput = Omit<RegisterFormValues, 'confirmPassword'>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordInput = Omit<ResetPasswordFormValues, 'confirmPassword'>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
