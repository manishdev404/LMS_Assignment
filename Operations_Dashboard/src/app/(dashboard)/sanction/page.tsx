'use client';

import { RequireRole } from '@/components/auth/require-role';
import { SanctionModule } from '@/components/modules/sanction-module';

export default function SanctionPage() {
  return (
    <RequireRole module="sanction">
      <SanctionModule />
    </RequireRole>
  );
}
