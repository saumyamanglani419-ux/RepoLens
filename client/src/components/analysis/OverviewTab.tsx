import {
  LuActivity,
  LuBookOpen,
  LuCircleAlert,
  LuCircleCheck,
  LuCircleX,
  LuCode,
  LuFileCode,
  LuInfo,
  LuLayers,
  LuPackage,
  LuRoute,
  LuShieldAlert,
  LuSparkles,
  LuSquareTerminal,
  LuTrendingDown,
  LuTrendingUp,
  LuTriangleAlert,
  LuUsers,
} from 'react-icons/lu';
import type { AnalysisDetail, Warning } from '@/types';
import { Avatar, Badge, Card, CardHeader, StatTile } from '@/components/ui/primitives';
import { HealthRing, LanguageBar } from './charts';
import { cn, formatCompact, formatNumber, githubBlobUrl, healthTone } from '@/lib/format';

const WARNING_STYLE: Record<Warning['level'], { icon: typeof LuInfo; className: string }> = {
  danger: { icon: LuShieldAlert, className: 'border-rose-500/30 bg-rose-500/5 text-rose-200' },
  warning: { icon: LuTriangleAlert, className: 'border-amber-500/30 bg-amber-500/5 text-amber-100' },
  info: { icon: LuInfo, className: 'border-zinc-700/80 bg-zinc-800/30 text-zinc-300' },
};

