import mongoose from 'mongoose';

/**
 * Shared, user-independent GitHub repository metadata.
 * Updated every time any user analyzes the repository.
 */
const repositorySchema = new mongoose.Schema(
  {
    githubId: { type: Number, index: true },
    fullName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    homepage: { type: String, default: '' },
    defaultBranch: { type: String, default: 'main' },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    watchers: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    license: { type: String, default: null },
    topics: { type: [String], default: [] },
    primaryLanguage: { type: String, default: null },
    ownerAvatarUrl: { type: String, default: '' },
    archived: { type: Boolean, default: false },
    pushedAt: { type: Date },
    analysisCount: { type: Number, default: 0 },
    lastAnalyzedAt: { type: Date },
  },
  { timestamps: true },
);

export const Repository = mongoose.model('Repository', repositorySchema);
