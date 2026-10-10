import { env } from '../config/env';
import { loanStatusEmail, paymentRecordedEmail, welcomeEmail, type EmailContent } from '../emails/templates';
import type { LoanDto } from '../interfaces/loan.interface';
import type { RecordPaymentResult } from '../interfaces/payment.interface';
import type { UserDto } from '../interfaces/user.interface';
import { sendEmail } from './email.service';

/**
 * Borrower notifications. Called from controllers after an action succeeds — not from the
 * services — so the seed script, which drives the services directly, never emails anyone.
 * Fire-and-forget: the HTTP response does not wait for SMTP, and `sendEmail` never throws.
 */

function send(to: string, content: EmailContent | null): void {
  if (content) void sendEmail({ to, ...content });
}

export function notifyWelcome(user: UserDto): void {
  send(user.email, welcomeEmail(user, env.BORROWER_PORTAL_URL));
}

/** After apply, approve, reject or disburse. */
export function notifyLoanStatus(loan: LoanDto): void {
  send(loan.applicant.email, loanStatusEmail(loan, env.BORROWER_PORTAL_URL));
}

/** Covers the auto-close too: the final payment's email says the loan is closed. */
export function notifyPaymentRecorded(result: RecordPaymentResult): void {
  send(result.loan.applicant.email, paymentRecordedEmail(result, env.BORROWER_PORTAL_URL));
}
