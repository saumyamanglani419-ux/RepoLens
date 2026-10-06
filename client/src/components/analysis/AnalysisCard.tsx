import { Link } from 'react-router-dom';
import { LuFileCode, LuPackage, LuRefreshCw, LuRoute, LuStar, LuTrash2 } from 'react-icons/lu';
import type { AnalysisListItem } from '@/types';
import { Avatar, Badge } from '@/components/ui/primitives';
import { Spinner } from '@/components/ui/Spinner';
import { cn, formatCompact, healthTone, timeAgo } from '@/lib/format';

export function HealthPill({ score }: { score: number }) {
  const tone = healthTone(score);
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums', tone.bg, tone.text)} title={`Health score: ${tone.label}`}>
      {score}
      <span className="font-normal opacity-70">/100</span>
    </span>
  );
}

interface AnalysisCardProps {
  item: AnalysisListItem;
  onReanalyze?: (item: AnalysisListItem) => void;
  onDelete?: (item: AnalysisListItem) => void;
  busy?: boolean;
}

export function AnalysisCard({ item, onReanalyze, onDelete, busy = false }: AnalysisCardProps) {
  const s = item.summary;
  const [owner, name] = item.fullName.split('/');
  return (
    <article className="card group relative flex flex-col p-4 transition hover:border-zinc-700 hover:bg-zinc-900/80">
      <div className="flex items-start gap-3">
        <Avatar src={s.ownerAvatarUrl} name={owner} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-100">
            <Link to={`/app/analyses/${item.id}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">
              <span className="text-zinc-400">{owner}/</span>
              {name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {s.projectType} · {timeAgo(item.analyzedAt)}
            {item.runCount > 1 && ` · ${item.runCount} runs`}
          </p>
        </div>
        <HealthPill score={s.healthScore} />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-400">{s.description || 'No description.'}</p>

      {s.languages.length > 0 && (
        <div className="mt-3 flex h-1.5 gap-[2px] overflow-hidden rounded-full" aria-hidden>
          {s.languages.map((l) => (
            <div key={l.name} style={{ width: `${Math.max(l.percent, 1)}%`, backgroundColor: l.color }} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.stack.slice(0, 4).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
        {s.stack.length > 4 && <Badge className="text-zinc-500">+{s.stack.length - 4}</Badge>}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1" title="Stars">
          <LuStar className="h-3.5 w-3.5" /> {formatCompact(s.stars)}
        </span>
        <span className="flex items-center gap-1" title="Files">
          <LuFileCode className="h-3.5 w-3.5" /> {formatCompact(s.totalFiles)}
        </span>
        <span className="flex items-center gap-1" title="Dependencies">
          <LuPackage className="h-3.5 w-3.5" /> {s.dependencyCount}
        </span>
        <span className="flex items-center gap-1" title="API endpoints">
          <LuRoute className="h-3.5 w-3.5" /> {s.endpointCount}
        </span>
        {(onReanalyze || onDelete) && (
          <div className="relative z-10 ml-auto flex gap-1">
            {onReanalyze && (
              <button
                type="button"
                onClick={() => onReanalyze(item)}
                disabled={busy}
                className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
                aria-label={`Re-analyze ${item.fullName}`}
                title="Re-analyze"
              >
                {busy ? <Spinner className="h-3.5 w-3.5" /> : <LuRefreshCw className="h-3.5 w-3.5" />}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={busy}
                className="rounded-md p-1.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                aria-label={`Delete ${item.fullName} from history`}
                title="Delete"
              >
                <LuTrash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function AnalysisCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <div className="skeleton h-10 w-10" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="skeleton mt-4 h-3 w-full" />
      <div className="skeleton mt-2 h-3 w-4/5" />
      <div className="skeleton mt-4 h-1.5 w-full" />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-5 w-14" />
      </div>
    </div>
  );
}
