import { useMemo, useState } from 'react';
import { LuExternalLink, LuPackage, LuSearch } from 'react-icons/lu';
import type { Report } from '@/types';
import { Badge, Card, EmptyState, StatTile } from '@/components/ui/primitives';
import { cn, formatNumber, registryUrl } from '@/lib/format';

type Scope = 'all' | 'production' | 'development';

export function DependenciesTab({ report }: { report: Report }) {
  const { manifests, totals, ecosystems } = report.dependencies;
  const [selected, setSelected] = useState<string>(manifests[0]?.path ?? '');
  const [scope, setScope] = useState<Scope>('all');
  const [query, setQuery] = useState('');

  const manifest = manifests.find((m) => m.path === selected) ?? manifests[0];

  const rows = useMemo(() => {
    if (!manifest) return [];
    const q = query.trim().toLowerCase();
    const list = [
      ...(scope !== 'development' ? manifest.production.map((d) => ({ ...d, kind: 'production' as const })) : []),
      ...(scope !== 'production' ? manifest.development.map((d) => ({ ...d, kind: 'development' as const })) : []),
    ];
    return q ? list.filter((d) => d.name.toLowerCase().includes(q)) : list;
  }, [manifest, scope, query]);

  if (!manifests.length) {
    return (
      <Card>
        <EmptyState
          icon={<LuPackage className="h-5 w-5" />}
          title="No dependency manifests found"
          description="RepoLens reads package.json, requirements.txt, pyproject.toml, Pipfile, go.mod, Cargo.toml, composer.json, Gemfile, pom.xml, build.gradle and pubspec.yaml."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Unique packages" value={formatNumber(totals.unique)} />
        <StatTile label="Production" value={formatNumber(totals.production)} />
        <StatTile label="Development" value={formatNumber(totals.development)} />
        <StatTile label="Ecosystems" value={ecosystems.length} hint={ecosystems.join(', ')} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <p className="border-b border-zinc-800/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Manifests ({manifests.length})
          </p>
          <ul className="max-h-[480px] overflow-auto p-2" role="listbox" aria-label="Dependency manifests">
            {manifests.map((m) => {
              const active = m.path === manifest?.path;
              return (
                <li key={m.path}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setSelected(m.path)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left transition',
                      active ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40',
                    )}
                  >
                    <p className={cn('truncate font-mono text-[13px]', active ? 'text-zinc-50' : 'text-zinc-300')}>{m.path}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {m.label} · {m.production.length} prod · {m.development.length} dev
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-zinc-800/80 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search packages…"
                aria-label="Search packages"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
              />
            </div>
            <div className="flex rounded-lg border border-zinc-800 p-0.5" role="radiogroup" aria-label="Dependency scope">
              {(['all', 'production', 'development'] as Scope[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={scope === s}
                  onClick={() => setScope(s)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition',
                    scope === s ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  {s === 'development' ? 'Dev' : s}
                </button>
              ))}
            </div>
          </div>

          {rows.length ? (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Package</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Version</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {rows.map((d) => {
                    const href = manifest ? registryUrl(manifest.ecosystem, d.name) : null;
                    return (
                      <tr key={`${d.kind}-${d.name}`} className="hover:bg-zinc-800/20">
                        <td className="max-w-0 px-4 py-2">
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer" className="group inline-flex max-w-full items-center gap-1.5 font-mono text-[13px] text-zinc-200 hover:text-brand-300">
                              <span className="truncate">{d.name}</span>
                              <LuExternalLink className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" aria-hidden />
                            </a>
                          ) : (
                            <span className="truncate font-mono text-[13px] text-zinc-200">{d.name}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-zinc-400">{d.version}</td>
                        <td className="hidden px-4 py-2 sm:table-cell">
                          <Badge tone={d.kind === 'production' ? 'brand' : 'neutral'}>{d.kind === 'production' ? 'prod' : 'dev'}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-12 text-center text-sm text-zinc-500">No packages match your filters.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
