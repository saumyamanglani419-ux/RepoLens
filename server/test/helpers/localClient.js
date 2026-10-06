import fs from 'node:fs';
import path from 'node:path';

/**
 * A drop-in replacement for the GitHub client that serves a repository from a
 * local directory. Lets the analysis engine be tested offline and deterministically.
 */
export function createLocalClient(rootDir, overrides = {}) {
  const walk = (dir, prefix = '') => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push({ path: rel, type: 'tree' });
        out.push(...walk(abs, rel));
      } else {
        out.push({ path: rel, type: 'blob', size: fs.statSync(abs).size });
      }
    }
    return out;
  };

  return {
    getRepo: async (owner, repo) => ({
      id: 1,
      name: repo,
      full_name: `${owner}/${repo}`,
      owner: { login: owner, avatar_url: '', type: 'User' },
      description: 'Fixture repository',
      html_url: `https://github.com/${owner}/${repo}`,
      homepage: '',
      default_branch: 'main',
      stargazers_count: 42,
      forks_count: 7,
      subscribers_count: 3,
      open_issues_count: 1,
      license: { spdx_id: 'MIT', name: 'MIT License' },
      topics: ['fixture'],
      language: 'JavaScript',
      private: false,
      fork: false,
      archived: false,
      size: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      pushed_at: new Date().toISOString(),
      ...overrides.repo,
    }),
    getLanguages: async () => overrides.languages ?? {},
    getTree: async () => ({ sha: 'fixture', truncated: false, tree: walk(rootDir) }),
    getContributors: async () => [{ login: 'octocat', avatar_url: '', html_url: 'https://github.com/octocat', contributions: 12 }],
    getRawFile: async (_o, _r, _ref, p) => {
      try {
        return fs.readFileSync(path.join(rootDir, p), 'utf8');
      } catch {
        return null;
      }
    },
  };
}
