/** Path classification helpers shared by the analysis modules. */

export const basename = (p) => p.slice(p.lastIndexOf('/') + 1);
export const dirname = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
export const depthOf = (p) => p.split('/').length;

export function extOf(p) {
  const base = basename(p);
  if (base.startsWith('.') && base.indexOf('.', 1) === -1) return ''; // dotfiles like .gitignore
  const i = base.lastIndexOf('.');
  return i > 0 ? base.slice(i + 1).toLowerCase() : '';
}

/** Directories that are third-party, generated or build output. */
const VENDORED_SEGMENTS = new Set([
  'node_modules', 'vendor', 'bower_components', 'dist', 'build', 'out', '.next', '.nuxt',
  'coverage', '__pycache__', '.venv', 'venv', 'site-packages', 'target', 'Pods',
  '.gradle', '.cache', 'third_party', 'thirdparty', '.yarn',
]);

export function isVendored(path) {
  return path.split('/').some((seg) => VENDORED_SEGMENTS.has(seg)) || /\.min\.(js|css)$/.test(path);
}

export function isTestFile(path) {
  const p = path.toLowerCase();
  return (
    /(^|\/)(__tests__|tests?|spec|specs|e2e|cypress|testing)\//.test(p) ||
    /\.(test|spec|e2e|cy)\.[a-z0-9]+$/.test(p) ||
    /(^|\/)test_[^/]+\.py$/.test(p) ||
    /_test\.(go|py|rb|exs?)$/.test(p) ||
    /(Test|Tests|IT)\.(java|kt|cs)$/.test(path)
  );
}

export const DOC_EXTS = new Set(['md', 'mdx', 'rst', 'txt', 'adoc']);
export const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif']);

/** Extension → language name, used for files GitHub's language API does not break down. */
export const SOURCE_EXTS = {
  js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JavaScript',
  ts: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript', tsx: 'TypeScript',
  py: 'Python', ipynb: 'Jupyter Notebook', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin',
  kts: 'Kotlin', scala: 'Scala', rb: 'Ruby', php: 'PHP', cs: 'C#', fs: 'F#', vb: 'Visual Basic',
  c: 'C', h: 'C', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++', m: 'Objective-C', mm: 'Objective-C',
  swift: 'Swift', dart: 'Dart', ex: 'Elixir', exs: 'Elixir', erl: 'Erlang', hs: 'Haskell',
  clj: 'Clojure', lua: 'Lua', r: 'R', jl: 'Julia', pl: 'Perl', sh: 'Shell', bash: 'Shell',
  zsh: 'Shell', ps1: 'PowerShell', vue: 'Vue', svelte: 'Svelte', astro: 'Astro', html: 'HTML',
  css: 'CSS', scss: 'SCSS', sass: 'Sass', less: 'Less', sql: 'SQL', zig: 'Zig', nim: 'Nim',
  sol: 'Solidity', tf: 'HCL', groovy: 'Groovy', elm: 'Elm', ml: 'OCaml', graphql: 'GraphQL',
  prisma: 'Prisma', proto: 'Protocol Buffers',
};

export const isSourceFile = (path) => Boolean(SOURCE_EXTS[extOf(path)]);

/** Colors that match GitHub's linguist palette for the most common languages. */
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219', Go: '#00ADD8',
  Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95', 'C#': '#178600', C: '#555555', 'C++': '#f34b7d',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26', CSS: '#663399',
  SCSS: '#c6538c', Shell: '#89e051', Vue: '#41b883', Svelte: '#ff3e00', 'Jupyter Notebook': '#DA5B0B',
  Elixir: '#6e4a7e', Scala: '#c22d40', Haskell: '#5e5086', Lua: '#000080', R: '#198CE7',
  'Objective-C': '#438eff', Dockerfile: '#384d54', Makefile: '#427819', Astro: '#ff5a03',
  MDX: '#fcb32c', Less: '#1d365d', Clojure: '#db5855', Perl: '#0298c3', PowerShell: '#012456',
  HCL: '#844FBA', Nix: '#7e7eff', Zig: '#ec915c', Solidity: '#AA6746', Julia: '#a270ba',
  'Vim Script': '#199f4b', Groovy: '#4298b8', Erlang: '#B83998', OCaml: '#ef7a08', Elm: '#60B5CC',
  TSQL: '#e38c00', PLpgSQL: '#336790', Batchfile: '#C1F12E', CMake: '#DA3434', Assembly: '#6E4C13',
};

const FALLBACK_COLORS = ['#94a3b8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb7185'];

export function languageColor(name, index = 0) {
  return LANGUAGE_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
