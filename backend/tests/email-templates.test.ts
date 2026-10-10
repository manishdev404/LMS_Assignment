import { describe, expect, it } from 'vitest';
import type { LoanStatus } from '../src/constants/loan';
import { escapeHtml, loanStatusEmail, paymentRecordedEmail, welcomeEmail } from '../src/emails/templates';
import type { LoanDto } from '../src/interfaces/loan.interface';
import type { PaymentDto } from '../src/interfaces/payment.interface';

const PORTAL = 'http://localhost:3000';

function loan(overrides: Partial<LoanDto> = {}): LoanDto {
  return {
    id: 'loan-1',
    loanNumber: 'LN000042',
    borrowerId: 'user-1',
    applicant: {
      fullName: 'Asha <b>Rao</b>',
      email: 'asha@example.com',
      pan: 'ABCPE1234F',
      dateOfBirth: '1995-01-01',
      age: 31,
      monthlySalary: 60_000,
      employmentMode: 'SALARIED',
    },
    salarySlip: { originalName: 'slip.pdf', mimeType: 'application/pdf', size: 1, uploadedAt: '2026-10-01T00:00:00.000Z' },
    principal: 100_000,
    tenureDays: 365,
    interestRatePa: 12,
    simpleInterest: 12_000,
    totalRepayment: 112_000,
    amountPaid: 0,
    outstanding: 112_000,
    status: 'APPLIED',
    rejectionReason: null,
    sanctionedAt: null,
    sanctionedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    disbursedAt: null,
    disbursedBy: null,
    closedAt: null,
    statusHistory: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

const payment: PaymentDto = {
  id: 'payment-1',
  loanId: 'loan-1',
  utr: 'UTR123',
  amount: 25_000,
  paymentDate: '2026-10-09',
  recordedBy: { id: 'staff-1', name: 'Kabir', role: 'COLLECTION' },
  createdAt: '2026-10-09T10:00:00.000Z',
};

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
    );
  });
});

describe('loanStatusEmail', () => {
  it.each<[LoanStatus, string]>([
    ['APPLIED', 'We received your loan application LN000042'],
    ['SANCTIONED', 'Your loan LN000042 is approved'],
    ['REJECTED', 'Update on your loan application LN000042'],
    ['DISBURSED', '₹1,00,000 disbursed for loan LN000042'],
  ])('%s → "%s"', (status, subject) => {
    expect(loanStatusEmail(loan({ status }), PORTAL)?.subject).toBe(subject);
  });

  it('sends nothing for CLOSED (the final payment email covers it)', () => {
    expect(loanStatusEmail(loan({ status: 'CLOSED' }), PORTAL)).toBeNull();
  });

  it('includes the rejection reason and escapes user input in the HTML part only', () => {
    const email = loanStatusEmail(loan({ status: 'REJECTED', rejectionReason: 'Salary < required' }), PORTAL);
    expect(email?.text).toContain('Hi Asha <b>Rao</b>,');
    expect(email?.text).toContain('Reason: Salary < required');
    expect(email?.html).toContain('Hi Asha &lt;b&gt;Rao&lt;/b&gt;,');
    expect(email?.html).toContain('Reason: Salary &lt; required');
    expect(email?.html).not.toContain('<b>Rao</b>');
  });

  it('links to the borrower portal', () => {
    expect(loanStatusEmail(loan(), PORTAL)?.text).toContain('View your loan: http://localhost:3000/my-loans');
  });

  it('renders the status badge, heading and account chip', () => {
    const html = loanStatusEmail(loan({ status: 'SANCTIONED' }), PORTAL)?.html ?? '';
    expect(html).toContain('>Approved</span>');
    expect(html).toContain('>Your loan is approved</td>');
    expect(html).toContain('>asha@example.com</span>');
    expect(html).toContain('href="http://localhost:3000/my-loans"');
  });
});

describe('paymentRecordedEmail', () => {
  it('reports a partial payment with the remaining balance', () => {
    const email = paymentRecordedEmail(
      { loan: loan({ status: 'DISBURSED', amountPaid: 25_000, outstanding: 87_000 }), payment, loanClosed: false },
      PORTAL,
    );
    expect(email.subject).toBe('Payment of ₹25,000 received for loan LN000042');
    expect(email.text).toContain('Payment date: 9 Oct 2026');
    expect(email.text).toContain('Total paid: ₹25,000 of ₹1,12,000');
    expect(email.text).toContain('Outstanding: ₹87,000');
  });

  it('says the loan is closed when the payment cleared the balance', () => {
    const email = paymentRecordedEmail(
      { loan: loan({ status: 'CLOSED', amountPaid: 112_000, outstanding: 0 }), payment, loanClosed: true },
      PORTAL,
    );
    expect(email.subject).toBe('Loan LN000042 is fully repaid and closed');
    expect(email.text).toContain('Outstanding: ₹0');
  });
});

describe('welcomeEmail', () => {
  it('points the new borrower to the application wizard', () => {
    const email = welcomeEmail({ name: 'Asha', email: 'asha@example.com' }, PORTAL);
    expect(email.subject).toBe('Welcome to LMS');
    expect(email.text).toContain('Start your application: http://localhost:3000/apply');
  });
});
