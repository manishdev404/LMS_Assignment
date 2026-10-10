import type { PaginationQuery } from '../interfaces/common.interface';
import type { LoanIdParams } from '../interfaces/http.interface';
import { requireUser } from '../middlewares/auth.middleware';
import { validatedHandler } from '../middlewares/validate.middleware';
import { notifyLoanStatus } from '../services/notification.service';
import * as sanctionService from '../services/sanction.service';
import { sendSuccess } from '../utils/api-response';
import { streamFile } from '../utils/file-response';
import { toObjectId } from '../utils/mongo';

export const listApplications = validatedHandler<{ query: PaginationQuery }>(async (req, res) => {
  sendSuccess(res, await sanctionService.listPendingApplications(req.query));
});

export const approveLoan = validatedHandler<{ params: LoanIdParams; body: { note?: string } }>(
  async (req, res) => {
    const loan = await sanctionService.approveLoan(requireUser(req), toObjectId(req.params.loanId), req.body.note);
    sendSuccess(res, { loan });
    notifyLoanStatus(loan);
  },
);

export const rejectLoan = validatedHandler<{ params: LoanIdParams; body: { reason: string } }>(
  async (req, res) => {
    const loan = await sanctionService.rejectLoan(requireUser(req), toObjectId(req.params.loanId), req.body.reason);
    sendSuccess(res, { loan });
    notifyLoanStatus(loan);
  },
);

export const downloadSalarySlip = validatedHandler<{ params: LoanIdParams }>(async (req, res) => {
  await streamFile(res, await sanctionService.openLoanSalarySlip(toObjectId(req.params.loanId)));
});
