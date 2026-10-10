'use client';

import { RequireRole } from '@/components/auth/require-role';
import { DisbursementModule } from '@/components/modules/disbursement-module';

export default function DisbursementPage() {
  return (
    <RequireRole module="disbursement">
      <DisbursementModule />
    </RequireRole>
  );
}
