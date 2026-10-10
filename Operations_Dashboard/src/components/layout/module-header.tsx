import type { ReactNode } from 'react';
import { getModule, type ModuleKey } from '@/lib/rbac';
import { ModuleIcon } from './module-icon';

export function ModuleHeader({ module, actions }: { module: ModuleKey; actions?: ReactNode }) {
  const { label, description } = getModule(module);
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ModuleIcon module={module} className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{label}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
