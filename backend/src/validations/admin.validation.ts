import { z } from 'zod';
import { LOAN_STATUS_VALUES } from '../constants/loan';
import { paginationQuerySchema } from './common.validation';

export const adminLoansQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LOAN_STATUS_VALUES).optional(),
});
