'use client';

import { RequireRole } from '@/components/auth/require-role';
import { SalesModule } from '@/components/modules/sales-module';

export default function SalesPage() {
  return (
    <RequireRole module="sales">
      <SalesModule />
    </RequireRole>
  );
}
