import {
  CollectionIcon,
  DisbursementIcon,
  OverviewIcon,
  SalesIcon,
  SanctionIcon,
} from '@/components/ui/icons';
import type { ModuleKey } from '@/lib/rbac';

const ICONS = {
  overview: OverviewIcon,
  sales: SalesIcon,
  sanction: SanctionIcon,
  disbursement: DisbursementIcon,
  collection: CollectionIcon,
} satisfies Record<ModuleKey, unknown>;

export function ModuleIcon({ module, className }: { module: ModuleKey; className?: string }) {
  const Icon = ICONS[module];
  return <Icon className={className} />;
}
