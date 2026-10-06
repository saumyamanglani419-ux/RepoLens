import { parse as parseToml } from 'smol-toml';
import YAML from 'yaml';
import { basename } from './files.js';

/**
 * Dependency manifests RepoLens understands.
 * `match` is tested against the file's basename.
 */
export const MANIFESTS = [
  { ecosystem: 'npm', label: 'npm', match: (n) => n === 'package.json', parse: parsePackageJson },
  { ecosystem: 'pypi', label: 'PyPI', match: (n) => /^requirements([-_.][\w-]+)?\.txt$/i.test(n), parse: parseRequirements },
  { ecosystem: 'pypi', label: 'PyPI', match: (n) => n === 'pyproject.toml', parse: parsePyproject },
  { ecosystem: 'pypi', label: 'PyPI', match: (n) => n === 'Pipfile', parse: parsePipfile },
  { ecosystem: 'go', label: 'Go modules', match: (n) => n === 'go.mod', parse: parseGoMod },
  { ecosystem: 'cargo', label: 'Cargo', match: (n) => n === 'Cargo.toml', parse: parseCargo },
  { ecosystem: 'composer', label: 'Composer', match: (n) => n === 'composer.json', parse: parseComposer },
  { ecosystem: 'rubygems', label: 'RubyGems', match: (n) => n === 'Gemfile', parse: parseGemfile },
  { ecosystem: 'maven', label: 'Maven', match: (n) => n === 'pom.xml', parse: parsePom },
  { ecosystem: 'gradle', label: 'Gradle', match: (n) => /^build\.gradle(\.kts)?$/.test(n), parse: parseGradle },
  { ecosystem: 'pub', label: 'Pub (Dart)', match: (n) => n === 'pubspec.yaml', parse: parsePubspec },
];

export const findManifest = (path) => MANIFESTS.find((m) => m.match(basename(path)));

const dep = (name, version = '*') => ({ name: String(name).trim(), version: String(version ?? '*').trim() || '*' });

function fromObject(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([name, v]) => {
    if (v && typeof v === 'object') return dep(name, v.version ?? (v.path ? 'local' : v.git ? 'git' : '*'));
    return dep(name, v);
  });
}

// ───────────────────────── parsers ─────────────────────────
// Each returns { production: Dep[], development: Dep[], meta?: object }

export function parsePackageJson(text) {
  const pkg = JSON.parse(text);
  return {
    production: [...fromObject(pkg.dependencies), ...fromObject(pkg.peerDependencies)],
    development: fromObject(pkg.devDependencies),
    meta: {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      scripts: pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {},
      workspaces: Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages || [],
      main: pkg.main || pkg.module || (typeof pkg.exports === 'string' ? pkg.exports : undefined),
      bin: pkg.bin,
      engines: pkg.engines,
      private: Boolean(pkg.private),
      packageManager: pkg.packageManager,
    },
  };
}

export function parseRequirements(text) {
  const production = [];
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#') || line.startsWith('-') || /^(git\+|https?:)/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)(\[[^\]]*\])?\s*([<>=!~^].*)?$/);
    if (m) production.push(dep(m[1], (m[3] || '*').split(';')[0]));
  }
  return { production, development: [] };
}

/** "requests>=2.0; python_version<'3.8'" → { name, version } */
function pep508(spec) {
  const m = String(spec).match(/^\s*([A-Za-z0-9][A-Za-z0-9._-]*)(\[[^\]]*\])?\s*(.*)$/);
  if (!m) return null;
  return dep(m[1], m[3].split(';')[0].trim().replace(/^\(|\)$/g, '') || '*');
}

export function parsePyproject(text) {
  const doc = parseToml(text);
  const production = [];
  const development = [];
  const project = doc.project || {};
  (project.dependencies || []).map(pep508).filter(Boolean).forEach((d) => production.push(d));
  for (const [group, list] of Object.entries(project['optional-dependencies'] || {})) {
    const target = /dev|test|lint|doc/i.test(group) ? development : production;
    (list || []).map(pep508).filter(Boolean).forEach((d) => target.push(d));
  }
  for (const [group, list] of Object.entries(doc['dependency-groups'] || {})) {
    (list || []).filter((x) => typeof x === 'string').map(pep508).filter(Boolean).forEach((d) => development.push(d));
  }
  const poetry = doc.tool?.poetry || {};
  fromObject(poetry.dependencies).filter((d) => d.name.toLowerCase() !== 'python').forEach((d) => production.push(d));
  fromObject(poetry['dev-dependencies']).forEach((d) => development.push(d));
  for (const g of Object.values(poetry.group || {})) fromObject(g.dependencies).forEach((d) => development.push(d));
  return {
    production,
    development,
    meta: { name: project.name || poetry.name, scripts: project.scripts || poetry.scripts || {} },
  };
}

export function parsePipfile(text) {
  const doc = parseToml(text);
  return { production: fromObject(doc.packages), development: fromObject(doc['dev-packages']) };
}

