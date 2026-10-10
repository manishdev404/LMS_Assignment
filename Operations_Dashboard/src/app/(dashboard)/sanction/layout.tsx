import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Sanction' };

export default function SanctionLayout({ children }: { children: ReactNode }) {
  return children;
}
