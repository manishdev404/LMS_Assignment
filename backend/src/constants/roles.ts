export const ROLES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  SANCTION: 'SANCTION',
  DISBURSEMENT: 'DISBURSEMENT',
  COLLECTION: 'COLLECTION',
  BORROWER: 'BORROWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

/** Internal executives — everyone who signs in to the Operations Dashboard. */
export const STAFF_ROLES: readonly Role[] = [
  ROLES.ADMIN,
  ROLES.SALES,
  ROLES.SANCTION,
  ROLES.DISBURSEMENT,
  ROLES.COLLECTION,
];

/**
 * Which roles may use each dashboard module. Admin is included everywhere;
 * every executive role only sees its own module.
 */
export const MODULE_ACCESS = {
  overview: [ROLES.ADMIN],
  sales: [ROLES.ADMIN, ROLES.SALES],
  sanction: [ROLES.ADMIN, ROLES.SANCTION],
  disbursement: [ROLES.ADMIN, ROLES.DISBURSEMENT],
  collection: [ROLES.ADMIN, ROLES.COLLECTION],
} as const satisfies Record<string, readonly Role[]>;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
}
