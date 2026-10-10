import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface EmailMessage {
  /** Recipient address. */
  to: string;
  subject: string;
  /** The email body. */
  html: string;
  /** Optional plain-text version of `html`; sending both helps keep emails out of spam. */
  text?: string;
}

const smtpConfigured = env.SMTP_HOST !== '';
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
  });
  return transporter;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Sends one email, e.g. `sendEmail({ to, subject, html })`.
 * Never throws: an email is a side effect of a loan action that has already succeeded,
 * so a provider outage is logged instead of turning that action into a 500.
 */
export async function sendEmail({ to: recipient, subject: originalSubject, html, text }: EmailMessage): Promise<void> {
  const to = env.EMAIL_REDIRECT_TO || recipient;
  const subject = env.EMAIL_REDIRECT_TO ? `${originalSubject} [to: ${recipient}]` : originalSubject;

  if (!smtpConfigured) {
    console.log(`[email] not sent (SMTP_HOST not set) → ${to}: ${subject}\n${text ?? html}\n`);
    return;
  }

  try {
    await getTransporter().sendMail({ from: env.EMAIL_FROM, to, subject, html, text });
  } catch (error) {
    console.error(`[email] failed → ${to}: ${subject} (${errorMessage(error)})`);
  }
}

/** Startup check so wrong SMTP credentials show up in the log right away, not on the first email. */
export async function verifyEmailTransport(): Promise<void> {
  if (!smtpConfigured) {
    console.log('Email: SMTP_HOST not set, emails are logged to the console');
    return;
  }
  try {
    await getTransporter().verify();
    console.log(`Email: sending via ${env.SMTP_HOST}:${env.SMTP_PORT}`);
  } catch (error) {
    console.warn(`Email: cannot log in to ${env.SMTP_HOST}:${env.SMTP_PORT} (${errorMessage(error)})`);
  }
}
