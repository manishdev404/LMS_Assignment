import type { PaginationQuery } from '../interfaces/common.interface';
import type { LoanIdParams } from '../interfaces/http.interface';
import { requireUser } from '../middlewares/auth.middleware';
import { validatedHandler } from '../middlewares/validate.middleware';
import * as disbursementService from '../services/disbursement.service';
import { notifyLoanStatus } from '../services/notification.service';
import { sendSuccess } from '../utils/api-response';
import { toObjectId } from '../utils/mongo';

export const listSanctionedLoans = validatedHandler<{ query: PaginationQuery }>(async (req, res) => {
  sendSuccess(res, await disbursementService.listSanctionedLoans(req.query));
});

export const disburseLoan = validatedHandler<{ params: LoanIdParams; body: { note?: string } }>(
  async (req, res) => {
    const loan = await disbursementService.disburseLoan(
      requireUser(req),
      toObjectId(req.params.loanId),
      req.body.note,
    );
    sendSuccess(res, { loan });
    notifyLoanStatus(loan);
  },
);
