import type { ReactNode } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { cn } from '@/lib/format';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-zinc-800/80 px-5 py-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-brand-300">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700/80',
  brand: 'bg-brand-500/10 text-brand-300 ring-brand-500/30',
  success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  danger: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  info: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  title,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-center justify-between text-zinc-500">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const initials = name
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn('shrink-0 rounded-lg bg-zinc-800 object-cover ring-1 ring-zinc-700/80', className ?? 'h-10 w-10')}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-400 font-semibold text-white',
        className ?? 'h-10 w-10 text-sm',
      )}
    >
      {initials || '?'}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center" role="alert">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
        <LuTriangleAlert className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-zinc-400">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
