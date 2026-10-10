import { Router } from 'express';
import { MODULE_ACCESS } from '../constants/roles';
import * as collectionController from '../controllers/collection.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { collectionListQuerySchema, recordPaymentSchema } from '../validations/collection.validation';
import { loanIdParamsSchema } from '../validations/common.validation';

export const collectionRoutes = Router();

collectionRoutes.use(authenticate('staff'), authorize(...MODULE_ACCESS.collection));

collectionRoutes.get('/loans', validate({ query: collectionListQuerySchema }), collectionController.listLoans);
collectionRoutes.get(
  '/loans/:loanId/payments',
  validate({ params: loanIdParamsSchema }),
  collectionController.listPayments,
);
collectionRoutes.post(
  '/loans/:loanId/payments',
  validate({ params: loanIdParamsSchema, body: recordPaymentSchema }),
  collectionController.recordPayment,
);
