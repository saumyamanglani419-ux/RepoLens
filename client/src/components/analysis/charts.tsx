import { useState } from 'react';
import type { Language } from '@/types';
import { cn, formatNumber, healthTone } from '@/lib/format';

/** GitHub-style stacked language bar with a labelled legend (identity is never colour-only). */
export function LanguageBar({ languages, max = 8 }: { languages: Language[]; max?: number }) {
  const [hover, setHover] = useState<string | null>(null);
  if (!languages.length) return <p className="text-sm text-zinc-500">No language data available.</p>;

  const shown = languages.slice(0, max);
  const rest = languages.slice(max);
  const other = rest.reduce((s, l) => s + l.percent, 0);
  const segments: Language[] = other > 0 ? [...shown, { name: 'Other', percent: Number(other.toFixed(1)), color: '#52525b' }] : shown;

  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.name} ${s.percent}%`).join(', ')}>
        {segments.map((l) => (
          <div
            key={l.name}
            className={cn('h-full transition-opacity first:rounded-l-full last:rounded-r-full', hover && hover !== l.name && 'opacity-30')}
            style={{ width: `${Math.max(l.percent, 0.6)}%`, backgroundColor: l.color }}
            onMouseEnter={() => setHover(l.name)}
            onMouseLeave={() => setHover(null)}
            title={`${l.name}: ${l.percent}%`}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {segments.map((l) => (
          <li
            key={l.name}
            className={cn('flex min-w-0 items-center gap-2 text-sm transition-opacity', hover && hover !== l.name && 'opacity-40')}
            onMouseEnter={() => setHover(l.name)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
            <span className="truncate text-zinc-200">{l.name}</span>
            <span className="ml-auto tabular-nums text-zinc-500">{l.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Circular score gauge. */
export function HealthRing({ score, grade, size = 132 }: { score: number; grade?: string; size?: number }) {
  const tone = healthTone(score);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#27272a" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-zinc-50">{score}</span>
        <span className={cn('text-xs font-medium', tone.text)}>
          {grade ? `Grade ${grade}` : tone.label}
        </span>
      </div>
      <span className="sr-only">
        Health score {score} out of 100{grade ? `, grade ${grade}` : ''}
      </span>
    </div>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
  color?: string;
}

/** Horizontal bar list: single hue (magnitude), values in text tokens, hover highlight. */
export function BarList({
  data,
  format = formatNumber,
  mono = false,
  emptyLabel = 'No data',
}: {
  data: BarDatum[];
  format?: (n: number) => string;
  mono?: boolean;
  emptyLabel?: string;
}) {
  if (!data.length) return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-1.5">
      {data.map((d) => (
        <li key={d.label} className="group relative" title={d.hint ? `${d.label}: ${d.hint}` : `${d.label}: ${format(d.value)}`}>
          <div
            className="absolute inset-y-0 left-0 rounded-md bg-brand-500/15 transition-colors group-hover:bg-brand-500/25"
            style={{ width: `${Math.max((d.value / max) * 100, 1.5)}%`, backgroundColor: d.color ? `${d.color}26` : undefined }}
            aria-hidden
          />
          <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm">
            <span className={cn('truncate text-zinc-200', mono && 'font-mono text-[13px]')}>{d.label}</span>
            <span className="shrink-0 tabular-nums text-zinc-400">
              {format(d.value)}
              {d.hint && <span className="ml-2 text-xs text-zinc-500">{d.hint}</span>}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Proportion breakdown (e.g. code / comments / blank) as a segmented bar with legend. */
export function SegmentBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-zinc-800">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${formatNumber(s.value)}`}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="text-zinc-300">{s.label}</span>
            <span className="tabular-nums text-zinc-500">
              {formatNumber(s.value)} ({Math.round((s.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

