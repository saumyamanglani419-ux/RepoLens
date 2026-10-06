import { useState } from 'react';
import { LuChevronDown, LuLayers } from 'react-icons/lu';
import type { Report, StackItem } from '@/types';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import { cn } from '@/lib/format';

function StackRow({ item }: { item: StackItem }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-zinc-800/80 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex-1 truncate text-sm font-medium text-zinc-100">{item.name}</span>
        <Badge tone={item.confidence === 'high' ? 'success' : 'neutral'} title="Detection confidence">
          {item.confidence === 'high' ? 'High' : 'Likely'}
        </Badge>
        <LuChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-zinc-800/80 px-3 py-2.5">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Evidence</p>
          <ul className="space-y-1">
            {item.evidence.map((e) => (
              <li key={e} className="break-all font-mono text-xs text-zinc-400">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function StackTab({ report }: { report: Report }) {
  const { categories, items } = report.stack;
  if (!items.length) {
    return (
      <Card>
        <EmptyState
          icon={<LuLayers className="h-5 w-5" />}
          title="No technologies detected"
          description="RepoLens couldn't match any known frameworks, tools or platforms in this repository."
        />
      </Card>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">
        {items.length} technologies detected across {categories.length} categories from manifests, config files and source
        languages. Expand any item to see the evidence.
      </p>
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4">
        {categories.map((cat) => (
          <Card key={cat.name} className="break-inside-avoid">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <h3 className="text-sm font-semibold text-zinc-100">{cat.name}</h3>
              <span className="text-xs tabular-nums text-zinc-500">{cat.items.length}</span>
            </div>
            <ul className="space-y-2 px-4 pb-4">
              {cat.items.map((item) => (
                <StackRow key={item.name} item={item} />
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
