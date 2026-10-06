const NAME_RE = /^[A-Za-z0-9_.-]{1,100}$/;

/**
 * Accepts the many ways people paste GitHub repositories and returns { owner, repo }.
 *   https://github.com/facebook/react
 *   github.com/facebook/react/tree/main/packages
 *   git@github.com:facebook/react.git
 *   facebook/react
 * Returns null when the input is not a recognisable GitHub repository.
 */
export function parseRepoUrl(input) {
  if (typeof input !== 'string') return null;
  let value = input.trim();
  if (!value) return null;

  // SSH form
  const ssh = value.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  if (ssh) return validate(ssh[1], ssh[2]);

  // shorthand owner/repo
  const short = value.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (short && !value.includes('.com')) return validate(short[1], short[2]);

  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host !== 'github.com' && host !== 'www.github.com') return null;

  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return null;
  return validate(owner, repo.replace(/\.git$/i, ''));
}

function validate(owner, repo) {
  if (!NAME_RE.test(owner) || !NAME_RE.test(repo)) return null;
  if (repo === '.' || repo === '..') return null;
  return { owner, repo };
}
