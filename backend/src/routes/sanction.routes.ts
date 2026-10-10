import { Router } from 'express';
import { MODULE_ACCESS } from '../constants/roles';
import * as sanctionController from '../controllers/sanction.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loanIdParamsSchema, optionalNoteSchema, paginationQuerySchema } from '../validations/common.validation';
import { rejectLoanSchema } from '../validations/sanction.validation';

export const sanctionRoutes = Router();

sanctionRoutes.use(authenticate('staff'), authorize(...MODULE_ACCESS.sanction));

sanctionRoutes.get('/loans', validate({ query: paginationQuerySchema }), sanctionController.listApplications);
sanctionRoutes.get(
  '/loans/:loanId/salary-slip',
  validate({ params: loanIdParamsSchema }),
  sanctionController.downloadSalarySlip,
);
sanctionRoutes.post(
  '/loans/:loanId/approve',
  validate({ params: loanIdParamsSchema, body: optionalNoteSchema }),
  sanctionController.approveLoan,
);
sanctionRoutes.post(
  '/loans/:loanId/reject',
  validate({ params: loanIdParamsSchema, body: rejectLoanSchema }),
  sanctionController.rejectLoan,
);
