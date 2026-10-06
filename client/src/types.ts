export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Language {
  name: string;
  bytes?: number;
  percent: number;
  color: string;
}

export interface RepoInfo {
  githubId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  homepage: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  topics: string[];
  primaryLanguage: string | null;
  ownerAvatarUrl: string;
  ownerType: string;
  isFork: boolean;
  archived: boolean;
  sizeKb: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface StackItem {
  name: string;
  category: string;
  confidence: 'high' | 'medium';
  evidence: string[];
}

export interface Dependency {
  name: string;
  version: string;
}

export interface Manifest {
  path: string;
  ecosystem: string;
  label: string;
  production: Dependency[];
  development: Dependency[];
  meta: Record<string, unknown>;
}

export interface ConfigFile {
  path: string;
  name: string;
  category: string;
  description: string;
}

export interface Endpoint {
  method: string;
  path: string;
  file: string;
  line: number;
  framework: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size: number;
  fileCount?: number;
  truncated?: boolean;
  children?: TreeNode[];
}

export interface TopLevelEntry {
  name: string;
  type: 'dir' | 'file';
  size: number;
  fileCount?: number;
  role: string | null;
}

export interface HealthCheck {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  detail: string;
}

export interface Warning {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

export interface Metrics {
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  avgFileSize: number;
  maxDepth: number;
  deepestPath: string;
  sourceFiles: number;
  testFiles: number;
  docFiles: number;
  imageFiles: number;
  vendoredFiles: number;
  largeFiles: number;
  estimatedLoc: number;
  testToSourceRatio: number;
  commentRatio: number | null;
  sampled: { files: number; lines: number; code: number; blank: number; comment: number; bytes: number };
  filesByExtension: { ext: string; count: number; size: number }[];
  largestFiles: { path: string; size: number }[];
}

export interface Report {
  version: number;
  repo: RepoInfo;
  project: { type: string; isMonorepo: boolean; workspaces: string[]; packageCount: number };
  languages: Language[];
  stack: { items: StackItem[]; categories: { name: string; items: StackItem[] }[] };
  dependencies: {
    manifests: Manifest[];
    errors: { path: string; message: string }[];
    ecosystems: string[];
    totals: { manifests: number; unique: number; production: number; development: number };
  };
  configFiles: { files: ConfigFile[]; total: number; byCategory: Record<string, number> };
  endpoints: {
    endpoints: Endpoint[];
    total: number;
    byMethod: Record<string, number>;
    frameworks: string[];
    filesScanned: number;
    mountsResolved: number;
  };
  structure: { tree: TreeNode; topLevel: TopLevelEntry[]; truncated: boolean };
  metrics: Metrics;
  readme: {
    exists: boolean;
    path: string | null;
    wordCount?: number;
    badges?: number;
    excerpt?: string;
    headings?: { level: number; text: string }[];
    sections?: { installation: boolean; usage: boolean; contributing: boolean; license: boolean };
  };
  insights: { healthScore: number; grade: string; checks: HealthCheck[]; highlights: string[]; warnings: Warning[] };
  contributors: { login: string; avatarUrl: string; url: string; contributions: number }[];
  entryPoints: { path: string; reason: string }[];
  scripts: { name: string; command: string; source: string }[];
  meta: {
    branch: string;
    treeSha: string;
    treeTruncated: boolean;
    filesFetched: number;
    durationMs: number;
    analyzedAt: string;
  };
}

export interface AnalysisSummary {
  description: string;
  primaryLanguage: string | null;
  languages: Language[];
  stack: string[];
  stars: number;
  forks: number;
  totalFiles: number;
  estimatedLoc: number;
  dependencyCount: number;
  endpointCount: number;
  healthScore: number;
  grade: string;
  projectType: string;
  ownerAvatarUrl: string;
}

export interface AnalysisListItem {
  id: string;
  fullName: string;
  summary: AnalysisSummary;
  previousSummary: AnalysisSummary | null;
  runCount: number;
  durationMs: number;
  analyzedAt: string;
  createdAt: string;
}

export interface AnalysisDetail extends AnalysisListItem {
  report: Report;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardStats {
  totals: { repositories: number; runs: number; avgHealth: number; endpoints: number; files: number };
  languages: { name: string; color: string; count: number }[];
  technologies: { name: string; count: number }[];
  projectTypes: { name: string; count: number }[];
  recent: AnalysisListItem[];
}
