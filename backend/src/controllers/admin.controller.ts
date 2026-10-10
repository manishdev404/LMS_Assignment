import type { Request, Response } from 'express';
import type { LoanListQuery } from '../interfaces/dashboard.interface';
import type { LoanIdParams } from '../interfaces/http.interface';
import { validatedHandler } from '../middlewares/validate.middleware';
import * as adminService from '../services/admin.service';
import { sendSuccess } from '../utils/api-response';
import { toObjectId } from '../utils/mongo';

export async function getOverview(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminService.getOverview());
}

export const listLoans = validatedHandler<{ query: LoanListQuery }>(async (req, res) => {
  sendSuccess(res, await adminService.listAllLoans(req.query));
});

export const getLoan = validatedHandler<{ params: LoanIdParams }>(async (req, res) => {
  sendSuccess(res, await adminService.getLoanDetail(toObjectId(req.params.loanId)));
});
