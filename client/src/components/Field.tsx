import type { ReactNode } from 'react';
import { cn } from '../utils/format';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-1 text-brand-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-zinc-600">{hint}</p>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'published' | 'draft' }) {
  return (
    <span
      className={cn(
        'badge',
        status === 'published'
          ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25'
          : 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/25'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
        )}
      />
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  );
}

export function TypeBadge({ label }: { label: string }) {
  return (
    <span className="badge bg-white/[0.06] text-zinc-300 ring-1 ring-white/10">{label}</span>
  );
}
