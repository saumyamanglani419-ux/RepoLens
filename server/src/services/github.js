import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const API_TIMEOUT_MS = 15_000;
const RAW_TIMEOUT_MS = 12_000;

function apiHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RepoLens-Analyzer',
  };
  if (env.githubToken) headers.Authorization = `Bearer ${env.githubToken}`;
  return headers;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('GitHub took too long to respond. Please try again.', 504, 'GITHUB_TIMEOUT');
    }
    throw new AppError('Could not reach GitHub. Check your network connection.', 502, 'GITHUB_UNREACHABLE');
  } finally {
    clearTimeout(timer);
  }
}

function rateLimitError(res) {
  const reset = Number(res.headers.get('x-ratelimit-reset'));
  const minutes = reset ? Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000)) : null;
  const hint = env.githubToken ? '' : ' Add a GITHUB_TOKEN on the server to raise the limit.';
  return new AppError(
    `GitHub API rate limit reached${minutes ? `; it resets in about ${minutes} min` : ''}.${hint}`,
    429,
    'GITHUB_RATE_LIMITED',
  );
}

async function api(path, { allow404 = false } = {}) {
  const res = await fetchWithTimeout(`${env.githubApiUrl}${path}`, { headers: apiHeaders() });

  if (res.status === 404) {
    if (allow404) return null;
    throw AppError.notFound('Repository not found. Make sure it exists and is public.');
  }
  if (res.status === 403 || res.status === 429) {
    if (res.headers.get('x-ratelimit-remaining') === '0' || res.status === 429) throw rateLimitError(res);
    throw new AppError('GitHub denied access to this repository.', 403, 'GITHUB_FORBIDDEN');
  }
  if (res.status === 401) {
    throw new AppError('The server GitHub token is invalid.', 502, 'GITHUB_BAD_TOKEN');
  }
  if (res.status === 409) {
    // Git Repository is empty.
    if (allow404) return null;
    throw new AppError('This repository is empty.', 422, 'EMPTY_REPOSITORY');
  }
  if (!res.ok) {
    throw new AppError(`GitHub responded with status ${res.status}.`, 502, 'GITHUB_ERROR');
  }
  return res.json();
}

const enc = (s) => encodeURIComponent(s);
const encPath = (p) => p.split('/').map(enc).join('/');

export const github = {
  getRepo: (owner, repo) => api(`/repos/${enc(owner)}/${enc(repo)}`),

  getLanguages: (owner, repo) => api(`/repos/${enc(owner)}/${enc(repo)}/languages`, { allow404: true }),

  getTree: (owner, repo, ref) =>
    api(`/repos/${enc(owner)}/${enc(repo)}/git/trees/${encPath(ref)}?recursive=1`, { allow404: true }),

  getContributors: async (owner, repo) => {
    try {
      const data = await api(`/repos/${enc(owner)}/${enc(repo)}/contributors?per_page=10`, { allow404: true });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (err.code === 'GITHUB_RATE_LIMITED') throw err;
      return []; // contributor stats are a nice-to-have
    }
  },

  /**
   * Fetches a file's text from raw.githubusercontent.com (does not count against
   * the REST API rate limit). Returns null on any failure.
   */
  getRawFile: async (owner, repo, ref, path) => {
    try {
      const headers = { 'User-Agent': 'RepoLens-Analyzer' };
      if (env.githubToken) headers.Authorization = `Bearer ${env.githubToken}`;
      const res = await fetchWithTimeout(
        `${env.githubRawUrl}/${enc(owner)}/${enc(repo)}/${encPath(ref)}/${encPath(path)}`,
        { headers },
        RAW_TIMEOUT_MS,
      );
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  },
};
