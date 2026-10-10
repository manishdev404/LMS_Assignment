import type { LeadsQuery } from '../interfaces/dashboard.interface';
import { validatedHandler } from '../middlewares/validate.middleware';
import * as salesService from '../services/sales.service';
import { sendSuccess } from '../utils/api-response';

export const listLeads = validatedHandler<{ query: LeadsQuery }>(async (req, res) => {
  sendSuccess(res, await salesService.listLeads(req.query));
});
