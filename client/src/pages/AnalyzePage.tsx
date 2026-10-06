import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LuBraces, LuLayers, LuListTree, LuRoute } from 'react-icons/lu';
import { analysisApi, toApiError, type ApiError } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { AnalyzeForm } from '@/components/analysis/AnalyzeForm';
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress';
import { PageHeader } from '@/components/layout/AppLayout';
import { parseRepoUrl } from '@/lib/repoUrl';

const WHAT_YOU_GET = [
  { icon: LuLayers, title: 'Tech stack', text: 'Nearly 200 detection rules across frameworks, databases, tooling and CI.' },
  { icon: LuBraces, title: 'Dependencies', text: 'npm, PyPI, Go, Cargo, Maven, Gradle, Composer, RubyGems and Pub.' },
  { icon: LuListTree, title: 'Structure', text: 'Browsable file tree, folder roles, config files and metrics.' },
  { icon: LuRoute, title: 'API endpoints', text: 'Routes from Express, NestJS, Next.js, FastAPI, Django, Spring and more.' },
];

export function AnalyzePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const autoStarted = useRef(false);

  const run = async (url: string) => {
    const parsed = parseRepoUrl(url);
    setRunning(parsed ? `${parsed.owner}/${parsed.repo}` : url);
    setError(null);
    try {
      const analysis = await analysisApi.create(url);
      toast.success('Analysis complete', analysis.fullName);
      navigate(`/app/analyses/${analysis.id}`, { replace: true });
    } catch (err) {
      const apiErr = toApiError(err);
      setError(apiErr);
      setRunning(null);
      toast.error('Analysis failed', apiErr.message);
    }
  };

  // Support deep links like /app/analyze?url=https://github.com/owner/repo (used by the landing page).
  useEffect(() => {
    const url = params.get('url');
    if (url && !autoStarted.current) {
      autoStarted.current = true;
      setParams({}, { replace: true });
      if (parseRepoUrl(url)) void run(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (running) {
    return (
      <div className="py-10">
        <AnalysisProgress repo={running} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New analysis" description="Paste any public GitHub repository. RepoLens reads it through the GitHub API; nothing is cloned or executed." />
      <div className="card p-5 sm:p-6">
        <AnalyzeForm onSubmit={run} size="lg" autoFocus />
        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <p className="font-medium">Couldn’t analyze that repository</p>
            <p className="mt-0.5 text-rose-200/80">{error.message}</p>
          </div>
        )}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {WHAT_YOU_GET.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-xl border border-zinc-800/60 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{title}</p>
              <p className="mt-0.5 text-sm text-zinc-400">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
