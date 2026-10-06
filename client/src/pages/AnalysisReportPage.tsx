import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LuArrowLeft, LuChartColumn, LuLayers, LuLayoutDashboard, LuListTree, LuPackage, LuRoute } from 'react-icons/lu';
import { analysisApi, toApiError, type ApiError } from '@/lib/api';
import type { AnalysisDetail } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ButtonLink, Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/primitives';
import { RepoHeader } from '@/components/analysis/RepoHeader';
import { OverviewTab } from '@/components/analysis/OverviewTab';
import { StackTab } from '@/components/analysis/StackTab';
import { DependenciesTab } from '@/components/analysis/DependenciesTab';
import { StructureTab } from '@/components/analysis/StructureTab';
import { EndpointsTab } from '@/components/analysis/EndpointsTab';
import { MetricsTab } from '@/components/analysis/MetricsTab';
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress';

const TAB_IDS = ['overview', 'stack', 'dependencies', 'structure', 'endpoints', 'metrics'] as const;
type TabId = (typeof TAB_IDS)[number];

function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analysis">
      <div className="card p-6">
        <div className="flex gap-4">
          <Skeleton className="h-14 w-14" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96" />
        <Skeleton className="h-96 lg:col-span-2" />
      </div>
    </div>
  );
}

export function AnalysisReportPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tabParam = params.get('tab') as TabId | null;
  const tab: TabId = tabParam && TAB_IDS.includes(tabParam) ? tabParam : 'overview';
  const setTab = (next: string) => setParams(next === 'overview' ? {} : { tab: next }, { replace: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalysis(await analysisApi.get(id));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (analysis) document.title = `${analysis.fullName} · RepoLens`;
    return () => {
      document.title = 'RepoLens: Understand any codebase at a glance';
    };
  }, [analysis]);

  const reanalyze = async () => {
    if (!analysis) return;
    setReanalyzing(true);
    try {
      const updated = await analysisApi.reanalyze(analysis.id);
      setAnalysis(updated);
      const delta = updated.previousSummary ? updated.summary.healthScore - updated.previousSummary.healthScore : 0;
      toast.success('Analysis refreshed', delta ? `Health score ${delta > 0 ? '+' : ''}${delta} since last run.` : 'Report is up to date with GitHub.');
    } catch (err) {
      toast.error('Re-analysis failed', toApiError(err).message);
    } finally {
      setReanalyzing(false);
    }
  };

  const remove = async () => {
    if (!analysis) return;
    setDeleting(true);
    try {
      await analysisApi.remove(analysis.id);
      toast.success('Removed from history', analysis.fullName);
      navigate('/app/history', { replace: true });
    } catch (err) {
      toast.error('Could not delete', toApiError(err).message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const exportJson = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis.report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repolens-${analysis.fullName.replace('/', '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <ReportSkeleton />;

  if (error || !analysis) {
    return (
      <ErrorState
        title={error?.status === 404 ? 'Analysis not found' : 'Could not load analysis'}
        message={
          error?.status === 404
            ? 'It may have been deleted, or it belongs to a different account.'
            : (error?.message ?? 'Unknown error')
        }
        action={
          <div className="flex gap-2">
            <ButtonLink to="/app/history" variant="secondary" icon={<LuArrowLeft className="h-4 w-4" />}>
              Back to history
            </ButtonLink>
            {error?.status !== 404 && <Button onClick={() => void load()}>Retry</Button>}
          </div>
        }
      />
    );
  }

  if (reanalyzing) {
    return (
      <div className="py-10">
        <AnalysisProgress repo={analysis.fullName} />
      </div>
    );
  }

  const r = analysis.report;
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: <LuLayoutDashboard className="h-4 w-4" /> },
    { id: 'stack', label: 'Tech stack', icon: <LuLayers className="h-4 w-4" />, count: r.stack.items.length },
    { id: 'dependencies', label: 'Dependencies', icon: <LuPackage className="h-4 w-4" />, count: r.dependencies.totals.unique },
    { id: 'structure', label: 'Structure', icon: <LuListTree className="h-4 w-4" />, count: r.configFiles.total },
    { id: 'endpoints', label: 'API endpoints', icon: <LuRoute className="h-4 w-4" />, count: r.endpoints.total },
    { id: 'metrics', label: 'Metrics', icon: <LuChartColumn className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/app/history" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100">
        <LuArrowLeft className="h-4 w-4" /> History
      </Link>

      <RepoHeader
        analysis={analysis}
        reanalyzing={reanalyzing}
        onReanalyze={() => void reanalyze()}
        onDelete={() => setConfirmDelete(true)}
        onExport={exportJson}
      />

      <div>
        <Tabs tabs={tabs} active={tab} onChange={setTab} idPrefix="report" />
      </div>

      <section role="tabpanel" id={`report-panel-${tab}`} aria-labelledby={`report-${tab}`} className="animate-fade-in" key={tab}>
        {tab === 'overview' && <OverviewTab analysis={analysis} onNavigate={setTab} />}
        {tab === 'stack' && <StackTab report={r} />}
        {tab === 'dependencies' && <DependenciesTab report={r} />}
        {tab === 'structure' && <StructureTab report={r} />}
        {tab === 'endpoints' && <EndpointsTab report={r} />}
        {tab === 'metrics' && <MetricsTab report={r} />}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
        loading={deleting}
        title="Delete this analysis?"
        description={
          <>
            <span className="font-mono text-zinc-200">{analysis.fullName}</span> will be removed from your history. You can always analyze it again later.
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
