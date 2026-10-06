import { useState, type FormEvent } from 'react';
import { LuArrowRight, LuGithub } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { EXAMPLE_REPOS, parseRepoUrl } from '@/lib/repoUrl';
import { cn } from '@/lib/format';

interface AnalyzeFormProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
  defaultValue?: string;
  size?: 'md' | 'lg';
  showExamples?: boolean;
  autoFocus?: boolean;
  submitLabel?: string;
}

export function AnalyzeForm({
  onSubmit,
  loading = false,
  defaultValue = '',
  size = 'md',
  showExamples = true,
  autoFocus = false,
  submitLabel = 'Analyze',
}: AnalyzeFormProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseRepoUrl(value);
    if (!value.trim()) {
      setError('Paste a GitHub repository URL to get started.');
      return;
    }
    if (!parsed) {
      setError('That doesn’t look like a GitHub repository. Try https://github.com/owner/repo');
      return;
    }
    setError(null);
    onSubmit(`https://github.com/${parsed.owner}/${parsed.repo}`);
  };

  const large = size === 'lg';

  return (
    <div>
      <form onSubmit={submit} noValidate className="w-full">
        <label htmlFor="repo-url" className="sr-only">
          GitHub repository URL
        </label>
        <div
          className={cn(
            'flex flex-col gap-2 rounded-xl border bg-zinc-900/80 p-1.5 shadow-xl shadow-black/20 transition focus-within:border-brand-400/70 focus-within:ring-4 focus-within:ring-brand-500/10 sm:flex-row sm:items-center',
            error ? 'border-rose-500/60' : 'border-zinc-700/80',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-2.5">
            <LuGithub className={cn('shrink-0 text-zinc-500', large ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden />
            <input
              id="repo-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              autoFocus={autoFocus}
              placeholder="https://github.com/owner/repository"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'repo-url-error' : undefined}
              disabled={loading}
              className={cn(
                'w-full min-w-0 bg-transparent font-mono text-zinc-100 placeholder:font-sans placeholder:text-zinc-500 focus:outline-none',
                large ? 'h-11 text-base' : 'h-9 text-sm',
              )}
            />
          </div>
          <Button type="submit" size={large ? 'lg' : 'md'} loading={loading} className="shrink-0">
            {loading ? 'Analyzing…' : submitLabel}
            {!loading && <LuArrowRight className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
        {error && (
          <p id="repo-url-error" role="alert" className="mt-2 text-sm text-rose-400">
            {error}
          </p>
        )}
      </form>
      {showExamples && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500">Try:</span>
          {EXAMPLE_REPOS.slice(0, 4).map((r) => (
            <button
              key={r}
              type="button"
              disabled={loading}
              onClick={() => {
                setValue(`https://github.com/${r}`);
                setError(null);
              }}
              className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 font-mono text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
