const NAME_RE = /^[A-Za-z0-9_.-]{1,100}$/;

/** Client-side mirror of the server's parser, for instant form validation. */
export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  let value = input.trim();
  if (!value) return null;

  const ssh = value.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (ssh) return check(ssh[1], ssh[2]);

  const short = value.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (short && !value.includes('.com')) return check(short[1], short[2]);

  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host !== 'github.com' && host !== 'www.github.com') return null;
  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return null;
  return check(owner, repo.replace(/\.git$/i, ''));
}

function check(owner: string, repo: string) {
  if (!NAME_RE.test(owner) || !NAME_RE.test(repo) || repo === '.' || repo === '..') return null;
  return { owner, repo };
}

export const EXAMPLE_REPOS = [
  'expressjs/express',
  'vercel/next.js',
  'tiangolo/fastapi',
  'gin-gonic/gin',
  'facebook/react',
  'django/django',
];
