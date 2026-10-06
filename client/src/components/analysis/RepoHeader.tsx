import type { ReactNode } from 'react';
import {
  LuCircleDot,
  LuClock,
  LuDownload,
  LuExternalLink,
  LuEye,
  LuGitBranch,
  LuGitFork,
  LuGithub,
  LuRefreshCw,
  LuScale,
  LuStar,
  LuTrash2,
} from 'react-icons/lu';
import type { AnalysisDetail } from '@/types';
import { Avatar, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatCompact, formatDate, timeAgo } from '@/lib/format';

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-zinc-400" title={label}>
      <span className="text-zinc-500">{icon}</span>
      <span className="font-medium tabular-nums text-zinc-200">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

interface RepoHeaderProps {
  analysis: AnalysisDetail;
  onReanalyze: () => void;
  onDelete: () => void;
  onExport: () => void;
  reanalyzing: boolean;
}

export function RepoHeader({ analysis, onReanalyze, onDelete, onExport, reanalyzing }: RepoHeaderProps) {
  const { repo, project, meta } = analysis.report;

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <Avatar src={repo.ownerAvatarUrl} name={repo.owner} className="h-14 w-14" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
                <span className="text-zinc-400">{repo.owner}/</span>
                {repo.name}
              </h1>
              {repo.archived && <Badge tone="warning">Archived</Badge>}
              {repo.isFork && <Badge>Fork</Badge>}
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-400">
              {repo.description || <span className="italic text-zinc-500">No description provided.</span>}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="brand">{project.type}</Badge>
              {project.isMonorepo && <Badge tone="info">Monorepo</Badge>}
              <Badge>
                <LuGitBranch className="h-3 w-3" aria-hidden /> {repo.defaultBranch}
              </Badge>
              {repo.license && (
                <Badge>
                  <LuScale className="h-3 w-3" aria-hidden /> {repo.license}
                </Badge>
              )}
              {repo.topics.slice(0, 6).map((t) => (
                <Badge key={t} tone="neutral" className="font-normal text-zinc-400">
                  #{t}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={onReanalyze} loading={reanalyzing} icon={<LuRefreshCw className="h-4 w-4" />}>
            Re-analyze
          </Button>
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800/80"
          >
            <LuGithub className="h-4 w-4" /> GitHub <LuExternalLink className="h-3 w-3 text-zinc-500" />
          </a>
          <Button variant="outline" size="sm" onClick={onExport} icon={<LuDownload className="h-4 w-4" />} aria-label="Export report as JSON">
            JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete analysis" title="Delete analysis" className="text-zinc-400 hover:text-rose-300">
            <LuTrash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-800/80 pt-4">
        <Stat icon={<LuStar className="h-4 w-4" />} label="stars" value={formatCompact(repo.stars)} />
        <Stat icon={<LuGitFork className="h-4 w-4" />} label="forks" value={formatCompact(repo.forks)} />
        <Stat icon={<LuEye className="h-4 w-4" />} label="watchers" value={formatCompact(repo.watchers)} />
        <Stat icon={<LuCircleDot className="h-4 w-4" />} label="open issues" value={formatCompact(repo.openIssues)} />
        {repo.homepage && (
          <a href={repo.homepage} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-sm text-brand-300 hover:underline">
            <LuExternalLink className="h-3.5 w-3.5" /> {repo.homepage.replace(/^https?:\/\//, '')}
          </a>
        )}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 sm:ml-auto" title={`Analyzed ${new Date(analysis.analyzedAt).toLocaleString()}`}>
          <LuClock className="h-3.5 w-3.5" />
          Analyzed {timeAgo(analysis.analyzedAt)} in {(meta.durationMs / 1000).toFixed(1)}s · created {formatDate(repo.createdAt)}
        </div>
      </div>
    </div>
  );
}
