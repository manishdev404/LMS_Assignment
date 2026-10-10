import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Collection' };

export default function CollectionLayout({ children }: { children: ReactNode }) {
  return children;
}
