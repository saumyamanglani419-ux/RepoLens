
const DAY = 864e5;

// ───────────────────────── project classification ─────────────────────────

export function classifyProject({ stack, deps, endpoints, paths, languages }) {
  const names = new Set(stack.items.map((s) => s.name));
  const cats = new Set(stack.items.map((s) => s.category));
  const has = (...n) => n.some((x) => names.has(x));

  const workspaceGlobs = deps.manifests.flatMap((m) => m.meta?.workspaces || []);
  const manifestDirs = new Set(deps.manifests.map((m) => m.path.split('/').slice(0, -1).join('/')));
  const isMonorepo =
    workspaceGlobs.length > 0 ||
    has('Turborepo', 'Nx', 'Lerna', 'pnpm workspaces') ||
    deps.manifests.some((m) => m.meta?.workspace) ||
    manifestDirs.size >= 4;

  const hasFrontend = cats.has('Frontend') || cats.has('Meta-framework');
  const hasBackend = cats.has('Backend') || (endpoints.total > 0 && !has('Next.js', 'SvelteKit', 'Nuxt', 'Remix'));
  const notebookShare = languages.find((l) => l.name === 'Jupyter Notebook')?.percent || 0;

  const root = deps.manifests.find((m) => m.path === 'package.json');
  const cliDeps = ['commander', 'yargs', 'oclif', 'cac', 'meow', 'clipanion', 'github.com/spf13/cobra', 'click', 'typer', 'clap'];
  const allDepNames = new Set(deps.manifests.flatMap((m) => m.production.map((d) => d.name.toLowerCase())));
  const isCli = Boolean(root?.meta?.bin) || cliDeps.some((d) => allDepNames.has(d)) || paths.some((p) => /^cmd\/[^/]+\/main\.go$/.test(p));

  let type = 'Codebase';
  if (has('React Native', 'Flutter', 'Expo', 'Android', 'iOS / Xcode')) type = 'Mobile app';
  else if (has('Electron', 'Tauri')) type = 'Desktop app';
  else if (has('Next.js', 'Nuxt', 'SvelteKit', 'Remix') && (endpoints.total > 0 || cats.has('Database'))) type = 'Full-stack web app';
  else if (hasFrontend && hasBackend) type = 'Full-stack web app';
  else if (hasBackend) type = 'Backend / API service';
  else if (hasFrontend) type = 'Frontend web app';
  else if (notebookShare > 30 || (cats.has('Data & ML') && !hasFrontend)) type = 'Data science / ML';
  else if (isCli) type = 'CLI tool';
  else if (
    (root && !root.meta?.private && root.meta?.main) ||
    deps.manifests.some((m) => ['cargo', 'pypi', 'composer', 'go', 'rubygems'].includes(m.ecosystem))
  ) {
    type = 'Library / package';
  } else if (has('Docusaurus', 'MkDocs', 'VitePress', 'Sphinx')) {
    type = 'Documentation site';
  }

  return { type, isMonorepo, workspaces: workspaceGlobs, packageCount: deps.manifests.length };
}

// ───────────────────────── entry points & scripts ─────────────────────────

const ENTRY_PATTERNS = [
  /^(src\/)?(index|main|app|server)\.(js|mjs|cjs|ts|tsx|jsx)$/,
  /^(server|backend|api|client|frontend)\/(src\/)?(index|main|app|server)\.(js|mjs|ts|tsx|jsx)$/,
  /^src\/(App|main)\.(tsx|jsx|vue|svelte)$/,
  /^(app|main|manage|wsgi|asgi|run|server)\.py$/,
  /^[\w-]+\/(main|app|wsgi|asgi|__main__)\.py$/,
  /^main\.go$/,
  /^cmd\/[^/]+\/main\.go$/,
  /^src\/(main|lib)\.rs$/,
  /^(src\/)?Program\.cs$/,
  /Application\.(java|kt)$/,
  /^lib\/main\.dart$/,
  /^config\.ru$/,
  /^artisan$/,
  /^(public\/)?index\.(php|html)$/,
];

