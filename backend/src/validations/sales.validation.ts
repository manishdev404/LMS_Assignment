import { z } from 'zod';
import { LEAD_STAGES } from '../constants/lead';
import { paginationQuerySchema } from './common.validation';

export const leadsQuerySchema = paginationQuerySchema.extend({
  stage: z.enum(LEAD_STAGES).optional(),
});
