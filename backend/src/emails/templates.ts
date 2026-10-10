import { BUSINESS_TIMEZONE } from '../constants/bre';
import { LOAN_STATUS, type LoanStatus } from '../constants/loan';
import type { LoanDto } from '../interfaces/loan.interface';
import type { RecordPaymentResult } from '../interfaces/payment.interface';
import type { UserDto } from '../interfaces/user.interface';
import { formatInr } from '../utils/money';

/**
 * Borrower email templates. Pure functions (no env, no I/O) so they are unit-testable;
 * `portalUrl` is the Borrower Portal origin used for links.
 *
 * Email HTML rules: table layout and inline styles only (Gmail/Outlook ignore most <style> and
 * flex/grid), longhand font properties, and `bgcolor` next to `background` for Outlook.
 */

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

type Tone = 'info' | 'success' | 'danger';

type DetailRow = [label: string, value: string, emphasis?: boolean];

interface EmailParts {
  subject: string;
  /** Status label above the heading, e.g. "Approved". */
  badge: { label: string; tone: Tone };
  heading: string;
  /** The borrower's email, shown as a chip under the heading. */
  account: string;
  name: string;
  paragraphs: string[];
  details?: DetailRow[];
  action: { label: string; url: string };
}

const BRAND = 'LMS';
const BRAND_FULL = 'Loan Management System';

const COLOR = {
  page: '#f6f8fc',
  card: '#ffffff',
  border: '#dadce0',
  rule: '#e8eaed',
  heading: '#202124',
  body: '#3c4043',
  muted: '#5f6368',
  panel: '#f8f9fa',
  primary: '#1a73e8',
} as const;

const TONES: Record<Tone, { background: string; color: string }> = {
  info: { background: '#e8f0fe', color: '#1967d2' },
  success: { background: '#e6f4ea', color: '#137333' },
  danger: { background: '#fce8e6', color: '#c5221f' },
};

const FONT = "Roboto,'Segoe UI',Helvetica,Arial,sans-serif";

