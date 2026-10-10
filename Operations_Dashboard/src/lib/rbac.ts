import type { Role, StaffRole } from '@/types/api';

export type ModuleKey = 'overview' | 'sales' | 'sanction' | 'disbursement' | 'collection';

export interface DashboardModule {
  key: ModuleKey;
  path: `/${ModuleKey}`;
  label: string;
  description: string;
  roles: readonly StaffRole[];
}

/**
 * Single source of truth for dashboard RBAC on the frontend — used by proxy.ts, the sidebar and
 * <RequireRole>. Mirrors MODULE_ACCESS in backend/src/constants/roles.ts (which is authoritative).
 */
export const MODULES: readonly DashboardModule[] = [
  {
    key: 'overview',
    path: '/overview',
    label: 'Overview',
    description: 'Portfolio KPIs and every loan in the system',
    roles: ['ADMIN'],
  },
  {
    key: 'sales',
    path: '/sales',
    label: 'Sales',
    description: 'Registered borrowers who have not applied yet',
    roles: ['ADMIN', 'SALES'],
  },
  {
    key: 'sanction',
    path: '/sanction',
    label: 'Sanction',
    description: 'Review applications and approve or reject them',
    roles: ['ADMIN', 'SANCTION'],
  },
  {
    key: 'disbursement',
    path: '/disbursement',
    label: 'Disbursement',
    description: 'Release funds for sanctioned loans',
    roles: ['ADMIN', 'DISBURSEMENT'],
  },
  {
    key: 'collection',
    path: '/collection',
    label: 'Collection',
    description: 'Record repayments against active loans',
    roles: ['ADMIN', 'COLLECTION'],
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  SALES: 'Sales',
  SANCTION: 'Sanction',
  DISBURSEMENT: 'Disbursement',
  COLLECTION: 'Collection',
  BORROWER: 'Borrower',
};

const STAFF_ROLES: readonly StaffRole[] = ['ADMIN', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION'];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && (STAFF_ROLES as readonly string[]).includes(role);
}

export function getModule(key: ModuleKey): DashboardModule {
  const found = MODULES.find((module) => module.key === key);
  if (!found) throw new Error(`Unknown module ${key}`);
  return found;
}

export function canAccess(role: Role, key: ModuleKey): boolean {
  return isStaffRole(role) && getModule(key).roles.includes(role);
}

export function modulesFor(role: Role): DashboardModule[] {
  return MODULES.filter((module) => isStaffRole(role) && module.roles.includes(role));
}

/** Where a user lands after signing in: their first accessible module. */
export function homePathFor(role: Role): string {
  return modulesFor(role)[0]?.path ?? '/forbidden';
}

export function moduleForPath(pathname: string): DashboardModule | undefined {
  return MODULES.find((module) => pathname === module.path || pathname.startsWith(`${module.path}/`));
}
