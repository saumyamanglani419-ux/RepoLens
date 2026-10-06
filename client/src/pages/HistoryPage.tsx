import { useCallback, useEffect, useState } from 'react';
import { LuChevronRight, LuHistory, LuScanSearch, LuSearch, LuTrash2, LuArrowLeft } from 'react-icons/lu';
import { analysisApi, toApiError, type ListParams } from '@/lib/api';
import type { AnalysisListItem, Pagination } from '@/types';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/layout/AppLayout';
import { AnalysisCard, AnalysisCardSkeleton } from '@/components/analysis/AnalysisCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Card, EmptyState, ErrorState } from '@/components/ui/primitives';
import { cn } from '@/lib/format';

type Sort = NonNullable<ListParams['sort']>;
const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'health', label: 'Health score' },
  { value: 'stars', label: 'Stars' },
];

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function HistoryPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AnalysisListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AnalysisListItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [mutating, setMutating] = useState(false);
  const q = useDebounced(query.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analysisApi.list({ q: q || undefined, sort, page, limit: 12 });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [q, sort, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => setPage(1), [q, sort]);

  const reanalyze = async (item: AnalysisListItem) => {
    setBusyId(item.id);
    try {
      const updated = await analysisApi.reanalyze(item.id);
      setItems((list) => list.map((i) => (i.id === item.id ? updated : i)));
      toast.success('Re-analyzed', item.fullName);
    } catch (err) {
      toast.error('Re-analysis failed', toApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setMutating(true);
    try {
      await analysisApi.remove(toDelete.id);
      toast.success('Removed from history', toDelete.fullName);
      setToDelete(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else void load();
    } catch (err) {
      toast.error('Could not delete', toApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  const clearAll = async () => {
    setMutating(true);
    try {
      const deleted = await analysisApi.clearAll();
      toast.success('History cleared', `${deleted} ${deleted === 1 ? 'analysis' : 'analyses'} removed.`);
      setConfirmClear(false);
      setQuery('');
      setPage(1);
      void load();
    } catch (err) {
      toast.error('Could not clear history', toApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  const total = pagination?.total ?? 0;
  const noHistoryAtAll = !loading && !error && total === 0 && !q;

  return (
    <div>
      <PageHeader
        title="History"
        description="Every repository you've analyzed. Re-run an analysis to refresh it with the latest code."
        actions={
          <>
            <ButtonLink to="/app/analyze" icon={<LuScanSearch className="h-4 w-4" />}>
              New analysis
            </ButtonLink>
            {total > 0 && (
              <Button variant="outline" onClick={() => setConfirmClear(true)} icon={<LuTrash2 className="h-4 w-4" />}>
                Clear all
              </Button>
            )}
          </>
        }
      />

      {!noHistoryAtAll && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by repository, description or language…"
              aria-label="Search history"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="shrink-0">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {error ? (
        <ErrorState message={error} action={<Button onClick={() => void load()}>Retry</Button>} />
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AnalysisCardSkeleton key={i} />
          ))}
        </div>
      ) : noHistoryAtAll ? (
        <Card>
          <EmptyState
            icon={<LuHistory className="h-5 w-5" />}
            title="Your history is empty"
            description="Analyses you run will be saved here so you can revisit, refresh or compare them later."
            action={
              <ButtonLink to="/app/analyze" icon={<LuScanSearch className="h-4 w-4" />}>
                Analyze a repository
              </ButtonLink>
            }
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={<LuSearch className="h-5 w-5" />} title="No matches" description={`Nothing in your history matches “${q}”.`} action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>} />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <AnalysisCard key={item.id} item={item} busy={busyId === item.id} onReanalyze={(i) => void reanalyze(i)} onDelete={setToDelete} />
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
              <p className="text-sm text-zinc-500">
                Page {pagination.page} of {pagination.pages} · {total} repositories
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={<LuArrowLeft className="h-4 w-4" />}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
                  Next <LuChevronRight className={cn('h-4 w-4')} />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
        loading={mutating}
        title="Delete this analysis?"
        description={
          <>
            <span className="font-mono text-zinc-200">{toDelete?.fullName}</span> will be removed from your history.
          </>
        }
        confirmLabel="Delete"
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => void clearAll()}
        loading={mutating}
        title="Clear your entire history?"
        description={`This permanently removes all ${total} analyses. This cannot be undone.`}
        confirmLabel="Clear history"
      />
    </div>
  );
}
