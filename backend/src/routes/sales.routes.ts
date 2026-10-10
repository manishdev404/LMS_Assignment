import { Router } from 'express';
import { MODULE_ACCESS } from '../constants/roles';
import * as salesController from '../controllers/sales.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { leadsQuerySchema } from '../validations/sales.validation';

export const salesRoutes = Router();

salesRoutes.use(authenticate('staff'), authorize(...MODULE_ACCESS.sales));

salesRoutes.get('/leads', validate({ query: leadsQuerySchema }), salesController.listLeads);
