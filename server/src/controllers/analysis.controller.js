import mongoose from 'mongoose';
import { z } from 'zod';
import { Analysis } from '../models/Analysis.js';
import { Repository } from '../models/Repository.js';
import { analyzeRepository } from '../analyzer/index.js';
import { AppError } from '../utils/AppError.js';
import { parseRepoUrl } from '../utils/parseRepoUrl.js';

export const schemas = {
  create: z.object({
    url: z
      .string({ required_error: 'Repository URL is required' })
      .trim()
      .min(1, 'Repository URL is required')
      .max(300, 'URL is too long'),
  }),
};

// Prevents the same user from running the same analysis twice concurrently.
const inFlight = new Set();

/** MongoDB field names may not start with "$" or contain "."; npm script names sometimes do. */
function sanitizeKeys(value) {
  if (Array.isArray(value)) return value.map(sanitizeKeys);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k.replace(/^\$/, '＄').replace(/\./g, '．')] = sanitizeKeys(v);
    }
    return out;
  }
  return value;
}

// Most informative categories first so cards show frameworks before runtimes.
const SUMMARY_CATEGORIES = ['Meta-framework', 'Frontend', 'Backend', 'Mobile & Desktop', 'Database', 'Language & Runtime'];

function buildSummary(report) {
  return {
    description: report.repo.description,
    primaryLanguage: report.languages[0]?.name || report.repo.primaryLanguage,
    languages: report.languages.slice(0, 6).map(({ name, percent, color }) => ({ name, percent, color })),
    stack: report.stack.items
      .filter((s) => SUMMARY_CATEGORIES.includes(s.category))
      .sort((a, b) => SUMMARY_CATEGORIES.indexOf(a.category) - SUMMARY_CATEGORIES.indexOf(b.category))
      .map((s) => s.name)
      .slice(0, 8),
    stars: report.repo.stars,
    forks: report.repo.forks,
    totalFiles: report.metrics.totalFiles,
    estimatedLoc: report.metrics.estimatedLoc,
    dependencyCount: report.dependencies.totals.unique,
    endpointCount: report.endpoints.total,
    healthScore: report.insights.healthScore,
    grade: report.insights.grade,
    projectType: report.project.type,
    ownerAvatarUrl: report.repo.ownerAvatarUrl,
  };
}