export function OverviewTab({ analysis, onNavigate }: { analysis: AnalysisDetail; onNavigate: (tab: string) => void }) {
  const r = analysis.report;
  const tone = healthTone(r.insights.healthScore);
  const prev = analysis.previousSummary;
  const delta = prev ? r.insights.healthScore - prev.healthScore : 0;
  const coreStack = r.stack.items.filter((s) =>
    ['Frontend', 'Meta-framework', 'Backend', 'Database', 'ORM / Data access', 'Mobile & Desktop', 'API & Realtime'].includes(s.category),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-6">
        <StatTile label="Files" value={formatCompact(r.metrics.totalFiles)} hint={`${formatNumber(r.metrics.totalDirs)} folders`} icon={<LuFileCode className="h-4 w-4" />} />
        <StatTile label="Est. lines" value={formatCompact(r.metrics.estimatedLoc)} hint="of source code" icon={<LuCode className="h-4 w-4" />} />
        <StatTile label="Languages" value={r.languages.length} hint={r.languages[0]?.name ?? '—'} icon={<LuLayers className="h-4 w-4" />} />
        <StatTile label="Dependencies" value={formatNumber(r.dependencies.totals.unique)} hint={`${r.dependencies.totals.manifests} manifests`} icon={<LuPackage className="h-4 w-4" />} />
        <StatTile label="Endpoints" value={formatNumber(r.endpoints.total)} hint={r.endpoints.frameworks.join(', ') || 'none detected'} icon={<LuRoute className="h-4 w-4" />} />
        <StatTile label="Contributors" value={r.contributors.length >= 10 ? '10+' : r.contributors.length} hint="top contributors" icon={<LuUsers className="h-4 w-4" />} />
      </div>

      {/* Health */}
      <Card className="lg:row-span-3">
        <CardHeader title="Repository health" description="Rule-based checks for maintainability & best practice" icon={<LuActivity className="h-4 w-4" />} />
        <div className="flex flex-col items-center gap-2 px-5 pt-5">
          <HealthRing score={r.insights.healthScore} grade={r.insights.grade} />
          <p className={cn('text-sm font-medium', tone.text)}>{tone.label}</p>
          {prev && delta !== 0 && (
            <p className={cn('flex items-center gap-1 text-xs', delta > 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {delta > 0 ? <LuTrendingUp className="h-3.5 w-3.5" /> : <LuTrendingDown className="h-3.5 w-3.5" />}
              {delta > 0 ? '+' : ''}
              {delta} since previous run
            </p>
          )}
        </div>
        <ul className="space-y-1 p-4">
          {r.insights.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-800/30">
              {c.passed ? (
                <LuCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-label="Passed" />
              ) : (
                <LuCircleX className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" aria-label="Not passed" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-sm', c.passed ? 'text-zinc-200' : 'text-zinc-400')}>{c.label}</span>
                  <span className="text-[11px] tabular-nums text-zinc-600">{c.weight} pts</span>
                </div>
                <p className="truncate text-xs text-zinc-500" title={c.detail}>
                  {c.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Languages */}
      <Card className="lg:col-span-2">
        <CardHeader title="Languages" description="Share of source bytes, as reported by GitHub" icon={<LuCode className="h-4 w-4" />} />
        <div className="p-5">
          <LanguageBar languages={r.languages} />
        </div>
      </Card>

      {/* Highlights & warnings */}
      <Card className="lg:col-span-2">
        <CardHeader title="Key insights" description="What stands out about this codebase" icon={<LuSparkles className="h-4 w-4" />} />
        <div className="space-y-4 p-5">
          {r.insights.highlights.length > 0 && (
            <ul className="space-y-2">
              {r.insights.highlights.map((h) => (
                <li key={h} className="flex gap-2.5 text-sm text-zinc-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {r.insights.warnings.length > 0 && (
            <ul className="space-y-2">
              {r.insights.warnings.map((w) => {
                const style = WARNING_STYLE[w.level] ?? WARNING_STYLE.info;
                const Icon = style.icon;
                return (
                  <li key={w.message} className={cn('flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm', style.className)}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {w.message}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* Core stack */}
      <Card className="lg:col-span-2">
        <CardHeader
          title="Core technologies"
          description="Frameworks, databases and platforms detected"
          icon={<LuLayers className="h-4 w-4" />}
          action={
            <button type="button" onClick={() => onNavigate('stack')} className="text-xs font-medium text-brand-300 hover:text-brand-200">
              Full stack →
            </button>
          }
        />
        <div className="flex flex-wrap gap-2 p-5">
          {coreStack.length ? (
            coreStack.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200" title={s.evidence.join('\n')}>
                {s.name}
                <span className="text-[11px] text-zinc-500">{s.category}</span>
              </span>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No application frameworks detected. See the Stack tab for tooling.</p>
          )}
        </div>
      </Card>

      {/* README */}
      <Card>
        <CardHeader title="README" description={r.readme.path ?? 'Not found'} icon={<LuBookOpen className="h-4 w-4" />} />
        <div className="p-5">
          {r.readme.exists && r.readme.excerpt ? (
            <>
              <p className="text-sm leading-relaxed text-zinc-300">{r.readme.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone={r.readme.sections?.installation ? 'success' : 'neutral'}>Install</Badge>
                <Badge tone={r.readme.sections?.usage ? 'success' : 'neutral'}>Usage</Badge>
                <Badge tone={r.readme.sections?.contributing ? 'success' : 'neutral'}>Contributing</Badge>
                <Badge tone={r.readme.sections?.license ? 'success' : 'neutral'}>License</Badge>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {formatNumber(r.readme.wordCount ?? 0)} words · {r.readme.headings?.length ?? 0} sections · {r.readme.badges ?? 0} badges
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <LuCircleAlert className="h-4 w-4" /> {r.readme.exists ? 'README has no readable summary.' : 'This repository has no README.'}
            </p>
          )}
        </div>
      </Card>

      {/* Entry points & scripts */}
      <Card>
        <CardHeader title="Where to start" description="Entry points and runnable scripts" icon={<LuSquareTerminal className="h-4 w-4" />} />
        <div className="space-y-4 p-5">
          {r.entryPoints.length > 0 && (
            <ul className="space-y-1.5">
              {r.entryPoints.slice(0, 6).map((e) => (
                <li key={e.path} className="flex items-center justify-between gap-3 text-sm">
                  <a href={githubBlobUrl(r.repo.url, r.meta.branch, e.path)} target="_blank" rel="noreferrer" className="truncate font-mono text-[13px] text-brand-300 hover:underline">
                    {e.path}
                  </a>
                  <span className="shrink-0 text-xs text-zinc-500">{e.reason}</span>
                </li>
              ))}
            </ul>
          )}
          {r.scripts.length > 0 ? (
            <ul className="space-y-1.5 border-t border-zinc-800/80 pt-4">
              {r.scripts.slice(0, 8).map((s) => (
                <li key={`${s.source}-${s.name}`} className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-[13px] text-zinc-100">{s.name}</span>
                    <span className="text-[11px] text-zinc-600">{s.source}</span>
                  </div>
                  <code className="block truncate font-mono text-xs text-zinc-500" title={s.command}>
                    {s.command}
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            r.entryPoints.length === 0 && <p className="text-sm text-zinc-500">No obvious entry points or scripts found.</p>
          )}
        </div>
      </Card>

      {/* Contributors */}
      <Card>
        <CardHeader title="Top contributors" description="By number of commits" icon={<LuUsers className="h-4 w-4" />} />
        <div className="p-5">
          {r.contributors.length ? (
            <ul className="space-y-2.5">
              {r.contributors.slice(0, 6).map((c) => (
                <li key={c.login} className="flex items-center gap-3">
                  <Avatar src={c.avatarUrl} name={c.login} className="h-7 w-7 rounded-full" />
                  <a href={c.url} target="_blank" rel="noreferrer" className="truncate text-sm text-zinc-200 hover:text-brand-300">
                    {c.login}
                  </a>
                  <span className="ml-auto text-xs tabular-nums text-zinc-500">{formatNumber(c.contributions)} commits</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Contributor data is unavailable for this repository.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
