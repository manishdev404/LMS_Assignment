import { z } from 'zod';
import { parseIsoDate, todayInBusinessTimezone } from '../utils/date';
import { hasAtMostTwoDecimals } from '../utils/money';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid id');

export const loanIdParamsSchema = z.object({ loanId: objectIdSchema });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

/** `YYYY-MM-DD` → Date at UTC midnight (rejects impossible dates like 2024-02-30). */
export const isoDateSchema = z
  .string({ error: 'Date is required' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format')
  .transform((value, ctx) => {
    const date = parseIsoDate(value);
    if (!date) {
      ctx.addIssue({ code: 'custom', message: 'Not a valid calendar date' });
      return z.NEVER;
    }
    return date;
  });

export const pastOrTodayDateSchema = isoDateSchema.refine(
  (date) => date.getTime() <= todayInBusinessTimezone().getTime(),
  'Date cannot be in the future',
);

export const rupeeAmountSchema = z
  .number({ error: 'Amount must be a number' })
  .finite()
  .refine(hasAtMostTwoDecimals, 'Amount can have at most 2 decimal places');

export const optionalNoteSchema = z.object({
  note: z.string().trim().max(500, 'Note must be at most 500 characters').optional(),
});
