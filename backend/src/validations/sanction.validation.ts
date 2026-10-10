import { z } from 'zod';

export const rejectLoanSchema = z.object({
  reason: z
    .string({ error: 'A rejection reason is required' })
    .trim()
    .min(5, 'Please give a reason of at least 5 characters')
    .max(500, 'Reason must be at most 500 characters'),
});
