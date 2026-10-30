import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/format';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; to?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center',
        className
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-500">
        <Icon size={24} />
      </span>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Link to={action.to} className="btn-primary btn-sm">
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="btn-primary btn-sm">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] px-6 py-10 text-center">
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm text-zinc-400">{message ?? 'The request could not be completed.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary btn-sm mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
