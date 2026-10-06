import { github as defaultClient } from '../services/github.js';
import { AppError } from '../utils/AppError.js';
import { analyzeDependencies, dependencyIndex, findManifest } from './dependencies.js';
import { detectStack } from './stack.js';
import { detectConfigFiles } from './configFiles.js';
import { detectEndpoints, selectRouteCandidates } from './endpoints.js';
import { buildStructure } from './structure.js';
import { computeMetrics } from './metrics.js';
import { analyzeReadme, buildInsights, classifyProject, collectScripts, findEntryPoints } from './insights.js';
import { SOURCE_EXTS, depthOf, extOf, isVendored, languageColor } from './files.js';

const MAX_MANIFESTS = 16;
const FETCH_CONCURRENCY = 8;

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

function normalizeRepo(meta) {
  return {
    githubId: meta.id,
    owner: meta.owner?.login,
    name: meta.name,
    fullName: meta.full_name,
    description: meta.description || '',
    url: meta.html_url,
    homepage: meta.homepage || '',
    defaultBranch: meta.default_branch,
    stars: meta.stargazers_count ?? 0,
    forks: meta.forks_count ?? 0,
    watchers: meta.subscribers_count ?? meta.watchers_count ?? 0,
    openIssues: meta.open_issues_count ?? 0,
    license: meta.license?.spdx_id && meta.license.spdx_id !== 'NOASSERTION' ? meta.license.spdx_id : meta.license?.name || null,
    topics: meta.topics || [],
    primaryLanguage: meta.language || null,
    ownerAvatarUrl: meta.owner?.avatar_url || '',
    ownerType: meta.owner?.type || 'User',
    isFork: Boolean(meta.fork),
    archived: Boolean(meta.archived),
    sizeKb: meta.size ?? 0,
    createdAt: meta.created_at,
    updatedAt: meta.updated_at,
    pushedAt: meta.pushed_at,
  };
}

function normalizeLanguages(raw, blobs) {
  let entries = Object.entries(raw || {});
  if (!entries.length) {
    // Fallback: estimate from file extensions when GitHub has no language data.
    const bytes = {};
    for (const b of blobs) {
      const lang = SOURCE_EXTS[extOf(b.path)];
      if (lang && !isVendored(b.path)) bytes[lang] = (bytes[lang] || 0) + (b.size || 0);
    }
    entries = Object.entries(bytes);
  }
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes], i) => ({
      name,
      bytes,
      percent: Number(((bytes / total) * 100).toFixed(1)),
      color: languageColor(name, i),
    }));
}

/**
 * Runs the full rule-based analysis for a public GitHub repository.
 * @param {string} owner
 * @param {string} repo
 * @param {{ client?: typeof defaultClient }} [options] injectable GitHub client (for tests)
 */
export async function analyzeRepository(owner, repo, { client = defaultClient } = {}) {
  const started = Date.now();

  const meta = await client.getRepo(owner, repo);
  if (meta.private) throw new AppError('Only public repositories can be analyzed.', 403, 'PRIVATE_REPOSITORY');
  const repoInfo = normalizeRepo(meta);
  const ref = repoInfo.defaultBranch;

  const [languagesRaw, tree, contributorsRaw] = await Promise.all([
    client.getLanguages(repoInfo.owner, repoInfo.name),
    client.getTree(repoInfo.owner, repoInfo.name, ref),
    client.getContributors(repoInfo.owner, repoInfo.name),
  ]);

  if (!tree || !Array.isArray(tree.tree) || tree.tree.length === 0) {
    throw new AppError('This repository is empty. There is nothing to analyze yet.', 422, 'EMPTY_REPOSITORY');
  }

  const entries = tree.tree.filter((e) => e.type === 'blob' || e.type === 'tree');
  const blobs = entries.filter((e) => e.type === 'blob').map((e) => ({ path: e.path, size: e.size || 0 }));
  const paths = blobs.map((b) => b.path);
  const dirCount = entries.length - blobs.length;

  // ── Decide which files to download ──
  const manifestPaths = blobs
    .filter((b) => findManifest(b.path) && !isVendored(b.path) && depthOf(b.path) <= 4 && b.size < 512 * 1024)
    .sort((a, b) => {
      const aux = (p) => (/(^|\/)(examples?|samples?|fixtures?|test|tests|docs?|benchmarks?)\//i.test(p) ? 1 : 0);
      return aux(a.path) - aux(b.path) || depthOf(a.path) - depthOf(b.path);
    })
    .slice(0, MAX_MANIFESTS)
    .map((b) => b.path);
  const readmePath = paths.find((p) => /^readme(\.(md|markdown|mdx|rst|txt))?$/i.test(p)) || null;
  const makefilePath = paths.includes('Makefile') ? 'Makefile' : null;
  const procfilePath = paths.includes('Procfile') ? 'Procfile' : null;
  const routeCandidates = selectRouteCandidates(blobs);

  const toFetch = [...new Set([...manifestPaths, readmePath, makefilePath, procfilePath, ...routeCandidates].filter(Boolean))];
  const fetched = await mapLimit(toFetch, FETCH_CONCURRENCY, async (path) => ({
    path,
    content: await client.getRawFile(repoInfo.owner, repoInfo.name, ref, path),
  }));
  const contentOf = new Map(fetched.map((f) => [f.path, f.content]));

  // ── Run analysis modules ──
  const languages = normalizeLanguages(languagesRaw, blobs);
  const dependencies = analyzeDependencies(manifestPaths.map((path) => ({ path, content: contentOf.get(path) })));
  const stack = detectStack({ paths, deps: dependencyIndex(dependencies), languages: Object.fromEntries(languages.map((l) => [l.name, l.bytes])) });
  const configFiles = detectConfigFiles(paths);
  const routeFiles = routeCandidates.map((path) => ({ path, content: contentOf.get(path) })).filter((f) => f.content);
  const endpoints = detectEndpoints(routeFiles, paths);
  const structure = buildStructure(entries);
  const metrics = computeMetrics(blobs, dirCount, routeFiles);
  const readme = analyzeReadme(readmePath, readmePath ? contentOf.get(readmePath) : null);
  const project = classifyProject({ stack, deps: dependencies, endpoints, paths, languages });
  const insights = buildInsights({
    repo: repoInfo,
    paths,
    stack,
    deps: dependencies,
    endpoints,
    metrics,
    configFiles,
    readme,
    languages,
    project,
  });

  const contributors = (contributorsRaw || [])
    .filter((c) => c && c.login)
    .slice(0, 10)
    .map((c) => ({ login: c.login, avatarUrl: c.avatar_url, url: c.html_url, contributions: c.contributions }));

  return {
    version: 1,
    repo: repoInfo,
    project,
    languages,
    stack,
    dependencies,
    configFiles,
    endpoints,
    structure,
    metrics,
    readme,
    insights,
    contributors,
    entryPoints: findEntryPoints(paths, dependencies),
    scripts: collectScripts(dependencies, makefilePath && contentOf.get(makefilePath), procfilePath && contentOf.get(procfilePath)),
    meta: {
      branch: ref,
      treeSha: tree.sha,
      treeTruncated: Boolean(tree.truncated),
      filesFetched: fetched.filter((f) => f.content != null).length,
      durationMs: Date.now() - started,
      analyzedAt: new Date().toISOString(),
    },
  };
}