function font(size: number, lineHeight: number, color: string, weight = 400): string {
  return `font-family:${FONT};font-size:${size}px;line-height:${lineHeight}px;font-weight:${weight};color:${color}`;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Names and rejection reasons are user/staff input, so everything is escaped in the HTML part. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: BUSINESS_TIMEZONE,
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

// ── Layout ───────────────────────────────────────────────────────────────────

function renderHeader({ badge, heading, account }: EmailParts): string {
  const tone = TONES[badge.tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="32" height="32" align="center" valign="middle" bgcolor="${COLOR.primary}" style="width:32px;height:32px;border-radius:8px;background:${COLOR.primary};${font(18, 32, '#ffffff', 700)}">L</td>
    <td style="padding-left:10px;${font(20, 32, COLOR.heading, 500)}">${BRAND}</td>
  </tr></table>
</td></tr>
<tr><td align="center" style="padding-top:28px">
  <span style="display:inline-block;padding:4px 12px;border-radius:12px;background:${tone.background};${font(12, 16, tone.color, 500)};letter-spacing:0.3px">${escapeHtml(badge.label)}</span>
</td></tr>
<tr><td align="center" style="padding-top:12px;${font(24, 32, COLOR.heading)}">${escapeHtml(heading)}</td></tr>
<tr><td align="center" style="padding-top:12px">
  <span style="display:inline-block;padding:4px 12px;border:1px solid ${COLOR.border};border-radius:16px;${font(14, 20, COLOR.body, 500)}">${escapeHtml(account)}</span>
</td></tr>
</table>`;
}

function renderDetails(details: DetailRow[]): string {
  if (!details.length) return '';
  const rows = details
    .map(([label, value, emphasis], index) => {
      const rule = index < details.length - 1 ? `border-bottom:1px solid ${COLOR.rule};` : '';
      return `<tr>
    <td style="padding:10px 0;${rule}${font(14, 20, COLOR.muted)}">${escapeHtml(label)}</td>
    <td align="right" style="padding:10px 0 10px 16px;${rule}${font(14, 20, COLOR.heading, emphasis ? 700 : 500)}">${escapeHtml(value)}</td>
  </tr>`;
    })
    .join('\n');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.panel}" style="background:${COLOR.panel};border-radius:8px;margin:8px 0 24px">
<tr><td style="padding:6px 20px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${rows}
  </table>
</td></tr>
</table>`;
}

function renderButton({ label, url }: EmailParts['action']): string {
  const href = escapeHtml(url);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
  <td bgcolor="${COLOR.primary}" style="border-radius:4px;background:${COLOR.primary}">
    <a href="${href}" target="_blank" style="display:inline-block;padding:10px 24px;border-radius:4px;text-decoration:none;${font(14, 20, '#ffffff', 500)}">${escapeHtml(label)}</a>
  </td>
</tr></table>
<p style="margin:24px 0 0;${font(12, 18, COLOR.muted)}">If the button doesn't work, copy this link into your browser:<br><a href="${href}" target="_blank" style="color:${COLOR.primary};word-break:break-all">${href}</a></p>`;
}

const FOOTER_LINES = [
  `You received this email to let you know about important updates to your ${BRAND} account.`,
  'This is an automated message, so replies to it are not monitored.',
];

function render(parts: EmailParts): EmailContent {
  const { subject, heading, name, paragraphs, details = [], action } = parts;
  const copyright = `© ${new Date().getFullYear()} ${BRAND} · ${BRAND_FULL}`;

  const text = [
    heading,
    `Hi ${name},`,
    ...paragraphs,
    details.map(([label, value]) => `${label}: ${value}`).join('\n'),
    `${action.label}: ${action.url}`,
    ['—', ...FOOTER_LINES, copyright].join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n');

  const bodyHtml = [`Hi ${name},`, ...paragraphs]
    .map((paragraph) => `<p style="margin:0 0 16px;${font(14, 22, COLOR.body)}">${escapeHtml(paragraph)}</p>`)
    .join('\n');

  // Hidden preview line shown next to the subject in the inbox; the filler stops the client from
  // pulling body text into the preview after it.
  const preheader = `${escapeHtml(paragraphs[0] ?? heading)}${'&#847;&zwnj;&nbsp;'.repeat(40)}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.page}" style="background:${COLOR.page}">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
  <tr><td bgcolor="${COLOR.card}" style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:8px;padding:40px 24px 32px">
${renderHeader(parts)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 0 24px"><div style="border-top:1px solid ${COLOR.border};font-size:0;line-height:0">&nbsp;</div></td></tr></table>
${bodyHtml}
${renderDetails(details)}
${renderButton(action)}
  </td></tr>
  <tr><td align="center" style="padding:24px 16px 0;${font(12, 18, COLOR.muted)}">
    ${FOOTER_LINES.join('<br>')}<br><br>${escapeHtml(copyright)}
  </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

// ── Templates ────────────────────────────────────────────────────────────────

function loanDetails(loan: LoanDto): DetailRow[] {
  return [
    ['Loan number', loan.loanNumber],
    ['Loan amount', formatInr(loan.principal)],
    ['Tenure', `${loan.tenureDays} days`],
    ['Interest', `${formatInr(loan.simpleInterest)} (${loan.interestRatePa}% p.a.)`],
    ['Total repayment', formatInr(loan.totalRepayment), true],
  ];
}

export function welcomeEmail(user: Pick<UserDto, 'name' | 'email'>, portalUrl: string): EmailContent {
  return render({
    subject: `Welcome to ${BRAND}`,
    badge: { label: 'Account created', tone: 'info' },
    heading: `Welcome to ${BRAND}`,
    account: user.email,
    name: user.name,
    paragraphs: [
      'Your borrower account is ready. Add your details and a salary slip to check your eligibility, then apply for a loan in minutes.',
    ],
    action: { label: 'Start your application', url: `${portalUrl}/apply` },
  });
}

type StatusCopy = (loan: LoanDto) => Pick<EmailParts, 'subject' | 'badge' | 'heading' | 'paragraphs'>;

/** CLOSED is not here: a loan only closes through a payment, which sends `paymentRecordedEmail`. */
const STATUS_COPY: Partial<Record<LoanStatus, StatusCopy>> = {
  [LOAN_STATUS.APPLIED]: (loan) => ({
    subject: `We received your loan application ${loan.loanNumber}`,
    badge: { label: 'Application received', tone: 'info' },
    heading: 'We received your application',
    paragraphs: [
      `Thank you for applying for a loan of ${formatInr(loan.principal)}. Our team will review it and email you once a decision is made.`,
    ],
  }),
  [LOAN_STATUS.SANCTIONED]: (loan) => ({
    subject: `Your loan ${loan.loanNumber} is approved`,
    badge: { label: 'Approved', tone: 'success' },
    heading: 'Your loan is approved',
    paragraphs: [
      `Good news! Your loan of ${formatInr(loan.principal)} has been sanctioned. We will email you again when the amount is disbursed.`,
    ],
  }),
  [LOAN_STATUS.REJECTED]: (loan) => ({
    subject: `Update on your loan application ${loan.loanNumber}`,
    badge: { label: 'Not approved', tone: 'danger' },
    heading: 'Update on your application',
    paragraphs: [
      'We are sorry, but we cannot approve your loan application at this time.',
      ...(loan.rejectionReason ? [`Reason: ${loan.rejectionReason}`] : []),
      'You are welcome to apply again from the portal.',
    ],
  }),
  [LOAN_STATUS.DISBURSED]: (loan) => ({
    subject: `${formatInr(loan.principal)} disbursed for loan ${loan.loanNumber}`,
    badge: { label: 'Disbursed', tone: 'success' },
    heading: 'Your loan has been disbursed',
    paragraphs: [
      `Your loan amount of ${formatInr(loan.principal)} has been released. The total repayment is ${formatInr(loan.totalRepayment)} over ${loan.tenureDays} days.`,
    ],
  }),
};

/** Email for a loan that has just moved to `loan.status`, or null when that status sends none. */
export function loanStatusEmail(loan: LoanDto, portalUrl: string): EmailContent | null {
  const copy = STATUS_COPY[loan.status];
  if (!copy) return null;
  return render({
    ...copy(loan),
    account: loan.applicant.email,
    name: loan.applicant.fullName,
    details: loanDetails(loan),
    action: { label: 'View your loan', url: `${portalUrl}/my-loans` },
  });
}

export function paymentRecordedEmail({ loan, payment, loanClosed }: RecordPaymentResult, portalUrl: string): EmailContent {
  const amount = formatInr(payment.amount);
  return render({
    subject: loanClosed
      ? `Loan ${loan.loanNumber} is fully repaid and closed`
      : `Payment of ${amount} received for loan ${loan.loanNumber}`,
    badge: loanClosed ? { label: 'Loan closed', tone: 'success' } : { label: 'Payment received', tone: 'success' },
    heading: loanClosed ? 'Your loan is fully repaid' : 'We received your payment',
    account: loan.applicant.email,
    name: loan.applicant.fullName,
    paragraphs: [
      loanClosed
        ? `We received your final payment of ${amount}. Your loan is now closed. Thank you for repaying on time!`
        : `We received your payment of ${amount}. Thank you!`,
    ],
    details: [
      ['Loan number', loan.loanNumber],
      ['UTR', payment.utr],
      ['Payment date', formatDate(payment.paymentDate)],
      ['Amount paid', amount],
      ['Total paid', `${formatInr(loan.amountPaid)} of ${formatInr(loan.totalRepayment)}`],
      ['Outstanding', formatInr(loan.outstanding), true],
    ],
    action: { label: 'View your loan', url: `${portalUrl}/my-loans` },
  });
}
