import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Sales' };

export default function SalesLayout({ children }: { children: ReactNode }) {
  return children;
}
