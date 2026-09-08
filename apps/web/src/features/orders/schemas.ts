import { z } from 'zod';
import { requiredStringSchema } from '@/shared/forms/validation';

export const checkoutSchema = z.object({
  addressLine1: requiredStringSchema.max(255, 'Address must be at most 255 characters.'),
  addressLine2: z.string().trim().max(255, 'Address must be at most 255 characters.'),
  countryCode: z
    .string()
    .trim()
    .min(2, 'Country code must be 2 characters.')
    .max(2, 'Country code must be 2 characters.'),
  district: requiredStringSchema.max(120, 'District must be at most 120 characters.'),
  fullName: requiredStringSchema.max(120, 'Full name must be at most 120 characters.'),
  note: z.string().trim().max(500, 'Note must be at most 500 characters.'),
  phone: requiredStringSchema.max(32, 'Phone must be at most 32 characters.'),
  postalCode: z.string().trim().max(32, 'Postal code must be at most 32 characters.'),
  province: requiredStringSchema.max(120, 'Province must be at most 120 characters.'),
  ward: z.string().trim().max(120, 'Ward must be at most 120 characters.'),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