export function findEntryPoints(paths, deps) {
  const results = [];
  const root = deps.manifests.find((m) => m.path === 'package.json');
  if (root?.meta?.main) results.push({ path: root.meta.main.replace(/^\.\//, ''), reason: 'package.json "main"' });
  if (root?.meta?.bin) {
    const bins = typeof root.meta.bin === 'string' ? { [root.meta.name || 'cli']: root.meta.bin } : root.meta.bin;
    for (const [name, p] of Object.entries(bins).slice(0, 3)) results.push({ path: String(p).replace(/^\.\//, ''), reason: `CLI command "${name}"` });
  }
  for (const p of paths) {
    if (results.length >= 10) break;
    if (ENTRY_PATTERNS.some((re) => re.test(p)) && !results.some((r) => r.path === p)) {
      results.push({ path: p, reason: 'Conventional entry file' });
    }
  }
  return results;
}

export function collectScripts(deps, makefile, procfile) {
  const scripts = [];
  const root = deps.manifests.find((m) => m.path === 'package.json');
  for (const [name, command] of Object.entries(root?.meta?.scripts || {}).slice(0, 25)) {
    if (typeof command === 'string') scripts.push({ name, command, source: 'package.json' });
  }
  const py = deps.manifests.find((m) => m.path === 'pyproject.toml');
  for (const [name, command] of Object.entries(py?.meta?.scripts || {}).slice(0, 10)) {
    if (typeof command === 'string') scripts.push({ name, command, source: 'pyproject.toml' });
  }
  if (makefile) {
    for (const m of makefile.matchAll(/^([A-Za-z0-9][\w.-]*)\s*:(?!=)/gm)) {
      if (scripts.filter((s) => s.source === 'Makefile').length >= 15) break;
      if (!scripts.some((s) => s.source === 'Makefile' && s.name === m[1])) {
        scripts.push({ name: m[1], command: `make ${m[1]}`, source: 'Makefile' });
      }
    }
  }
  if (procfile) {
    for (const m of procfile.matchAll(/^(\w+):\s*(.+)$/gm)) scripts.push({ name: m[1], command: m[2].trim(), source: 'Procfile' });
  }
  return scripts;
}

// ───────────────────────── README ─────────────────────────

export function analyzeReadme(path, text) {
  if (!text) return { exists: Boolean(path), path: path || null };
  const lines = text.split(/\r?\n/);
  const headings = [];
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*#*$/);
    if (m) headings.push({ level: m[1].length, text: m[2].replace(/[*_`]|<[^>]+>|!\[[^\]]*\]\([^)]*\)/g, '').trim() });
  }
  const badges = (text.match(/!\[[^\]]*\]\([^)]*(shields\.io|badge|badgen|travis|circleci|codecov)[^)]*\)/gi) || []).length;
  const plain = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  const wordCount = (plain.match(/[A-Za-z0-9]+/g) || []).length;

  // First real paragraph: not a heading, badge line, html, or table.
  let excerpt = '';
  for (const block of plain.split(/\n\s*\n/)) {
    const t = block.replace(/^#+.*$/gm, '').replace(/[*_`>|]/g, '').replace(/\s+/g, ' ').trim();
    if (t.length > 60 && /[a-z]/.test(t) && !/^[-=\s]+$/.test(t)) {
      excerpt = t.length > 360 ? `${t.slice(0, 357).trim()}…` : t;
      break;
    }
  }
  const has = (re) => headings.some((h) => re.test(h.text));
  return {
    exists: true,
    path,
    wordCount,
    badges,
    excerpt,
    headings: headings.slice(0, 16),
    sections: {
      installation: has(/install|getting started|setup|quick ?start/i),
      usage: has(/usage|example|how to|getting started/i),
      contributing: has(/contribut/i),
      license: has(/licen[sc]e/i),
    },
  };
}

// ───────────────────────── health & insights ─────────────────────────

export function buildInsights({ repo, paths, stack, deps, endpoints, metrics, configFiles, readme, languages, project }) {
  const names = new Set(stack.items.map((s) => s.name));
  const lowerPaths = paths.map((p) => p.toLowerCase());
  const rootHas = (re) => lowerPaths.some((p) => !p.includes('/') && re.test(p));
  const anyHas = (re) => lowerPaths.some((p) => re.test(p));
  const pushedDaysAgo = repo.pushedAt ? Math.floor((Date.now() - new Date(repo.pushedAt).getTime()) / DAY) : null;

  const typedLanguages = ['TypeScript', 'Go', 'Rust', 'Java', 'Kotlin', 'C#', 'Swift', 'Dart', 'Scala', 'Haskell', 'C++', 'C'];
  const primaryTyped = languages.slice(0, 2).some((l) => typedLanguages.includes(l.name));
  const needsLockfile = deps.manifests.some((m) => ['npm', 'pypi', 'cargo', 'composer', 'rubygems', 'go'].includes(m.ecosystem));
  const hasLockfile = configFiles.files.some((f) => f.category === 'Lockfile');
  const committedEnv = paths.filter(
    (p) => /(^|\/)\.env(\.local|\.development|\.production)?$/.test(p) && !/(^|\/)(fixtures?|__fixtures__|testdata)\//.test(p),
  );

  const checks = [
    { id: 'readme', label: 'README', weight: 12, passed: readme.exists, detail: readme.exists ? `${readme.wordCount ?? 0} words` : 'No README found at the repository root' },
    { id: 'license', label: 'License', weight: 10, passed: Boolean(repo.license) || rootHas(/^(licen[sc]e|copying)(\.|$)/), detail: repo.license || 'No license: others cannot legally reuse the code' },
    { id: 'tests', label: 'Automated tests', weight: 14, passed: metrics.testFiles > 0, detail: metrics.testFiles ? `${metrics.testFiles} test file${metrics.testFiles === 1 ? '' : 's'}` : 'No test files detected' },
    { id: 'ci', label: 'Continuous integration', weight: 10, passed: stack.items.some((s) => ['GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI', 'Jenkins'].includes(s.name)), detail: 'CI pipeline configuration' },
    { id: 'lint', label: 'Linting / formatting', weight: 8, passed: stack.items.some((s) => s.category === 'Code quality'), detail: 'Linter or formatter configuration' },
    { id: 'types', label: 'Static typing', weight: 6, passed: names.has('TypeScript') || names.has('mypy') || primaryTyped, detail: 'TypeScript, a typed language, or a type checker' },
    { id: 'lockfile', label: 'Dependency lockfile', weight: 6, passed: !needsLockfile || hasLockfile, detail: needsLockfile ? (hasLockfile ? 'Reproducible installs' : 'No lockfile committed') : 'Not applicable' },
    { id: 'secrets', label: 'No committed .env files', weight: 8, passed: committedEnv.length === 0, detail: committedEnv.length ? `Found ${committedEnv.slice(0, 3).join(', ')}` : 'No environment files committed' },
    { id: 'gitignore', label: '.gitignore', weight: 5, passed: rootHas(/^\.gitignore$/), detail: 'Keeps build output and secrets out of Git' },
    { id: 'activity', label: 'Recently active', weight: 8, passed: pushedDaysAgo !== null && pushedDaysAgo <= 180 && !repo.archived, detail: repo.archived ? 'Repository is archived' : pushedDaysAgo !== null ? `Last push ${pushedDaysAgo} days ago` : 'Unknown' },
    { id: 'description', label: 'Description', weight: 4, passed: Boolean(repo.description), detail: 'Short GitHub description' },
    { id: 'contributing', label: 'Contributing guide', weight: 4, passed: anyHas(/(^|\/)contributing(\.md|\.rst|\.txt)?$/), detail: 'CONTRIBUTING guide for new contributors' },
    { id: 'automation', label: 'Dependency updates', weight: 3, passed: names.has('Dependabot') || names.has('Renovate'), detail: 'Dependabot or Renovate configured' },
    { id: 'topics', label: 'Topics', weight: 2, passed: repo.topics.length > 0, detail: 'GitHub topics improve discoverability' },
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';

  const highlights = [];
  const top = languages[0];
  if (top) highlights.push(`${top.name} makes up ${top.percent}% of the codebase${languages.length > 1 ? ` across ${languages.length} languages` : ''}.`);
  const frameworks = stack.items.filter((s) => ['Frontend', 'Meta-framework', 'Backend', 'Mobile & Desktop'].includes(s.category)).map((s) => s.name);
  if (frameworks.length) highlights.push(`Built with ${listify(frameworks.slice(0, 4))}.`);
  if (project.isMonorepo) highlights.push(`Monorepo with ${project.packageCount} package manifests.`);
  if (endpoints.total) highlights.push(`${endpoints.total} HTTP endpoint${endpoints.total === 1 ? '' : 's'} detected (${listify(endpoints.frameworks)}).`);
  if (deps.totals.unique) highlights.push(`${deps.totals.unique} unique dependencies across ${listify(deps.ecosystems)}.`);
  const dbs = stack.items.filter((s) => s.category === 'Database').map((s) => s.name);
  if (dbs.length) highlights.push(`Persists data with ${listify(dbs)}.`);
  if (metrics.testFiles) highlights.push(`${metrics.testFiles} test file${metrics.testFiles === 1 ? '' : 's'} (${Math.round(metrics.testToSourceRatio * 100)} per 100 source files).`);
  if (pushedDaysAgo !== null && pushedDaysAgo <= 30) highlights.push(`Actively maintained: last push ${pushedDaysAgo === 0 ? 'today' : `${pushedDaysAgo} day${pushedDaysAgo === 1 ? '' : 's'} ago`}.`);

  const warnings = [];
  if (repo.archived) warnings.push({ level: 'warning', message: 'This repository is archived and read-only.' });
  if (committedEnv.length) warnings.push({ level: 'danger', message: `Environment file committed (${committedEnv[0]}). It may contain secrets.` });
  if (!readme.exists) warnings.push({ level: 'warning', message: 'No README: newcomers have no starting point.' });
  if (!checks.find((c) => c.id === 'license').passed) warnings.push({ level: 'warning', message: 'No license detected.' });
  if (!metrics.testFiles) warnings.push({ level: 'info', message: 'No automated tests were found.' });
  if (paths.some((p) => /^node_modules\//.test(p) || /\/node_modules\//.test(p))) warnings.push({ level: 'warning', message: 'node_modules is committed to the repository.' });
  if (metrics.largeFiles) warnings.push({ level: 'info', message: `${metrics.largeFiles} file${metrics.largeFiles === 1 ? '' : 's'} larger than 1 MB committed.` });
  if (pushedDaysAgo !== null && pushedDaysAgo > 365 && !repo.archived) warnings.push({ level: 'info', message: `No pushes in ${Math.floor(pushedDaysAgo / 30)} months.` });
  if (needsLockfile && !hasLockfile) warnings.push({ level: 'info', message: 'No dependency lockfile committed.' });
  for (const e of deps.errors) warnings.push({ level: 'info', message: `${e.path}: ${e.message}` });

  return { healthScore: score, grade, checks, highlights, warnings };
}

function listify(items) {
  const list = [...new Set(items)];
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

