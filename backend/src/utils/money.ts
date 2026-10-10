/**
 * Money is stored in rupees (2 decimals) but every calculation is done in integer paise,
 * so sums like 0.1 + 0.2 never drift and "fully paid" comparisons are exact.
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatInr(rupees: number): string {
  return inrFormatter.format(rupees);
}
