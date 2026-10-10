import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon, CheckIcon, InfoIcon } from './icons';

type Tone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, { box: string; icon: string }> = {
  info: { box: 'bg-brand-50 text-brand-900 ring-brand-200', icon: 'text-brand-600' },
  success: { box: 'bg-emerald-50 text-emerald-900 ring-emerald-200', icon: 'text-emerald-600' },
  warning: { box: 'bg-amber-50 text-amber-900 ring-amber-200', icon: 'text-amber-600' },
  error: { box: 'bg-rose-50 text-rose-900 ring-rose-200', icon: 'text-rose-600' },
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const Icon = tone === 'success' ? CheckIcon : tone === 'info' ? InfoIcon : AlertIcon;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl p-4 text-sm ring-1 ring-inset', TONES[tone].box, className)}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', TONES[tone].icon)} />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
