import { BUSINESS_TIMEZONE } from '../constants/bre';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a `YYYY-MM-DD` calendar date into a Date at UTC midnight.
 * Returns null for impossible dates such as 2023-02-30.
 */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE_REGEX.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isRealDate ? date : null;
}

/** Formats a UTC-midnight calendar date as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The calendar date of `instant` in the business time zone, as a UTC-midnight Date. */
export function calendarDateInTimezone(instant: Date = new Date(), timeZone = BUSINESS_TIMEZONE): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

/** Today's calendar date in the business time zone (Asia/Kolkata). */
export function todayInBusinessTimezone(): Date {
  return calendarDateInTimezone(new Date());
}

/** Age in completed years between two UTC-midnight calendar dates. */
export function calculateAge(dateOfBirth: Date, onDate: Date): number {
  let age = onDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = onDate.getUTCMonth() - dateOfBirth.getUTCMonth();
  const birthdayNotReached =
    monthDiff < 0 || (monthDiff === 0 && onDate.getUTCDate() < dateOfBirth.getUTCDate());
  if (birthdayNotReached) age -= 1;
  return age;
}
