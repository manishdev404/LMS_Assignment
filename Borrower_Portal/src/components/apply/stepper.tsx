import { CheckIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

export type WizardStep = 'PERSONAL_DETAILS' | 'SALARY_SLIP' | 'LOAN_CONFIG';

export const WIZARD_STEPS: ReadonlyArray<{ id: WizardStep; label: string }> = [
  { id: 'PERSONAL_DETAILS', label: 'Personal details' },
  { id: 'SALARY_SLIP', label: 'Salary slip' },
  { id: 'LOAN_CONFIG', label: 'Loan & apply' },
];

interface StepperProps {
  current: WizardStep;
  /** Furthest step the borrower may open (earlier steps stay editable). */
  furthest: WizardStep;
  onSelect: (step: WizardStep) => void;
}

const indexOf = (step: WizardStep) => WIZARD_STEPS.findIndex((item) => item.id === step);

export function Stepper({ current, furthest, onSelect }: StepperProps) {
  const furthestIndex = indexOf(furthest);
  const items = [{ id: 'ACCOUNT' as const, label: 'Account' }, ...WIZARD_STEPS];

  return (
    <nav aria-label="Application progress">
      <ol className="grid grid-cols-4 gap-2">
        {items.map((item, position) => {
          const isAccount = item.id === 'ACCOUNT';
          const stepIndex = isAccount ? -1 : indexOf(item.id);
          const isCurrent = item.id === current;
          const isDone = isAccount || stepIndex < furthestIndex;
          const canOpen = !isAccount && stepIndex <= furthestIndex && !isCurrent;

          return (
            <li key={item.id} className="flex flex-col gap-2">
              <span
                className={cn(
                  'h-1.5 rounded-full',
                  isDone ? 'bg-brand-600' : isCurrent ? 'bg-brand-300' : 'bg-slate-200',
                )}
              />
              <button
                type="button"
                disabled={!canOpen}
                onClick={() => !isAccount && onSelect(item.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 text-left text-xs font-medium sm:text-sm',
                  isCurrent ? 'text-brand-700' : isDone ? 'text-slate-700' : 'text-slate-400',
                  canOpen && 'hover:text-brand-700',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isDone ? 'bg-brand-600 text-white' : isCurrent ? 'bg-brand-100 text-brand-700' : 'bg-slate-100',
                  )}
                >
                  {isDone ? <CheckIcon className="size-3.5" /> : position + 1}
                </span>
                <span className={cn(!isCurrent && 'hidden sm:inline')}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
