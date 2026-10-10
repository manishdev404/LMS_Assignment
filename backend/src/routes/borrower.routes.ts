import { Router } from 'express';
import { ROLES } from '../constants/roles';
import * as borrowerController from '../controllers/borrower.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadSalarySlip } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import { applyLoanSchema, personalDetailsSchema } from '../validations/borrower.validation';
import { loanIdParamsSchema } from '../validations/common.validation';

export const borrowerRoutes = Router();

borrowerRoutes.use(authenticate('borrower'), authorize(ROLES.BORROWER));

borrowerRoutes.get('/application', borrowerController.getApplication);
borrowerRoutes.put('/profile', validate({ body: personalDetailsSchema }), borrowerController.savePersonalDetails);
borrowerRoutes.post('/salary-slip', uploadSalarySlip, borrowerController.uploadSalarySlip);
borrowerRoutes.get('/salary-slip', borrowerController.downloadSalarySlip);
borrowerRoutes.post('/loans', validate({ body: applyLoanSchema }), borrowerController.applyForLoan);
borrowerRoutes.get('/loans', borrowerController.listLoans);
borrowerRoutes.get('/loans/:loanId', validate({ params: loanIdParamsSchema }), borrowerController.getLoan);
