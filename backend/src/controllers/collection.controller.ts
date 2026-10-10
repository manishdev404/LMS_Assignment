import type { CollectionListQuery } from '../interfaces/dashboard.interface';
import type { LoanIdParams } from '../interfaces/http.interface';
import type { RecordPaymentInput } from '../interfaces/payment.interface';
import { requireUser } from '../middlewares/auth.middleware';
import { validatedHandler } from '../middlewares/validate.middleware';
import * as collectionService from '../services/collection.service';
import { sendSuccess } from '../utils/api-response';
import { toObjectId } from '../utils/mongo';

export const listLoans = validatedHandler<{ query: CollectionListQuery }>(async (req, res) => {
  sendSuccess(res, await collectionService.listCollectionLoans(req.query));
});

export const listPayments = validatedHandler<{ params: LoanIdParams }>(async (req, res) => {
  sendSuccess(res, await collectionService.getLoanPayments(toObjectId(req.params.loanId)));
});

export const recordPayment = validatedHandler<{ params: LoanIdParams; body: RecordPaymentInput }>(
  async (req, res) => {
    const result = await collectionService.recordPayment(
      requireUser(req),
      toObjectId(req.params.loanId),
      req.body,
    );
    sendSuccess(res, result, 201);
  },
);
