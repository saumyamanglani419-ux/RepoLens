import { basename, dirname, extOf, isTestFile, isVendored } from './files.js';

/**
 * Heuristic, regex-based HTTP endpoint discovery for the most common server frameworks.
 * It is intentionally conservative: we only report routes in files that look like server code.
 */

const ROUTE_EXTS = new Set(['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'py', 'go', 'java', 'kt', 'rb', 'php', 'cs']);
const MAX_SOURCE_FILE_SIZE = 200 * 1024;

const ALWAYS = [
  /(^|\/)app\/(.+\/)?route\.(js|ts|mjs)$/, // Next.js app router
  /(^|\/)pages\/api\/.+\.(js|ts)$/, // Next.js pages API
  /(^|\/)\+server\.(js|ts)$/, // SvelteKit
  /(^|\/)config\/routes\.rb$/, // Rails
  /(^|\/)routes\/(api|web)\.php$/, // Laravel
  /(^|\/)urls\.py$/, // Django
  /\.controller\.(ts|js)$/, // NestJS
  /Controller\.(java|kt|cs)$/, // Spring / ASP.NET
];
const HINT_SEGMENTS = /(^|\/)(routes?|routers?|api|apis|controllers?|handlers?|endpoints?|views|resources|server|rest|web|http)(\/|$)/i;
const HINT_BASENAMES = /^(app|server|index|main|routes?|router|api|urls|views|handlers?|endpoints?|controllers?)\.[a-z]+$/i;

/** Picks up to `limit` files most likely to declare HTTP routes. */
export function selectRouteCandidates(blobs, limit = 70) {
  const scored = [];
  for (const b of blobs) {
    const ext = extOf(b.path);
    if (!ROUTE_EXTS.has(ext) || b.path.endsWith('.d.ts')) continue;
    if (isVendored(b.path) || isTestFile(b.path) || (b.size || 0) > MAX_SOURCE_FILE_SIZE) continue;
    if (/(^|\/)(examples?|samples?|fixtures?|docs?|migrations?|scripts?)\//i.test(b.path)) continue;
    let score = 0;
    if (ALWAYS.some((re) => re.test(b.path))) score += 100;
    if (HINT_SEGMENTS.test(dirname(b.path))) score += 50;
    if (HINT_BASENAMES.test(basename(b.path))) score += 30;
    if (/route|controller|handler|endpoint|api/i.test(basename(b.path))) score += 20;
    if (score > 0) scored.push({ path: b.path, score, depth: b.path.split('/').length });
  }
  scored.sort((a, b) => b.score - a.score || a.depth - b.depth);
  return scored.slice(0, limit).map((s) => s.path);
}

// ───────────────────────── helpers ─────────────────────────

const lineAt = (content, index) => {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) if (content.charCodeAt(i) === 10) line++;
  return line;
};

function joinPath(...parts) {
  const joined = parts
    .filter((p) => p !== undefined && p !== null && p !== '')
    .map((p) => String(p).trim())
    .join('/')
    .replace(/\/{2,}/g, '/');
  let out = joined.startsWith('/') ? joined : `/${joined}`;
  if (out.length > 1) out = out.replace(/\/$/, '');
  return out;
}

const looksLikeRoute = (p) => typeof p === 'string' && (p === '' || p.startsWith('/') || p === '*') && !/\s/.test(p) && p.length < 200;

// ───────────────────────── JavaScript / TypeScript ─────────────────────────

const JS_SERVER_HINT =
  /\b(express|Router\s*\(|fastify|new\s+Hono|from\s+['"]hono|koa-router|@koa\/router|restify|polka|@hapi\/hapi|h3|elysia)\b/;
const JS_RECEIVER_BLOCKLIST = new Set([
  'axios', 'http', 'https', 'fetch', 'request', 'superagent', 'client', 'apiClient', '$http', 'cy', 'map',
  'params', 'headers', 'searchParams', 'cookies', 'req', 'res', 'store', 'cache', 'localStorage',
  'sessionStorage', 'redis', 'config', 'env', 'Reflect', 'formData', 'query', 'ky', 'got', 'instance',
  'supertest', 'agent', 'this', 'Map', 'WeakMap', 'urlParams', 'url', 'settings', 'data', 'response',
]);

function detectJs(file, ctx) {
  const out = [];
  const { content, path } = file;

  // Next.js app router: app/api/users/[id]/route.ts
  const appRoute = path.match(/(?:^|\/)app\/((?:.+\/)?)route\.(js|ts|mjs)$/);
  if (appRoute) {
    const routePath = joinPath(...appRoute[1].split('/').map(nextSegment).filter(Boolean));
    const methods = new Set();
    for (const m of content.matchAll(/export\s+(?:async\s+)?(?:function|const|let)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) methods.add(m[1]);
    for (const m of content.matchAll(/\bas\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) methods.add(m[1]);
    for (const method of methods.size ? methods : ['ANY']) out.push({ method, path: routePath, line: 1, framework: 'Next.js' });
    return out;
  }
  // Next.js pages API: pages/api/users/[id].ts
  const pagesApi = path.match(/(?:^|\/)pages\/(api\/.+)\.(js|ts)$/);
  if (pagesApi) {
    const segs = pagesApi[1].split('/').map(nextSegment).filter(Boolean);
    if (segs[segs.length - 1] === 'index') segs.pop();
    const methods = [...new Set([...content.matchAll(/req\.method\s*===?\s*['"](\w+)['"]/g)].map((m) => m[1].toUpperCase()))];
    for (const method of methods.length ? methods : ['ANY']) out.push({ method, path: joinPath(...segs), line: 1, framework: 'Next.js' });
    return out;
  }
  // SvelteKit: src/routes/api/items/[id]/+server.ts
  const svelte = path.match(/(?:^|\/)routes\/((?:.+\/)?)\+server\.(js|ts)$/);
  if (svelte) {
    const routePath = joinPath(...svelte[1].split('/').map(nextSegment).filter(Boolean));
    for (const m of content.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) {
      out.push({ method: m[1], path: routePath, line: lineAt(content, m.index), framework: 'SvelteKit' });
    }
    return out;
  }

  // NestJS controllers
  if (/@Controller\s*\(/.test(content)) {
    const ctrl = content.match(/@Controller\s*\(\s*(?:['"`]([^'"`]*)['"`]|\{[^}]*path\s*:\s*['"`]([^'"`]*)['"`][^}]*\})?\s*\)/);
    const prefix = ctrl ? ctrl[1] ?? ctrl[2] ?? '' : '';
    for (const m of content.matchAll(/@(Get|Post|Put|Patch|Delete|Options|Head|All)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g)) {
      out.push({ method: m[1].toUpperCase(), path: joinPath(prefix, m[2] || ''), line: lineAt(content, m.index), framework: 'NestJS' });
    }
    return out;
  }

  if (!JS_SERVER_HINT.test(content)) return out;
  const framework = /fastify/.test(content) ? 'Fastify' : /hono/i.test(content) ? 'Hono' : /koa/.test(content) ? 'Koa' : 'Express';
  const prefix = ctx.prefixFor(path);

  // app.get('/path', ...)  router.post("/x", ...)
  const re = /\b([A-Za-z_$][\w$]*)\s*\.\s*(get|post|put|patch|delete|del|options|head|all)\s*\(\s*(['"`])([^'"`]*)\3/g;
  for (const m of content.matchAll(re)) {
    if (JS_RECEIVER_BLOCKLIST.has(m[1])) continue;
    if (!looksLikeRoute(m[4]) || m[4].includes('${')) continue;
    const method = m[2] === 'del' ? 'DELETE' : m[2] === 'all' ? 'ANY' : m[2].toUpperCase();
    out.push({ method, path: joinPath(prefix, m[4]), line: lineAt(content, m.index), framework });
  }

  // router.route('/path').get(...).post(...)
  for (const m of content.matchAll(/\.route\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g)) {
    const tail = content.slice(m.index + m[0].length, m.index + m[0].length + 600).split(/\.route\s*\(|;\s*\n/)[0];
    for (const mm of tail.matchAll(/\.\s*(get|post|put|patch|delete|all)\s*\(/g)) {
      out.push({
        method: mm[1] === 'all' ? 'ANY' : mm[1].toUpperCase(),
        path: joinPath(prefix, m[2]),
        line: lineAt(content, m.index),
        framework,
      });
    }
  }

  // fastify.route({ method: 'GET', url: '/x' })
  for (const m of content.matchAll(/\.route\s*\(\s*\{([\s\S]{0,400}?)\}\s*\)/g)) {
    const body = m[1];
    const url = body.match(/\b(?:url|path)\s*:\s*['"`]([^'"`]+)['"`]/)?.[1];
    const methods = body.match(/\bmethod\s*:\s*(\[[^\]]*\]|['"`]\w+['"`])/)?.[1];
    if (!url || !methods) continue;
    for (const mm of methods.matchAll(/['"`](\w+)['"`]/g)) {
      out.push({ method: mm[1].toUpperCase(), path: joinPath(prefix, url), line: lineAt(content, m.index), framework });
    }
  }
  return out;
}

/** Converts Next.js / SvelteKit path segments: (group) → dropped, [id] → :id, [...slug] → *slug */
function nextSegment(seg) {
  if (!seg) return '';
  if (/^\(.*\)$/.test(seg) || seg.startsWith('@')) return '';
  const catchAll = seg.match(/^\[\[?\.\.\.(\w+)\]\]?$/);
  if (catchAll) return `*${catchAll[1]}`;
  const dyn = seg.match(/^\[(\w+)(?:=\w+)?\]$/);
  if (dyn) return `:${dyn[1]}`;
  return seg;
}

/**
 * Resolves Express-style router mounting so routes get their real prefix:
 *   import usersRouter from './routes/users.js';  app.use('/api/users', usersRouter);
 */
function buildMountPrefixes(files, allPaths) {
  const pathSet = new Set(allPaths);
  const resolveImport = (fromFile, spec) => {
    if (!spec.startsWith('.')) return null;
    const base = dirname(fromFile);
    const parts = [...(base ? base.split('/') : []), ...spec.split('/')];
    const stack = [];
    for (const p of parts) {
      if (p === '.' || p === '') continue;
      if (p === '..') stack.pop();
      else stack.push(p);
    }
    const target = stack.join('/');
    const stripped = target.replace(/\.(js|mjs|cjs|ts)$/, '');
    const candidates = [target, ...['js', 'ts', 'mjs', 'cjs'].flatMap((e) => [`${stripped}.${e}`, `${stripped}/index.${e}`])];
    return candidates.find((c) => pathSet.has(c)) || null;
  };

  const edges = []; // { parent, child, prefix }
  for (const file of files) {
    if (!/\.(js|mjs|cjs|ts|mts)$/.test(file.path)) continue;
    const imports = new Map();
    for (const m of file.content.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from\s+['"](\.[^'"]+)['"]/g)) imports.set(m[1], m[2]);
    for (const m of file.content.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) imports.set(m[1], m[2]);

    const mountRe = /\.use\(\s*(['"`])([^'"`]+)\1\s*,\s*(?:[\w$.]+\s*,\s*)*(?:require\(\s*['"](\.[^'"]+)['"]\s*\)|([A-Za-z_$][\w$]*))\s*[,)]/g;
    for (const m of file.content.matchAll(mountRe)) {
      const spec = m[3] || imports.get(m[4]);
      if (!spec) continue;
      const child = resolveImport(file.path, spec);
      if (child) edges.push({ parent: file.path, child, prefix: m[2] });
    }
  }

  const cache = new Map();
  const prefixFor = (path, depth = 0) => {
    if (cache.has(path)) return cache.get(path);
    if (depth > 5) return '';
    const edge = edges.find((e) => e.child === path);
    const result = edge ? joinPath(prefixFor(edge.parent, depth + 1), edge.prefix) : '';
    cache.set(path, result === '/' ? '' : result);
    return cache.get(path);
  };
  return { prefixFor: (p) => prefixFor(p), mounts: edges.length };
}

// ───────────────────────── Python ─────────────────────────

function detectPython(file) {
  const { content, path } = file;
  const out = [];

  // Router/blueprint prefixes: router = APIRouter(prefix="/users")  bp = Blueprint('x', __name__, url_prefix='/x')
  const prefixes = {};
  for (const m of content.matchAll(/(\w+)\s*=\s*(?:APIRouter|Blueprint)\(([^)]*)\)/g)) {
    const p = m[2].match(/(?:prefix|url_prefix)\s*=\s*['"]([^'"]*)['"]/);
    if (p) prefixes[m[1]] = p[1];
  }
  const isFastApi = /fastapi/i.test(content);

  // Flask: @app.route('/x', methods=['GET', 'POST'])
  for (const m of content.matchAll(/@(\w+)\.route\(\s*['"]([^'"]*)['"]([^)]*)\)/g)) {
    const methods = m[3].match(/methods\s*=\s*[[(]([^\])]*)[\])]/)?.[1];
    const list = methods ? [...methods.matchAll(/['"](\w+)['"]/g)].map((x) => x[1].toUpperCase()) : ['GET'];
    for (const method of list) {
      out.push({ method, path: joinPath(prefixes[m[1]], m[2]), line: lineAt(content, m.index), framework: 'Flask' });
    }
  }
  // FastAPI / Flask 2: @app.get("/x")  @router.post("/y")
  for (const m of content.matchAll(/@(\w+)\.(get|post|put|patch|delete|options|head|websocket)\(\s*['"]([^'"]*)['"]/g)) {
    out.push({
      method: m[2] === 'websocket' ? 'WS' : m[2].toUpperCase(),
      path: joinPath(prefixes[m[1]], m[3]),
      line: lineAt(content, m.index),
      framework: isFastApi ? 'FastAPI' : 'Flask',
    });
  }
  // Django: path('users/<int:pk>/', views.detail)
  if (basename(path) === 'urls.py') {
    for (const m of content.matchAll(/\b(re_)?path\(\s*r?['"]([^'"]*)['"]\s*,\s*([^,)]+)/g)) {
      if (/include\(/.test(m[3])) continue;
      const route = m[1] ? m[2].replace(/^\^|\$$/g, '') : m[2];
      out.push({ method: 'ANY', path: joinPath(route.replace(/<(?:\w+:)?(\w+)>/g, ':$1')), line: lineAt(content, m.index), framework: 'Django' });
    }
  }
  return out;
}

// ───────────────────────── Go ─────────────────────────

function detectGo(file) {
  const { content } = file;
  const out = [];
  const groups = {};
  for (const m of content.matchAll(/(\w+)\s*:?=\s*(\w+)\.Group\(\s*"([^"]*)"/g)) {
    groups[m[1]] = joinPath(groups[m[2]] || '', m[3]);
  }
  const framework = /gin-gonic/.test(content) ? 'Gin' : /labstack\/echo/.test(content) ? 'Echo' : /gofiber/.test(content) ? 'Fiber' : /go-chi/.test(content) ? 'Chi' : 'net/http';

  for (const m of content.matchAll(/\b(\w+)\.(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD|Any|Get|Post|Put|Patch|Delete|Options|Head)\(\s*"([^"]*)"/g)) {
    if (m[1] === 'http' || !looksLikeRoute(m[3])) continue;
    const method = m[2] === 'Any' ? 'ANY' : m[2].toUpperCase();
    out.push({ method, path: joinPath(groups[m[1]] || '', m[3]), line: lineAt(content, m.index), framework });
  }
  // net/http & gorilla/mux: HandleFunc("GET /x", h)  HandleFunc("/x", h).Methods("POST")
  for (const m of content.matchAll(/\b(\w+)\.(?:HandleFunc|Handle)\(\s*"([^"]+)"[^\n]*/g)) {
    let route = m[2];
    let method = 'ANY';
    const pattern = route.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\S+)$/);
    if (pattern) [, method, route] = pattern;
    const methods = m[0].match(/\.Methods\(([^)]*)\)/)?.[1];
    if (methods) method = [...methods.matchAll(/"(\w+)"/g)].map((x) => x[1]).join(', ') || method;
    if (!looksLikeRoute(route)) continue;
    out.push({ method, path: joinPath(groups[m[1]] || '', route), line: lineAt(content, m.index), framework: /gorilla\/mux/.test(content) ? 'Gorilla Mux' : 'net/http' });
  }
  return out;
}

// ───────────────────────── Java / Kotlin (Spring) ─────────────────────────

function detectSpring(file) {
  const { content } = file;
  if (!/@(Rest)?Controller\b|@RequestMapping|Mapping\(/.test(content)) return [];
  const out = [];
  const classIdx = content.search(/\bclass\s+\w+/);
  const head = classIdx > -1 ? content.slice(0, classIdx) : '';
  const prefix = head.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*|path\s*=\s*)?\{?\s*"([^"]*)"/)?.[1] || '';

  const re = /@(Get|Post|Put|Patch|Delete|Request)Mapping\s*(?:\(([^)]*)\))?/g;
  for (const m of content.matchAll(re)) {
    if (m.index < classIdx) continue;
    const args = m[2] || '';
    const route = args.match(/"([^"]*)"/)?.[1] || '';
    let method = m[1] === 'Request' ? args.match(/RequestMethod\.(\w+)/)?.[1] || 'ANY' : m[1].toUpperCase();
    out.push({ method, path: joinPath(prefix, route), line: lineAt(content, m.index), framework: 'Spring' });
  }
  return out;
}

// ───────────────────────── C# (ASP.NET Core) ─────────────────────────

function detectCSharp(file) {
  const { content, path } = file;
  const out = [];
  for (const m of content.matchAll(/\.Map(Get|Post|Put|Patch|Delete)\(\s*"([^"]*)"/g)) {
    out.push({ method: m[1].toUpperCase(), path: joinPath(m[2]), line: lineAt(content, m.index), framework: 'ASP.NET Core' });
  }
  if (/\[ApiController\]|:\s*(Controller|ControllerBase)\b/.test(content)) {
    const controllerName = basename(path).replace(/Controller\.cs$/, '').replace(/\.cs$/, '');
    const classIdx = content.search(/\bclass\s+\w+/);
    const prefix = (content.slice(0, classIdx).match(/\[Route\(\s*"([^"]*)"\s*\)\]/)?.[1] || '').replace('[controller]', controllerName.toLowerCase());
    for (const m of content.matchAll(/\[Http(Get|Post|Put|Patch|Delete)(?:\(\s*"([^"]*)"\s*\))?\]/g)) {
      out.push({ method: m[1].toUpperCase(), path: joinPath(prefix, m[2] || ''), line: lineAt(content, m.index), framework: 'ASP.NET Core' });
    }
  }
  return out;
}

// ───────────────────────── Ruby (Rails) ─────────────────────────

const REST_ACTIONS = [
  ['GET', ''], ['POST', ''], ['GET', '/:id'], ['PATCH', '/:id'], ['PUT', '/:id'], ['DELETE', '/:id'],
];
const REST_ACTION_NAMES = ['index', 'create', 'show', 'update', 'update', 'destroy'];

function detectRails(file) {
  const { content } = file;
  const out = [];
  const stack = [];
  const prefix = () => stack.filter(Boolean).join('/');
  content.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) return;
    const ns = line.match(/^(?:namespace\s+:(\w+)|scope\s+(?:path:\s*)?['"]\/?([^'"]+)['"])/);
    if (/\bdo\b(\s*\|.*\|)?$/.test(line)) {
      if (ns) stack.push(ns[1] || ns[2]);
      else {
        const res = line.match(/^resources?\s+:(\w+)/);
        stack.push(res ? `${res[1]}/:${res[1].replace(/s$/, '')}_id` : null);
        if (res) addResources(line, i);
      }
      return;
    }
    if (line === 'end') {
      stack.pop();
      return;
    }
    const verb = line.match(/^(get|post|put|patch|delete|match)\s+['"]([^'"]+)['"]/);
    if (verb) {
      out.push({ method: verb[1] === 'match' ? 'ANY' : verb[1].toUpperCase(), path: joinPath(prefix(), verb[2]), line: i + 1, framework: 'Rails' });
      return;
    }
    if (/^root\b/.test(line)) {
      out.push({ method: 'GET', path: joinPath(prefix()), line: i + 1, framework: 'Rails' });
      return;
    }
    if (/^resources?\s+:/.test(line)) addResources(line, i);
  });

  function addResources(line, i) {
    const m = line.match(/^(resources?)\s+:(\w+)(.*)$/);
    if (!m) return;
    const singular = m[1] === 'resource';
    const only = m[3].match(/only:\s*\[([^\]]*)\]/)?.[1];
    const except = m[3].match(/except:\s*\[([^\]]*)\]/)?.[1];
    const pick = (list) => (list ? [...list.matchAll(/:(\w+)/g)].map((x) => x[1]) : null);
    const onlyList = pick(only);
    const exceptList = pick(except) || [];
    REST_ACTIONS.forEach(([method, suffix], idx) => {
      const action = REST_ACTION_NAMES[idx];
      if (onlyList && !onlyList.includes(action)) return;
      if (exceptList.includes(action)) return;
      if (singular && action === 'index') return;
      if (method === 'PUT') return; // PUT mirrors PATCH; keep the list readable
      out.push({ method, path: joinPath(prefix(), m[2], singular ? '' : suffix), line: i + 1, framework: 'Rails' });
    });
  }
  return out;
}

// ───────────────────────── PHP (Laravel) ─────────────────────────

function detectLaravel(file) {
  const { content, path } = file;
  const out = [];
  const base = /(^|\/)routes\/api\.php$/.test(path) ? '/api' : '';
  for (const m of content.matchAll(/Route::(get|post|put|patch|delete|any|options)\(\s*['"]([^'"]*)['"]/g)) {
    out.push({ method: m[1] === 'any' ? 'ANY' : m[1].toUpperCase(), path: joinPath(base, m[2]), line: lineAt(content, m.index), framework: 'Laravel' });
  }
  for (const m of content.matchAll(/Route::(apiResource|resource)\(\s*['"]([^'"]+)['"]/g)) {
    for (const [method, suffix] of REST_ACTIONS) {
      if (method === 'PUT') continue;
      out.push({ method, path: joinPath(base, m[2], suffix), line: lineAt(content, m.index), framework: 'Laravel' });
    }
  }
  return out;
}

// ───────────────────────── entry point ─────────────────────────

/**
 * @param {Array<{path:string, content:string}>} files fetched candidate files
 * @param {string[]} allPaths every path in the repository
 */
export function detectEndpoints(files, allPaths) {
  const mount = buildMountPrefixes(files, allPaths);
  const all = [];

  for (const file of files) {
    if (!file.content) continue;
    const ext = extOf(file.path);
    let found = [];
    try {
      if (['js', 'mjs', 'cjs', 'ts', 'mts', 'cts'].includes(ext)) found = detectJs(file, mount);
      else if (ext === 'py') found = detectPython(file);
      else if (ext === 'go') found = detectGo(file);
      else if (ext === 'java' || ext === 'kt') found = detectSpring(file);
      else if (ext === 'cs') found = detectCSharp(file);
      else if (ext === 'rb') found = detectRails(file);
      else if (ext === 'php') found = detectLaravel(file);
    } catch {
      found = [];
    }
    for (const e of found) all.push({ ...e, file: file.path });
  }

  // De-duplicate
  const seen = new Set();
  const endpoints = all.filter((e) => {
    const key = `${e.method} ${e.path} ${e.file}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const byMethod = {};
  const byFramework = {};
  for (const e of endpoints) {
    byMethod[e.method] = (byMethod[e.method] || 0) + 1;
    byFramework[e.framework] = (byFramework[e.framework] || 0) + 1;
  }

  return {
    endpoints: endpoints.slice(0, 500),
    total: endpoints.length,
    byMethod,
    frameworks: Object.keys(byFramework),
    filesScanned: files.length,
    mountsResolved: mount.mounts,
  };
}
