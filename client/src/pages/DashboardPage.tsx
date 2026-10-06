import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuActivity, LuArrowRight, LuFolderOpen, LuHistory, LuLayers, LuRoute, LuScanSearch, LuTelescope } from 'react-icons/lu';
import { analysisApi, toApiError } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AnalyzeForm } from '@/components/analysis/AnalyzeForm';
import { AnalysisCard, AnalysisCardSkeleton } from '@/components/analysis/AnalysisCard';
import { BarList } from '@/components/analysis/charts';
import { Button } from '@/components/ui/Button';
import { Badge, Card, CardHeader, EmptyState, ErrorState, Skeleton, StatTile } from '@/components/ui/primitives';
import { formatCompact, formatNumber, healthTone } from '@/lib/format';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    analysisApi
      .stats()
      .then(setStats)
      .catch((err) => setError(toApiError(err).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const analyze = (url: string) => navigate(`/app/analyze?url=${encodeURIComponent(url)}`);
  const isEmpty = stats && stats.totals.repositories === 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-indigo-950/40 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
        <div className="relative max-w-2xl">
          <p className="text-sm text-zinc-400">
            {greeting()}, {user?.name.split(' ')[0]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">What are we exploring today?</h1>
          <p className="mt-2 text-sm text-zinc-400">Paste a public GitHub repository to map its stack, structure and API surface in seconds.</p>
          <div className="mt-5">
            <AnalyzeForm onSubmit={analyze} />
          </div>
        </div>
      </section>

      {error ? (
        <ErrorState message={error} action={<Button onClick={load}>Retry</Button>} />
      ) : loading || !stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[98px]" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <AnalysisCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : isEmpty ? (
        <Card>
          <EmptyState
            icon={<LuTelescope className="h-5 w-5" />}
            title="No analyses yet"
            description="Run your first analysis above, or start with one of the example repositories. Your results will show up here."
            action={
              <Button onClick={() => analyze('https://github.com/expressjs/express')} icon={<LuScanSearch className="h-4 w-4" />}>
                Analyze expressjs/express
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Repositories" value={formatNumber(stats.totals.repositories)} hint={`${formatNumber(stats.totals.runs)} total runs`} icon={<LuFolderOpen className="h-4 w-4" />} />
            <StatTile
              label="Avg. health"
              value={<span className={healthTone(stats.totals.avgHealth).text}>{stats.totals.avgHealth}</span>}
              hint={healthTone(stats.totals.avgHealth).label}
              icon={<LuActivity className="h-4 w-4" />}
            />
            <StatTile label="Endpoints mapped" value={formatNumber(stats.totals.endpoints)} hint="across all repositories" icon={<LuRoute className="h-4 w-4" />} />
            <StatTile label="Files scanned" value={formatCompact(stats.totals.files)} hint="in analyzed trees" icon={<LuLayers className="h-4 w-4" />} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="xl:col-span-2" aria-labelledby="recent-heading">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="recent-heading" className="text-sm font-semibold text-zinc-100">
                  Recent analyses
                </h2>
                <Link to="/app/history" className="flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200">
                  View all <LuArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {stats.recent.map((item) => (
                  <AnalysisCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Primary languages" description="Across your analyzed repositories" icon={<LuHistory className="h-4 w-4" />} />
                <div className="p-4">
                  <BarList data={stats.languages.map((l) => ({ label: l.name, value: l.count, color: l.color }))} format={(n) => `${n} repo${n === 1 ? '' : 's'}`} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Technologies seen" icon={<LuLayers className="h-4 w-4" />} />
                <div className="flex flex-wrap gap-2 p-4">
                  {stats.technologies.length ? (
                    stats.technologies.map((t) => (
                      <Badge key={t.name} tone="neutral" className="py-1">
                        {t.name}
                        <span className="text-zinc-500">×{t.count}</span>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">Nothing yet.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
