import { useEffect, useState } from 'react';
import { LuCheck } from 'react-icons/lu';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/format';

const STEPS = [
  'Fetching repository metadata',
  'Reading the full file tree',
  'Downloading manifests & key files',
  'Detecting languages and tech stack',
  'Scanning for API endpoints',
  'Computing metrics & health score',
];

/**
 * The analysis is a single request, so progress is simulated on a timer and
 * holds on the final step until the server responds.
 */
export function AnalysisProgress({ repo }: { repo: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="card mx-auto max-w-xl animate-slide-up p-6 sm:p-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
          <Spinner className="h-5 w-5" />
          <span className="absolute inset-0 animate-ping rounded-xl bg-brand-500/10" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">Analyzing</p>
          <p className="truncate font-mono text-base font-medium text-zinc-100">{repo}</p>
        </div>
      </div>
      <ol className="mt-6 space-y-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                  done && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                  current && 'border-brand-400/60 bg-brand-500/10 text-brand-300',
                  !done && !current && 'border-zinc-800 text-zinc-600',
                )}
              >
                {done ? <LuCheck className="h-3.5 w-3.5" /> : current ? <Spinner className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <span className={cn(done ? 'text-zinc-400' : current ? 'text-zinc-100' : 'text-zinc-600')}>{label}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-xs text-zinc-500">Large repositories can take up to half a minute.</p>
    </div>
  );
}
