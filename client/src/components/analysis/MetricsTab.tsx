import { LuChartColumn, LuFileCode, LuFlame, LuGauge } from 'react-icons/lu';
import type { Report } from '@/types';
import { Card, CardHeader, StatTile } from '@/components/ui/primitives';
import { BarList, SegmentBar } from './charts';
import { formatBytes, formatCompact, formatNumber, githubBlobUrl } from '@/lib/format';

export function MetricsTab({ report }: { report: Report }) {
  const m = report.metrics;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total files" value={formatNumber(m.totalFiles)} hint={`${formatNumber(m.totalDirs)} directories`} />
        <StatTile label="Repository size" value={formatBytes(m.totalSize)} hint={`avg ${formatBytes(m.avgFileSize)} / file`} />
        <StatTile label="Est. lines of code" value={formatCompact(m.estimatedLoc)} hint={`${formatNumber(m.sourceFiles)} source files`} />
        <StatTile label="Max depth" value={m.maxDepth} hint={<span className="block truncate font-mono" title={m.deepestPath}>{m.deepestPath}</span>} />
        <StatTile label="Test files" value={formatNumber(m.testFiles)} hint={`${pct(m.testToSourceRatio)} of source file count`} />
        <StatTile label="Docs files" value={formatNumber(m.docFiles)} hint="Markdown, reStructuredText…" />
        <StatTile label="Images" value={formatNumber(m.imageFiles)} hint="png, svg, jpg…" />
        <StatTile label="Vendored / generated" value={formatNumber(m.vendoredFiles)} hint="excluded from stats" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="File types" description="By number of files (excluding vendored code)" icon={<LuChartColumn className="h-4 w-4" />} />
          <div className="p-4">
            <BarList
              mono
              data={m.filesByExtension.map((e) => ({
                label: e.ext === '(none)' ? '(no extension)' : `.${e.ext}`,
                value: e.count,
                hint: formatBytes(e.size),
              }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Largest files" description="Candidates for review or Git LFS" icon={<LuFlame className="h-4 w-4" />} />
          <ul className="divide-y divide-zinc-800/60">
            {m.largestFiles.map((f) => (
              <li key={f.path} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <a
                  href={githubBlobUrl(report.repo.url, report.meta.branch, f.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate font-mono text-[13px] text-zinc-300 hover:text-brand-300"
                  title={f.path}
                >
                  {f.path}
                </a>
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">{formatBytes(f.size)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Line composition (sampled)"
            description={`Measured on ${m.sampled.files} downloaded source files, ${formatNumber(m.sampled.lines)} lines`}
            icon={<LuFileCode className="h-4 w-4" />}
          />
          <div className="p-5">
            {m.sampled.lines ? (
              <SegmentBar
                segments={[
                  { label: 'Code', value: m.sampled.code, color: '#818cf8' },
                  { label: 'Comments', value: m.sampled.comment, color: '#22d3ee' },
                  { label: 'Blank', value: m.sampled.blank, color: '#52525b' },
                ]}
              />
            ) : (
              <p className="text-sm text-zinc-500">No source files were sampled for this repository.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="How these numbers are computed" icon={<LuGauge className="h-4 w-4" />} />
          <ul className="space-y-2 p-5 text-sm text-zinc-400">
            <li>• File counts, sizes and depth come from GitHub&apos;s recursive git tree for <code className="kbd">{report.meta.branch}</code>.</li>
            <li>• Lines of code are estimated from source bytes using the bytes-per-line ratio measured in sampled files.</li>
            <li>• Vendored and generated folders (node_modules, dist, build, vendor…) are excluded from per-type stats.</li>
            {report.meta.treeTruncated && <li className="text-amber-300">• GitHub truncated the tree for this very large repository; totals are lower bounds.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
