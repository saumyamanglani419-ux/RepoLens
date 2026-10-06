import { useMemo, useState } from 'react';
import { LuFileCode, LuFolder, LuListTree, LuSettings2 } from 'react-icons/lu';
import type { Report } from '@/types';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { FileTree } from './FileTree';
import { cn, formatBytes, formatNumber, githubBlobUrl, pluralize } from '@/lib/format';

export function StructureTab({ report }: { report: Report }) {
  const { structure, configFiles, repo, meta } = report;
  const categories = useMemo(() => Object.keys(configFiles.byCategory).sort(), [configFiles.byCategory]);
  const [category, setCategory] = useState<string>('all');
  const visibleConfigs = category === 'all' ? configFiles.files : configFiles.files.filter((f) => f.category === category);

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="space-y-6 xl:col-span-3">
        <Card>
          <CardHeader
            title="File tree"
            description={`${formatNumber(report.metrics.totalFiles)} files in ${formatNumber(report.metrics.totalDirs)} folders`}
            icon={<LuListTree className="h-4 w-4" />}
            action={structure.truncated || meta.treeTruncated ? <Badge tone="warning">Large repo · partially collapsed</Badge> : undefined}
          />
          <FileTree tree={structure.tree} repoUrl={repo.url} branch={meta.branch} />
        </Card>
      </div>

      <div className="space-y-6 xl:col-span-2">
        <Card>
          <CardHeader title="Top-level layout" description="What each root folder is for" icon={<LuFolder className="h-4 w-4" />} />
          <ul className="divide-y divide-zinc-800/60">
            {structure.topLevel.slice(0, 30).map((t) => (
              <li key={t.name} className="flex items-center gap-3 px-5 py-2.5">
                {t.type === 'dir' ? (
                  <LuFolder className="h-4 w-4 shrink-0 text-brand-300/80" aria-hidden />
                ) : (
                  <LuFileCode className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-zinc-200">
                    {t.name}
                    {t.type === 'dir' ? '/' : ''}
                  </p>
                  {t.role && <p className="truncate text-xs text-zinc-500">{t.role}</p>}
                </div>
                <span className="shrink-0 text-right text-xs tabular-nums text-zinc-500">
                  {t.type === 'dir' ? pluralize(t.fileCount ?? 0, 'file') : formatBytes(t.size)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Configuration files"
            description={`${configFiles.total} notable config files`}
            icon={<LuSettings2 className="h-4 w-4" />}
          />
          {configFiles.files.length ? (
            <>
              <div className="flex flex-wrap gap-1.5 border-b border-zinc-800/80 px-5 py-3">
                {['all', ...categories].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs transition',
                      category === c ? 'bg-brand-500/15 text-brand-200 ring-1 ring-brand-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
                    )}
                  >
                    {c === 'all' ? 'All' : c}
                    <span className="ml-1 text-zinc-500">{c === 'all' ? configFiles.files.length : configFiles.byCategory[c]}</span>
                  </button>
                ))}
              </div>
              <ul className="max-h-[420px] divide-y divide-zinc-800/60 overflow-auto">
                {visibleConfigs.map((f) => (
                  <li key={f.path} className="px-5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <a href={githubBlobUrl(repo.url, meta.branch, f.path)} target="_blank" rel="noreferrer" className="truncate font-mono text-[13px] text-zinc-200 hover:text-brand-300">
                        {f.path}
                      </a>
                      <Badge className="shrink-0">{f.category}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{f.description}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState title="No configuration files" description="No well-known configuration files were found." />
          )}
        </Card>
      </div>
    </div>
  );
}
