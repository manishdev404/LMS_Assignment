import { Router } from 'express';
import { MODULE_ACCESS } from '../constants/roles';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { adminLoansQuerySchema } from '../validations/admin.validation';
import { loanIdParamsSchema } from '../validations/common.validation';

export const adminRoutes = Router();

adminRoutes.use(authenticate('staff'), authorize(...MODULE_ACCESS.overview));

adminRoutes.get('/overview', adminController.getOverview);
adminRoutes.get('/loans', validate({ query: adminLoansQuerySchema }), adminController.listLoans);
adminRoutes.get('/loans/:loanId', validate({ params: loanIdParamsSchema }), adminController.getLoan);
