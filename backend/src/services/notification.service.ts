import { env } from '../config/env';
import type { LoanStatus } from '../constants/loan';
import { MODULE_ACCESS, type Role } from '../constants/roles';
import { collections } from '../db/collections';
import {
  loanStatusEmail,
  loanStatusStaffEmail,
  newLeadStaffEmail,
  paymentRecordedEmail,
  paymentStaffEmail,
  welcomeEmail,
  type EmailContent,
  type StaffRecipient,
} from '../emails/templates';
import type { LoanDto } from '../interfaces/loan.interface';
import type { RecordPaymentResult } from '../interfaces/payment.interface';
import type { UserDto } from '../interfaces/user.interface';
import { sendEmail } from './email.service';

/**
 * Borrower and staff notifications. Called from controllers after an action succeeds — not from
 * the services — so the seed script, which drives the services directly, never emails anyone.
 * Fire-and-forget: the HTTP response does not wait for SMTP, and nothing here throws.
 */

/**
 * The dashboard queue a loan enters at each status. Everyone who can open that module is emailed
 * (MODULE_ACCESS includes ADMIN in every module, so admins hear about everything).
 */
const STAFF_QUEUE: Partial<Record<LoanStatus, readonly Role[]>> = {
  APPLIED: MODULE_ACCESS.sanction,
  SANCTIONED: MODULE_ACCESS.disbursement,
  REJECTED: MODULE_ACCESS.overview,
  DISBURSED: MODULE_ACCESS.collection,
};

function send(to: string, content: EmailContent | null): void {
  if (content) void sendEmail({ to, ...content });
}

/** Emails every staff member with one of `roles`, except whoever triggered the event. */
async function emailStaff(
  roles: readonly Role[],
  build: (recipient: StaffRecipient) => EmailContent | null,
  actorId?: string,
): Promise<void> {
  try {
    const staff = await collections
      .users()
      .find({ role: { $in: [...roles] } }, { projection: { name: 1, email: 1 } })
      .toArray();
    for (const member of staff) {
      if (member._id.toHexString() !== actorId) send(member.email, build(member));
    }
  } catch (error) {
    console.error(`[email] could not load staff recipients (${error instanceof Error ? error.message : error})`);
  }
}

/** Welcome email to the borrower; Sales (and admins) get a new-lead email. */
export function notifyRegistration(user: UserDto): void {
  send(user.email, welcomeEmail(user, env.BORROWER_PORTAL_URL));
  void emailStaff(MODULE_ACCESS.sales, (recipient) =>
    newLeadStaffEmail(user, recipient, env.OPERATIONS_DASHBOARD_URL),
  );
}

/** After apply, approve, reject or disburse: the borrower, plus the team whose queue the loan entered. */
export function notifyLoanStatus(loan: LoanDto): void {
  send(loan.applicant.email, loanStatusEmail(loan, env.BORROWER_PORTAL_URL));
  const roles = STAFF_QUEUE[loan.status];
  if (roles) {
    void emailStaff(
      roles,
      (recipient) => loanStatusStaffEmail(loan, recipient, env.OPERATIONS_DASHBOARD_URL),
      loan.statusHistory.at(-1)?.by.id,
    );
  }
}

/** Receipt to the borrower (the final one says the loan is closed); admins get a copy. */
export function notifyPaymentRecorded(result: RecordPaymentResult): void {
  send(result.loan.applicant.email, paymentRecordedEmail(result, env.BORROWER_PORTAL_URL));
  void emailStaff(
    MODULE_ACCESS.overview,
    (recipient) => paymentStaffEmail(result, recipient, env.OPERATIONS_DASHBOARD_URL),
    result.payment.recordedBy.id,
  );
}
