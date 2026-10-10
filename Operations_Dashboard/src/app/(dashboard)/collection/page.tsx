'use client';

import { RequireRole } from '@/components/auth/require-role';
import { CollectionModule } from '@/components/modules/collection-module';

export default function CollectionPage() {
  return (
    <RequireRole module="collection">
      <CollectionModule />
    </RequireRole>
  );
}
