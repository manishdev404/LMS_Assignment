import { CheckIcon, DotIcon, XIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import type { EligibilityCheck } from '@/lib/eligibility';

const STATUS_STYLES = {
  pass: { icon: CheckIcon, className: 'bg-emerald-100 text-emerald-700' },
  fail: { icon: XIcon, className: 'bg-rose-100 text-rose-700' },
  pending: { icon: DotIcon, className: 'bg-slate-100 text-slate-400' },
} as const;

export function EligibilityChecklist({ checks }: { checks: EligibilityCheck[] }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <h3 className="text-sm font-semibold text-slate-900">Eligibility preview</h3>
      <p className="mt-0.5 text-xs text-slate-500">Updates as you type. Final check happens when you submit.</p>
      <ul className="mt-4 space-y-3">
        {checks.map((check) => {
          const style = STATUS_STYLES[check.status];
          const Icon = style.icon;
          return (
            <li key={check.rule} className="flex gap-3">
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', style.className)}>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{check.label}</p>
                {check.detail && <p className="truncate text-xs text-slate-500">{check.detail}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
