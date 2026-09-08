import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api'),
});

const parsedClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
});

export const env = {
  apiUrl: parsedClientEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, ''),
} as const;
