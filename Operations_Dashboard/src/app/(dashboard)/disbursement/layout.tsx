import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Disbursement' };

export default function DisbursementLayout({ children }: { children: ReactNode }) {
  return children;
}
