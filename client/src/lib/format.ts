export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en');

export const formatCompact = (n: number | undefined | null) => compact.format(n ?? 0);
export const formatNumber = (n: number | undefined | null) => full.format(n ?? 0);

export function formatBytes(bytes: number | undefined | null): string {
  const b = bytes ?? 0;
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = b / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(date: string | Date | undefined | null): string {
  if (!date) return 'unknown';
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(seconds / (86400 * 30)), 'month');
  return rtf.format(Math.round(seconds / (86400 * 365)), 'year');
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function healthTone(score: number): { text: string; bg: string; ring: string; label: string } {
  if (score >= 85) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: '#34d399', label: 'Excellent' };
  if (score >= 70) return { text: 'text-lime-400', bg: 'bg-lime-500/10', ring: '#a3e635', label: 'Good' };
  if (score >= 55) return { text: 'text-amber-400', bg: 'bg-amber-500/10', ring: '#fbbf24', label: 'Fair' };
  if (score >= 40) return { text: 'text-orange-400', bg: 'bg-orange-500/10', ring: '#fb923c', label: 'Needs work' };
  return { text: 'text-rose-400', bg: 'bg-rose-500/10', ring: '#fb7185', label: 'Poor' };
}

export const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  POST: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  PUT: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  PATCH: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
  DELETE: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  ANY: 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/30',
};

export function registryUrl(ecosystem: string, name: string): string | null {
  const n = encodeURIComponent(name);
  switch (ecosystem) {
    case 'npm':
      return `https://www.npmjs.com/package/${name}`;
    case 'pypi':
      return `https://pypi.org/project/${n}/`;
    case 'go':
      return `https://pkg.go.dev/${name}`;
    case 'cargo':
      return `https://crates.io/crates/${n}`;
    case 'composer':
      return `https://packagist.org/packages/${name}`;
    case 'rubygems':
      return `https://rubygems.org/gems/${n}`;
    case 'pub':
      return `https://pub.dev/packages/${n}`;
    case 'maven':
    case 'gradle': {
      const [g, a] = name.split(':');
      return a ? `https://central.sonatype.com/artifact/${g}/${a}` : null;
    }
    default:
      return null;
  }
}

export function githubBlobUrl(repoUrl: string, branch: string, path: string, line?: number): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${repoUrl}/blob/${branch}/${encoded}${line ? `#L${line}` : ''}`;
}

export function pluralize(n: number, word: string, plural = `${word}s`): string {
  return `${formatNumber(n)} ${n === 1 ? word : plural}`;
}
