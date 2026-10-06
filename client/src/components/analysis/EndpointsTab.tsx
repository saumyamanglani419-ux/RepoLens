import { useMemo, useState } from 'react';
import { LuInfo, LuRoute, LuSearch } from 'react-icons/lu';
import type { Report } from '@/types';
import { Card, EmptyState } from '@/components/ui/primitives';
import { METHOD_STYLES, cn, githubBlobUrl } from '@/lib/format';

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[64px] justify-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-inset',
        METHOD_STYLES[method] ?? METHOD_STYLES.ANY,
      )}
    >
      {method}
    </span>
  );
}

export function EndpointsTab({ report }: { report: Report }) {
  const { endpoints, total, byMethod, frameworks, filesScanned } = report.endpoints;
  const [method, setMethod] = useState<string>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return endpoints.filter(
      (e) => (method === 'ALL' || e.method === method) && (!q || e.path.toLowerCase().includes(q) || e.file.toLowerCase().includes(q)),
    );
  }, [endpoints, method, query]);

  if (!total) {
    return (
      <Card>
        <EmptyState
          icon={<LuRoute className="h-5 w-5" />}
          title="No API endpoints detected"
          description={`RepoLens scanned ${filesScanned} likely route files for Express, Fastify, NestJS, Next.js, Flask, FastAPI, Django, Spring, Gin/Echo/Chi, Rails, Laravel and ASP.NET routes, and found none. This is normal for libraries, CLIs and frontend-only apps.`}
        />
      </Card>
    );
  }

  const methods = ['ALL', ...Object.keys(byMethod).sort()];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
        <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
        <p>
          Found <span className="font-medium text-zinc-200">{total}</span> endpoints ({frameworks.join(', ')}) by statically scanning{' '}
          {filesScanned} route-like files. Router mount prefixes are resolved where possible; dynamic routes may be missed.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search path or file…"
              aria-label="Search endpoints"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filter by HTTP method">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-mono text-xs transition',
                  method === m ? 'bg-zinc-800 text-zinc-50 ring-1 ring-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
                )}
              >
                {m}
                <span className="ml-1.5 text-zinc-500">{m === 'ALL' ? total : byMethod[m]}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th scope="col" className="w-24 px-4 py-2.5 font-medium">Method</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Path</th>
                  <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Defined in</th>
                  <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Framework</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((e) => (
                  <tr key={`${e.method}-${e.path}-${e.file}-${e.line}`} className="hover:bg-zinc-800/20">
                    <td className="px-4 py-2">
                      <MethodBadge method={e.method} />
                    </td>
                    <td className="px-4 py-2 font-mono text-[13px] text-zinc-100">
                      <span className="break-all">{e.path}</span>
                      <a
                        href={githubBlobUrl(report.repo.url, report.meta.branch, e.file, e.line)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block truncate text-xs text-zinc-500 hover:text-brand-300 md:hidden"
                      >
                        {e.file}:{e.line}
                      </a>
                    </td>
                    <td className="hidden max-w-xs px-4 py-2 md:table-cell">
                      <a
                        href={githubBlobUrl(report.repo.url, report.meta.branch, e.file, e.line)}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-mono text-xs text-zinc-400 hover:text-brand-300"
                        title={`${e.file}:${e.line}`}
                      >
                        {e.file}
                        <span className="text-zinc-600">:{e.line}</span>
                      </a>
                    </td>
                    <td className="hidden px-4 py-2 text-xs text-zinc-400 lg:table-cell">{e.framework}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-zinc-500">No endpoints match your filters.</p>
        )}
      </Card>
    </div>
  );
}
