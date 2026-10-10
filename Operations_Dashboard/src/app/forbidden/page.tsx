import type { Metadata } from 'next';
import { AccessDenied } from '@/components/auth/require-role';

export const metadata: Metadata = { title: 'Access denied' };

export default async function ForbiddenPage({ searchParams }: PageProps<'/forbidden'>) {
  const { from } = await searchParams;
  const moduleLabel = typeof from === 'string' ? from : undefined;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <AccessDenied moduleLabel={moduleLabel} />
    </div>
  );
}
