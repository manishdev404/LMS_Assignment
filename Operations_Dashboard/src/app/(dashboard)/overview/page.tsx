'use client';

import { RequireRole } from '@/components/auth/require-role';
import { OverviewModule } from '@/components/modules/overview-module';

export default function OverviewPage() {
  return (
    <RequireRole module="overview">
      <OverviewModule />
    </RequireRole>
  );
}
