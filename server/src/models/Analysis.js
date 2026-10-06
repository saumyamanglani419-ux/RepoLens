import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema(
  {
    description: { type: String, default: '' },
    primaryLanguage: { type: String, default: null },
    languages: [{ name: String, percent: Number, color: String, _id: false }],
    stack: { type: [String], default: [] },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    totalFiles: { type: Number, default: 0 },
    estimatedLoc: { type: Number, default: 0 },
    dependencyCount: { type: Number, default: 0 },
    endpointCount: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    grade: { type: String, default: 'F' },
    projectType: { type: String, default: 'Codebase' },
    ownerAvatarUrl: { type: String, default: '' },
  },
  { _id: false },
);

/**
 * A user's analysis of one repository. There is at most one per (user, repository):
 * re-analyzing refreshes the report and keeps the previous summary for comparison.
 * Lightweight `summary` fields power history lists; the full report lives in `report`.
 */
const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repository: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
    fullName: { type: String, required: true },
    repoKey: { type: String, required: true, lowercase: true },
    summary: { type: summarySchema, default: () => ({}) },
    previousSummary: { type: summarySchema, default: null },
    report: { type: mongoose.Schema.Types.Mixed, required: true },
    runCount: { type: Number, default: 1 },
    durationMs: { type: Number, default: 0 },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, minimize: false },
);

analysisSchema.index({ user: 1, repoKey: 1 }, { unique: true });
analysisSchema.index({ user: 1, analyzedAt: -1 });

export const Analysis = mongoose.model('Analysis', analysisSchema);
