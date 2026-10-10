import { z } from 'zod';

const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Enter a valid email address'));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name must be at most 80 characters'),
  email: emailSchema,
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(128),
});
