import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My loans' };

export default function MyLoansLayout({ children }: LayoutProps<'/my-loans'>) {
  return children;
}
