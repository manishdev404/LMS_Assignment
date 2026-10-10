/**
 * Seeds one account per role with known credentials (idempotent — re-running resets passwords).
 *
 *   npm run seed         → role accounts only
 *   npm run seed:demo    → role accounts + demo borrowers in every lifecycle stage
 */
import { EMPLOYMENT_MODES } from '../constants/bre';
import { ROLES, type Role } from '../constants/roles';
import { collections } from '../db/collections';
import { connectToDatabase, disconnectFromDatabase } from '../db/client';
import { ensureIndexes } from '../db/indexes';
import type { AuthUser } from '../interfaces/auth.interface';
import type { PersonalDetailsInput } from '../interfaces/borrower.interface';
import type { UserDocument } from '../interfaces/user.interface';
import { registerBorrower } from '../services/auth.service';
import { savePersonalDetails, uploadSalarySlip } from '../services/borrower-profile.service';
import { recordPayment } from '../services/collection.service';
import { disburseLoan } from '../services/disbursement.service';
import { applyForLoan } from '../services/loan-application.service';
import { approveLoan } from '../services/sanction.service';
import { AppError } from '../utils/app-error';
import { todayInBusinessTimezone } from '../utils/date';
import { toObjectId } from '../utils/mongo';
import { hashPassword } from '../utils/password';

interface SeedAccount {
  role: Role;
  name: string;
  email: string;
  password: string;
  app: string;
}

const DASHBOARD = 'Operations Dashboard (http://localhost:3001)';
const PORTAL = 'Borrower Portal (http://localhost:3000)';

export const SEED_ACCOUNTS: readonly SeedAccount[] = [
  { role: ROLES.ADMIN, name: 'Aarav Admin', email: 'admin@lms.dev', password: 'Admin@123', app: DASHBOARD },
  { role: ROLES.SALES, name: 'Sneha Sales', email: 'sales@lms.dev', password: 'Sales@123', app: DASHBOARD },
  { role: ROLES.SANCTION, name: 'Sameer Sanction', email: 'sanction@lms.dev', password: 'Sanction@123', app: DASHBOARD },
  { role: ROLES.DISBURSEMENT, name: 'Divya Disbursement', email: 'disbursement@lms.dev', password: 'Disburse@123', app: DASHBOARD },
  { role: ROLES.COLLECTION, name: 'Kabir Collection', email: 'collection@lms.dev', password: 'Collect@123', app: DASHBOARD },
  { role: ROLES.BORROWER, name: 'Bhavna Borrower', email: 'borrower@lms.dev', password: 'Borrower@123', app: PORTAL },
];

async function upsertAccount(account: SeedAccount): Promise<UserDocument> {
  const now = new Date();
  const user = await collections.users().findOneAndUpdate(
    { email: account.email },
    {
      $set: {
        name: account.name,
        role: account.role,
        passwordHash: await hashPassword(account.password),
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );
  if (!user) throw new Error(`Could not upsert ${account.email}`);
  return user;
}

const toAuthUser = (user: UserDocument): AuthUser => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ── Demo data ────────────────────────────────────────────────────────────────

type DemoStage = 'REGISTERED' | 'BRE_REJECTED' | 'DOCUMENT_UPLOADED' | 'APPLIED' | 'SANCTIONED' | 'DISBURSED';

interface DemoBorrower {
  email: string;
  name: string;
  stage: DemoStage;
  details?: PersonalDetailsInput;
  loan?: { principal: number; tenureDays: number };
}

const DEMO_PASSWORD = 'Borrower@123';
const STAGE_ORDER: readonly DemoStage[] = ['REGISTERED', 'BRE_REJECTED', 'DOCUMENT_UPLOADED', 'APPLIED', 'SANCTIONED', 'DISBURSED'];
const reached = (stage: DemoStage, target: DemoStage): boolean =>
  STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target);

/** A tiny but valid one-page PDF, used as every demo borrower's salary slip. */
const DEMO_SALARY_SLIP = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 320 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    '4 0 obj<</Length 52>>stream\nBT /F1 16 Tf 24 60 Td (Demo salary slip - LMS) Tj ET\nendstream endobj\n' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

function dateYearsAgo(years: number): Date {
  const today = todayInBusinessTimezone();
  return new Date(Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), 1));
}

function demoDetails(fullName: string, pan: string, monthlySalary: number, ageYears = 30): PersonalDetailsInput {
  return {
    fullName,
    pan,
    dateOfBirth: dateYearsAgo(ageYears),
    monthlySalary,
    employmentMode: EMPLOYMENT_MODES.SALARIED,
  };
}

