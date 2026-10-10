import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth.routes';
import { borrowerRoutes } from './borrower.routes';
import { collectionRoutes } from './collection.routes';
import { disbursementRoutes } from './disbursement.routes';
import { salesRoutes } from './sales.routes';
import { sanctionRoutes } from './sanction.routes';

export const apiRouter = Router();

apiRouter.get('/health', getHealth);
apiRouter.use('/auth', authRoutes);

// Borrower Portal
apiRouter.use('/borrower', borrowerRoutes);

// Operations Dashboard: one router per module, each guarded by its own RBAC rule
apiRouter.use('/sales', salesRoutes);
apiRouter.use('/sanction', sanctionRoutes);
apiRouter.use('/disbursement', disbursementRoutes);
apiRouter.use('/collection', collectionRoutes);
apiRouter.use('/admin', adminRoutes);
