import { z } from 'zod';
import { paginationQuerySchema, pastOrTodayDateSchema, rupeeAmountSchema } from './common.validation';

export const collectionListQuerySchema = paginationQuerySchema.extend({
  view: z.enum(['active', 'closed']).default('active'),
});

export const recordPaymentSchema = z.object({
  /** IMPS RRN = 12 digits, NEFT UTR = 16, RTGS UTR = 22 alphanumeric characters. */
  utr: z
    .string({ error: 'UTR number is required' })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{12,22}$/, 'UTR must be 12–22 letters or digits'),
  amount: rupeeAmountSchema
    .refine((amount) => amount > 0, 'Amount must be greater than zero')
    .refine((amount) => amount <= 10_000_000, 'Amount looks too large'),
  paymentDate: pastOrTodayDateSchema,
});