export function parseGoMod(text) {
  const production = [];
  const indirect = [];
  const add = (line) => {
    const m = line.trim().match(/^([^\s]+)\s+(v[^\s]+)(.*)$/);
    if (!m) return;
    (m[3].includes('// indirect') ? indirect : production).push(dep(m[1], m[2]));
  };
  const block = text.matchAll(/^require\s*\(([\s\S]*?)^\)/gm);
  for (const b of block) b[1].split('\n').forEach(add);
  for (const m of text.matchAll(/^require\s+([^\s(][^\n]*)$/gm)) add(m[1]);
  const moduleName = text.match(/^module\s+(\S+)/m)?.[1];
  const goVersion = text.match(/^go\s+(\S+)/m)?.[1];
  return { production, development: indirect, meta: { name: moduleName, goVersion } };
}

export function parseCargo(text) {
  const doc = parseToml(text);
  return {
    production: fromObject(doc.dependencies),
    development: [...fromObject(doc['dev-dependencies']), ...fromObject(doc['build-dependencies'])],
    meta: { name: doc.package?.name, workspace: Boolean(doc.workspace) },
  };
}

export function parseComposer(text) {
  const doc = JSON.parse(text);
  const notPlatform = (d) => d.name !== 'php' && !d.name.startsWith('ext-');
  return {
    production: fromObject(doc.require).filter(notPlatform),
    development: fromObject(doc['require-dev']).filter(notPlatform),
    meta: { name: doc.name },
  };
}

export function parseGemfile(text) {
  const production = [];
  const development = [];
  let groupDepth = 0;
  let inDevGroup = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^group\b.*\bdo\b/.test(line)) {
      groupDepth++;
      if (/:(development|test)\b/.test(line)) inDevGroup = true;
      continue;
    }
    if (line === 'end' && groupDepth > 0) {
      groupDepth--;
      if (groupDepth === 0) inDevGroup = false;
      continue;
    }
    const m = line.match(/^gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
    if (m) (inDevGroup || /group:\s*:?\[?:?(development|test)/.test(line) ? development : production).push(dep(m[1], m[2]));
  }
  return { production, development };
}

export function parsePom(text) {
  const production = [];
  const development = [];
  const body = text.replace(/<dependencyManagement>[\s\S]*?<\/dependencyManagement>/g, '');
  for (const m of body.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g)) {
    const get = (tag) => m[1].match(new RegExp(`<${tag}>\\s*([^<]+?)\\s*</${tag}>`))?.[1];
    const groupId = get('groupId');
    const artifactId = get('artifactId');
    if (!artifactId) continue;
    const d = dep(groupId ? `${groupId}:${artifactId}` : artifactId, get('version') || 'managed');
    (get('scope') === 'test' ? development : production).push(d);
  }
  return { production, development, meta: { name: text.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1] } };
}

export function parseGradle(text) {
  const production = [];
  const development = [];
  const re = /\b(implementation|api|compileOnly|runtimeOnly|kapt|ksp|annotationProcessor|testImplementation|testRuntimeOnly|androidTestImplementation|debugImplementation)\s*\(?\s*["']([^"':]+):([^"':]+)(?::([^"']+))?["']/g;
  for (const m of text.matchAll(re)) {
    const d = dep(`${m[2]}:${m[3]}`, m[4] || '*');
    (/test|debug/i.test(m[1]) ? development : production).push(d);
  }
  return { production, development };
}

export function parsePubspec(text) {
  const doc = YAML.parse(text) || {};
  const norm = (o) =>
    fromObject(o).map((d) => (o[d.name]?.sdk ? { ...d, version: `sdk:${o[d.name].sdk}` } : d));
  return {
    production: norm(doc.dependencies || {}),
    development: norm(doc.dev_dependencies || {}),
    meta: { name: doc.name },
  };
}

// ───────────────────────── aggregate ─────────────────────────

function dedupe(list) {
  const seen = new Map();
  for (const d of list) if (d.name && !seen.has(d.name)) seen.set(d.name, d);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {Array<{path:string, content:string}>} manifestFiles
 */
export function analyzeDependencies(manifestFiles) {
  const manifests = [];
  const errors = [];

  for (const file of manifestFiles) {
    const def = findManifest(file.path);
    if (!def || file.content == null) continue;
    try {
      const parsed = def.parse(file.content);
      manifests.push({
        path: file.path,
        ecosystem: def.ecosystem,
        label: def.label,
        production: dedupe(parsed.production),
        development: dedupe(parsed.development).filter(
          (d) => !parsed.production.some((p) => p.name === d.name),
        ),
        meta: parsed.meta || {},
      });
    } catch (err) {
      errors.push({ path: file.path, message: `Could not parse: ${err.message.slice(0, 120)}` });
    }
  }

  manifests.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));

  // Unique dependency names per ecosystem across all manifests.
  const unique = new Map();
  for (const m of manifests) {
    for (const d of m.production) unique.set(`${m.ecosystem}:${d.name}`, 'production');
    for (const d of m.development) {
      if (!unique.has(`${m.ecosystem}:${d.name}`)) unique.set(`${m.ecosystem}:${d.name}`, 'development');
    }
  }
  const values = [...unique.values()];

  const ecosystems = [...new Set(manifests.map((m) => m.label))];

  return {
    manifests,
    errors,
    ecosystems,
    totals: {
      manifests: manifests.length,
      unique: unique.size,
      production: values.filter((v) => v === 'production').length,
      development: values.filter((v) => v === 'development').length,
    },
  };
}

/** Flat set of lower-cased dependency names per ecosystem, used by the stack detector. */
export function dependencyIndex(depAnalysis) {
  const index = {};
  for (const m of depAnalysis.manifests) {
    const set = (index[m.ecosystem] ||= new Map());
    for (const d of [...m.production, ...m.development]) {
      const key = d.name.toLowerCase();
      if (!set.has(key)) set.set(key, m.path);
    }
  }
  return index;
}
