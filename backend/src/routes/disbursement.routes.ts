import { Router } from 'express';
import { MODULE_ACCESS } from '../constants/roles';
import * as disbursementController from '../controllers/disbursement.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loanIdParamsSchema, optionalNoteSchema, paginationQuerySchema } from '../validations/common.validation';

export const disbursementRoutes = Router();

disbursementRoutes.use(authenticate('staff'), authorize(...MODULE_ACCESS.disbursement));

disbursementRoutes.get(
  '/loans',
  validate({ query: paginationQuerySchema }),
  disbursementController.listSanctionedLoans,
);
disbursementRoutes.post(
  '/loans/:loanId/disburse',
  validate({ params: loanIdParamsSchema, body: optionalNoteSchema }),
  disbursementController.disburseLoan,
);
