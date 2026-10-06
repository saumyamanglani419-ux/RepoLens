import { Link } from 'react-router-dom';
import { cn } from '@/lib/format';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7', className)} aria-hidden>
      <defs>
        <linearGradient id="rl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#18181b" stroke="#27272a" />
      <circle cx="14" cy="14" r="7.5" fill="none" stroke="url(#rl-g)" strokeWidth="3" />
      <path d="M19.5 19.5 25 25" stroke="url(#rl-g)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M11 12.5h6M11 15.5h4" stroke="#e4e4e7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5 rounded-lg', className)} aria-label="RepoLens home">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-zinc-50">
        Repo<span className="text-gradient">Lens</span>
      </span>
    </Link>
  );
}