/** Runs the analysis and upserts the shared repository + the user's analysis document. */
async function runAndSave(userId, owner, repo) {
  const lockKey = `${userId}:${owner}/${repo}`.toLowerCase();
  if (inFlight.has(lockKey)) {
    throw AppError.conflict('This repository is already being analyzed. Hang tight!');
  }
  inFlight.add(lockKey);
  try {
    const report = await analyzeRepository(owner, repo);
    const repoKey = report.repo.fullName.toLowerCase();

    const repository = await Repository.findOneAndUpdate(
      { fullName: repoKey },
      {
        $set: {
          githubId: report.repo.githubId,
          owner: report.repo.owner,
          name: report.repo.name,
          description: report.repo.description,
          url: report.repo.url,
          homepage: report.repo.homepage,
          defaultBranch: report.repo.defaultBranch,
          stars: report.repo.stars,
          forks: report.repo.forks,
          watchers: report.repo.watchers,
          openIssues: report.repo.openIssues,
          license: report.repo.license,
          topics: report.repo.topics,
          primaryLanguage: report.repo.primaryLanguage,
          ownerAvatarUrl: report.repo.ownerAvatarUrl,
          archived: report.repo.archived,
          pushedAt: report.repo.pushedAt,
          lastAnalyzedAt: new Date(),
        },
        $inc: { analysisCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const existing = await Analysis.findOne({ user: userId, repoKey }).select('summary runCount');
    const update = {
      user: userId,
      repository: repository._id,
      fullName: report.repo.fullName,
      repoKey,
      summary: buildSummary(report),
      previousSummary: existing ? existing.summary : null,
      report: sanitizeKeys(report),
      runCount: (existing?.runCount || 0) + 1,
      durationMs: report.meta.durationMs,
      analyzedAt: new Date(),
    };

    return await Analysis.findOneAndUpdate({ user: userId, repoKey }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  } finally {
    inFlight.delete(lockKey);
  }
}

async function findOwned(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw AppError.notFound('Analysis not found');
  const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw AppError.notFound('Analysis not found');
  return analysis;
}

const toListItem = (a) => ({
  id: a._id.toString(),
  fullName: a.fullName,
  summary: a.summary,
  previousSummary: a.previousSummary,
  runCount: a.runCount,
  durationMs: a.durationMs,
  analyzedAt: a.analyzedAt,
  createdAt: a.createdAt,
});

const toDetail = (a) => ({ ...toListItem(a), report: a.report });

// ───────────────────────── handlers ─────────────────────────

export async function create(req, res) {
  const parsed = parseRepoUrl(req.body.url);
  if (!parsed) {
    throw AppError.badRequest('Enter a valid GitHub repository URL, e.g. https://github.com/owner/repo', {
      fields: { url: 'Enter a valid GitHub repository URL' },
    });
  }
  const analysis = await runAndSave(req.user._id, parsed.owner, parsed.repo);
  res.status(201).json({ analysis: toDetail(analysis) });
}

export async function list(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const sortKey = { recent: { analyzedAt: -1 }, oldest: { analyzedAt: 1 }, name: { repoKey: 1 }, health: { 'summary.healthScore': -1 }, stars: { 'summary.stars': -1 } }[req.query.sort] || { analyzedAt: -1 };

  const filter = { user: req.user._id };
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { repoKey: { $regex: escaped, $options: 'i' } },
      { 'summary.description': { $regex: escaped, $options: 'i' } },
      { 'summary.primaryLanguage': { $regex: `^${escaped}`, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Analysis.find(filter).select('-report').sort(sortKey).skip((page - 1) * limit).limit(limit),
    Analysis.countDocuments(filter),
  ]);

  res.json({
    items: items.map(toListItem),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
}

export async function getOne(req, res) {
  const analysis = await findOwned(req);
  res.json({ analysis: toDetail(analysis) });
}

export async function reanalyze(req, res) {
  const existing = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).select('fullName');
  if (!existing) throw AppError.notFound('Analysis not found');
  const [owner, repo] = existing.fullName.split('/');
  const analysis = await runAndSave(req.user._id, owner, repo);
  res.json({ analysis: toDetail(analysis) });
}

export async function remove(req, res) {
  const analysis = await findOwned(req);
  await analysis.deleteOne();
  res.status(204).end();
}

export async function clearAll(req, res) {
  const { deletedCount } = await Analysis.deleteMany({ user: req.user._id });
  res.json({ deleted: deletedCount });
}

export async function stats(req, res) {
  const userId = req.user._id;
  const items = await Analysis.find({ user: userId }).select('-report -previousSummary').sort({ analyzedAt: -1 }).lean();

  const languageTotals = new Map();
  const stackTotals = new Map();
  const typeTotals = new Map();
  let healthSum = 0;
  let endpoints = 0;
  let files = 0;
  for (const a of items) {
    healthSum += a.summary?.healthScore || 0;
    endpoints += a.summary?.endpointCount || 0;
    files += a.summary?.totalFiles || 0;
    const primary = a.summary?.languages?.[0];
    if (primary) {
      const cur = languageTotals.get(primary.name) || { name: primary.name, color: primary.color, count: 0 };
      cur.count++;
      languageTotals.set(primary.name, cur);
    }
    for (const s of a.summary?.stack || []) stackTotals.set(s, (stackTotals.get(s) || 0) + 1);
    const t = a.summary?.projectType || 'Codebase';
    typeTotals.set(t, (typeTotals.get(t) || 0) + 1);
  }

  res.json({
    totals: {
      repositories: items.length,
      runs: items.reduce((s, a) => s + (a.runCount || 1), 0),
      avgHealth: items.length ? Math.round(healthSum / items.length) : 0,
      endpoints,
      files,
    },
    languages: [...languageTotals.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    technologies: [...stackTotals.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12),
    projectTypes: [...typeTotals.entries()].map(([name, count]) => ({ name, count })),
    recent: items.slice(0, 5).map((a) => toListItem({ ...a, _id: a._id })),
  });
}
