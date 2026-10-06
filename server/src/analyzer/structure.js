import { isVendored } from './files.js';

const MAX_TREE_NODES = 4000;

const DIR_ROLES = [
  [/^(src|source|lib|app|pkg)$/i, 'Application source code'],
  [/^(client|frontend|web|ui|www)$/i, 'Frontend application'],
  [/^(server|backend|api|service|services)$/i, 'Backend / API code'],
  [/^(packages|apps|modules|libs|crates)$/i, 'Workspace packages (monorepo)'],
  [/^(tests?|__tests__|spec|specs|e2e|cypress|integration)$/i, 'Automated tests'],
  [/^(docs?|documentation|website)$/i, 'Documentation'],
  [/^(examples?|samples?|demo|demos|playground)$/i, 'Usage examples'],
  [/^(scripts?|tools|bin|hack)$/i, 'Developer scripts & tooling'],
  [/^(config|configs|conf|settings)$/i, 'Configuration'],
  [/^(public|static|assets|media|images|img|resources)$/i, 'Static assets'],
  [/^\.github$/i, 'GitHub workflows & templates'],
  [/^(cmd)$/i, 'Go command entrypoints'],
  [/^(internal)$/i, 'Private (internal) packages'],
  [/^(migrations?|db|database|prisma|schema)$/i, 'Database schema & migrations'],
  [/^(components)$/i, 'UI components'],
  [/^(pages|routes|views|screens)$/i, 'Pages / routes'],
  [/^(models|entities|schemas)$/i, 'Data models'],
  [/^(controllers|handlers)$/i, 'Request handlers'],
  [/^(middlewares?)$/i, 'Middleware'],
  [/^(utils?|helpers|common|shared|core)$/i, 'Shared utilities'],
  [/^(types|typings|@types)$/i, 'Type definitions'],
  [/^(deploy|deployment|infra|infrastructure|k8s|helm|terraform|docker)$/i, 'Deployment & infrastructure'],
  [/^(android|ios|macos|windows|linux)$/i, 'Native platform project'],
  [/^(benchmarks?|bench|perf)$/i, 'Benchmarks'],
  [/^(locales?|i18n|translations|lang)$/i, 'Internationalisation'],
  [/^(node_modules|vendor|third_party)$/i, 'Vendored third-party code'],
  [/^(dist|build|out|target)$/i, 'Build output'],
];

export function describeDirectory(name) {
  return DIR_ROLES.find(([re]) => re.test(name))?.[1] || null;
}

/**
 * Builds a nested directory tree from GitHub's flat tree listing, with aggregated
 * file counts and sizes. Large repositories are pruned breadth-first so the tree
 * stays a reasonable size; pruned directories keep their counts and get `truncated: true`.
 */
export function buildStructure(entries) {
  const root = { name: '', path: '', type: 'dir', size: 0, fileCount: 0, children: new Map() };

  for (const e of entries) {
    const parts = e.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const isLeaf = i === parts.length - 1;
      const name = parts[i];
      const path = parts.slice(0, i + 1).join('/');
      if (isLeaf && e.type === 'blob') {
        node.children.set(name, { name, path, type: 'file', size: e.size || 0 });
      } else {
        if (!node.children.has(name)) {
          node.children.set(name, { name, path, type: 'dir', size: 0, fileCount: 0, children: new Map() });
        }
        node = node.children.get(name);
      }
    }
  }

  // Aggregate sizes and file counts bottom-up.
  const aggregate = (node) => {
    if (node.type === 'file') return { size: node.size, files: 1 };
    let size = 0;
    let files = 0;
    for (const child of node.children.values()) {
      const r = aggregate(child);
      size += r.size;
      files += r.files;
    }
    node.size = size;
    node.fileCount = files;
    return { size, files };
  };
  aggregate(root);

  // Breadth-first serialisation with a node budget. Directories first, then files, alphabetical.
  const sortChildren = (node) =>
    [...node.children.values()].sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1,
    );

  const out = { name: '', path: '', type: 'dir', size: root.size, fileCount: root.fileCount, children: [] };
  const queue = [[root, out]];
  let budget = MAX_TREE_NODES;
  let truncated = false;

  while (queue.length) {
    const [src, dst] = queue.shift();
    const kids = sortChildren(src);
    // Never expand vendored folders (node_modules etc.): keep them collapsed with counts.
    if (src !== root && isVendored(`${src.path}/`)) {
      dst.truncated = kids.length > 0;
      if (kids.length) truncated = true;
      continue;
    }
    if (kids.length > budget) {
      dst.truncated = true;
      truncated = true;
      continue;
    }
    budget -= kids.length;
    for (const k of kids) {
      const node =
        k.type === 'dir'
          ? { name: k.name, path: k.path, type: 'dir', size: k.size, fileCount: k.fileCount, children: [] }
          : { name: k.name, path: k.path, type: 'file', size: k.size };
      dst.children.push(node);
      if (k.type === 'dir') queue.push([k, node]);
    }
  }

  const topLevel = sortChildren(root).map((n) => ({
    name: n.name,
    type: n.type,
    size: n.size,
    fileCount: n.type === 'dir' ? n.fileCount : undefined,
    role: n.type === 'dir' ? describeDirectory(n.name) : null,
  }));

  return { tree: out, topLevel, truncated };
}
