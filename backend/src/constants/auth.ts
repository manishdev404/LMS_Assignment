import { ROLES, STAFF_ROLES, type Role } from './roles';

/**
 * The API serves two front-ends. Each one gets its own session ("portal") so that a borrower
 * session and a staff session can live side by side in the same browser on localhost.
 */
export const PORTALS = ['borrower', 'staff'] as const;
export type Portal = (typeof PORTALS)[number];

interface PortalConfig {
  cookieName: string;
  allowedRoles: readonly Role[];
  appName: string;
}

export const PORTAL_CONFIG: Record<Portal, PortalConfig> = {
  borrower: {
    cookieName: 'lms_borrower_session',
    allowedRoles: [ROLES.BORROWER],
    appName: 'Borrower Portal',
  },
  staff: {
    cookieName: 'lms_staff_session',
    allowedRoles: STAFF_ROLES,
    appName: 'Operations Dashboard',
  },
};

export const JWT_ISSUER = 'lms-api';
export const BCRYPT_SALT_ROUNDS = 10;
