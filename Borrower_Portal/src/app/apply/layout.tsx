import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Apply for a loan' };

export default function ApplyLayout({ children }: LayoutProps<'/apply'>) {
  return children;
}
