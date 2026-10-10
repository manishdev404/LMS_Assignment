import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, id, ...props }: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={id ? (invalid ? `${id}-error` : `${id}-hint`) : undefined}
      className={cn(CONTROL, invalid ? 'ring-rose-400' : 'ring-slate-300', className)}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className, id, children, ...props }: SelectProps) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'pr-8', invalid ? 'ring-rose-400' : 'ring-slate-300', className)}
      {...props}
    >
      {children}
    </select>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, id, ...props }: TextareaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={id ? (invalid ? `${id}-error` : `${id}-hint`) : undefined}
      className={cn(CONTROL, 'min-h-24 resize-y', invalid ? 'ring-rose-400' : 'ring-slate-300', className)}
      {...props}
    />
  );
}