const DEMO_BORROWERS: readonly DemoBorrower[] = [
  { email: 'lead.new@lms.dev', name: 'Nikhil New', stage: 'REGISTERED' },
  {
    email: 'lead.rejected@lms.dev',
    name: 'Rohan Rejected',
    stage: 'BRE_REJECTED',
    details: demoDetails('Rohan Mehta', 'AAKPM4821K', 18_000),
  },
  {
    email: 'lead.ready@lms.dev',
    name: 'Riya Ready',
    stage: 'DOCUMENT_UPLOADED',
    details: demoDetails('Riya Sharma', 'BXQPS7310M', 65_000, 28),
  },
  {
    email: 'applied@lms.dev',
    name: 'Arjun Applied',
    stage: 'APPLIED',
    details: demoDetails('Arjun Verma', 'CMLPV2245D', 80_000, 34),
    loan: { principal: 150_000, tenureDays: 180 },
  },
  {
    email: 'sanctioned@lms.dev',
    name: 'Sara Sanctioned',
    stage: 'SANCTIONED',
    details: demoDetails('Sara Khan', 'DRTPK9034F', 55_000, 41),
    loan: { principal: 75_000, tenureDays: 90 },
  },
  {
    email: 'active@lms.dev',
    name: 'Aditya Active',
    stage: 'DISBURSED',
    details: demoDetails('Aditya Nair', 'EGHPN5512Q', 120_000, 37),
    loan: { principal: 100_000, tenureDays: 365 },
  },
];

async function seedDemoBorrower(demo: DemoBorrower, staff: Map<Role, AuthUser>): Promise<string> {
  if (await collections.users().findOne({ email: demo.email }, { projection: { _id: 1 } })) {
    return 'already exists (skipped)';
  }

  const { user } = await registerBorrower({ name: demo.name, email: demo.email, password: DEMO_PASSWORD });
  const borrower: AuthUser = { id: toObjectId(user.id), name: user.name, email: user.email, role: user.role };
  if (demo.stage === 'REGISTERED' || !demo.details) return demo.stage;

  try {
    await savePersonalDetails(borrower, demo.details);
  } catch (error) {
    if (error instanceof AppError && error.code === 'BRE_REJECTED') return demo.stage;
    throw error;
  }

  await uploadSalarySlip(borrower, {
    buffer: DEMO_SALARY_SLIP,
    originalName: 'salary-slip.pdf',
    declaredMimeType: 'application/pdf',
    size: DEMO_SALARY_SLIP.length,
  });
  if (!demo.loan || !reached(demo.stage, 'APPLIED')) return demo.stage;

  const loan = await applyForLoan(borrower, demo.loan);
  const loanId = toObjectId(loan.id);
  const actor = (role: Role): AuthUser => {
    const member = staff.get(role);
    if (!member) throw new Error(`Seed account for ${role} is missing`);
    return member;
  };

  if (reached(demo.stage, 'SANCTIONED')) await approveLoan(actor(ROLES.SANCTION), loanId, 'Demo approval');
  if (reached(demo.stage, 'DISBURSED')) {
    await disburseLoan(actor(ROLES.DISBURSEMENT), loanId, 'Demo disbursement');
    await recordPayment(actor(ROLES.COLLECTION), loanId, {
      utr: `DEMO${Date.now()}`,
      amount: 25_000,
      paymentDate: todayInBusinessTimezone(),
    });
  }
  return `${demo.stage} (${loan.loanNumber})`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const withDemo = process.argv.includes('--demo');

  await connectToDatabase();
  await ensureIndexes();

  const staff = new Map<Role, AuthUser>();
  for (const account of SEED_ACCOUNTS) {
    staff.set(account.role, toAuthUser(await upsertAccount(account)));
  }

  console.log('\nRole accounts ready:');
  console.table(
    SEED_ACCOUNTS.map(({ role, email, password, app }) => ({ role, email, password, app })),
  );

  if (withDemo) {
    console.log(`\nDemo borrowers (password for all: ${DEMO_PASSWORD}):`);
    const rows: Array<{ email: string; result: string }> = [];
    for (const demo of DEMO_BORROWERS) {
      rows.push({ email: demo.email, result: await seedDemoBorrower(demo, staff) });
    }
    console.table(rows);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectFromDatabase());
