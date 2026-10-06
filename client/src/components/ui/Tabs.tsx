import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/format';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

/** Accessible, keyboard-navigable tab list (arrow keys / Home / End). */
export function Tabs({
  tabs,
  active,
  onChange,
  idPrefix = 'tab',
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  idPrefix?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(tabs[next].id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className="-mb-px flex gap-1 overflow-x-auto border-b border-zinc-800"
    >
      {tabs.map((t, i) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              selected
                ? 'border-brand-400 text-zinc-50'
                : 'border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[11px] tabular-nums',
                  selected ? 'bg-brand-500/20 text-brand-200' : 'bg-zinc-800 text-zinc-400',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
