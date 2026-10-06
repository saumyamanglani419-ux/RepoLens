import { useMemo, useState } from 'react';
import { LuChevronRight, LuFile, LuFileCode, LuFileJson, LuFileText, LuFolder, LuFolderOpen, LuSearch } from 'react-icons/lu';
import type { TreeNode } from '@/types';
import { cn, formatBytes, formatNumber, githubBlobUrl, pluralize } from '@/lib/format';

const CODE_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|c|cpp|h|swift|dart|vue|svelte|scala|ex|exs|sh)$/i;
const DATA_EXT = /\.(json|ya?ml|toml|xml|lock|ini|env.*)$/i;
const TEXT_EXT = /\.(md|mdx|txt|rst)$/i;

function FileIcon({ name }: { name: string }) {
  if (CODE_EXT.test(name)) return <LuFileCode className="h-4 w-4 shrink-0 text-sky-400/80" aria-hidden />;
  if (DATA_EXT.test(name)) return <LuFileJson className="h-4 w-4 shrink-0 text-amber-400/80" aria-hidden />;
  if (TEXT_EXT.test(name)) return <LuFileText className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />;
  return <LuFile className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />;
}

/** Returns a pruned copy of the tree containing only nodes whose path matches `query` (plus ancestors). */
function filterTree(node: TreeNode, query: string): TreeNode | null {
  const q = query.toLowerCase();
  if (node.type === 'file') return node.path.toLowerCase().includes(q) ? node : null;
  const kids = (node.children ?? []).map((c) => filterTree(c, q)).filter((c): c is TreeNode => c !== null);
  if (kids.length || (node.path && node.name.toLowerCase().includes(q))) return { ...node, children: kids };
  return null;
}

interface RowProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
  forceOpen: boolean;
  repoUrl: string;
  branch: string;
}

function TreeRow({ node, depth, expanded, toggle, forceOpen, repoUrl, branch }: RowProps) {
  const isDir = node.type === 'dir';
  const open = isDir && (forceOpen || expanded.has(node.path));
  const indent = { paddingLeft: `${depth * 16 + 8}px` };

  if (!isDir) {
    return (
      <li role="treeitem" aria-selected={false}>
        <a
          href={githubBlobUrl(repoUrl, branch, node.path)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md py-1 pr-2 text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-50"
          style={indent}
        >
          <span className="w-4 shrink-0" aria-hidden />
          <FileIcon name={node.name} />
          <span className="truncate font-mono text-[13px]">{node.name}</span>
          <span className="ml-auto shrink-0 pl-3 text-xs tabular-nums text-zinc-600">{formatBytes(node.size)}</span>
        </a>
      </li>
    );
  }

  return (
    <li role="treeitem" aria-expanded={open} aria-selected={false}>
      <button
        type="button"
        onClick={() => toggle(node.path)}
        className="flex w-full items-center gap-2 rounded-md py-1 pr-2 text-left text-sm text-zinc-200 hover:bg-zinc-800/60"
        style={indent}
      >
        <LuChevronRight className={cn('h-4 w-4 shrink-0 text-zinc-500 transition-transform', open && 'rotate-90')} aria-hidden />
        {open ? (
          <LuFolderOpen className="h-4 w-4 shrink-0 text-brand-300" aria-hidden />
        ) : (
          <LuFolder className="h-4 w-4 shrink-0 text-brand-300/80" aria-hidden />
        )}
        <span className="truncate font-mono text-[13px] font-medium">{node.name}</span>
        <span className="ml-auto shrink-0 pl-3 text-xs tabular-nums text-zinc-600">
          {pluralize(node.fileCount ?? 0, 'file')} · {formatBytes(node.size)}
        </span>
      </button>
      {open && (
        <ul role="group">
          {(node.children ?? []).map((child) => (
            <TreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              forceOpen={forceOpen}
              repoUrl={repoUrl}
              branch={branch}
            />
          ))}
          {node.truncated && (
            <li className="py-1 text-xs italic text-zinc-600" style={{ paddingLeft: `${(depth + 1) * 16 + 32}px` }}>
              Contents collapsed ({formatNumber(node.fileCount ?? 0)} files)
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

export function FileTree({ tree, repoUrl, branch }: { tree: TreeNode; repoUrl: string; branch: string }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const visible = useMemo(() => (query.trim() ? filterTree(tree, query.trim()) : tree), [tree, query]);

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const expandTopLevel = () =>
    setExpanded(new Set((tree.children ?? []).filter((c) => c.type === 'dir').map((c) => c.path)));

  return (
    <div>
      <div className="flex flex-col gap-2 border-b border-zinc-800/80 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter files by path…"
            aria-label="Filter files"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={expandTopLevel} className="rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            Expand top level
          </button>
          <button type="button" onClick={() => setExpanded(new Set())} className="rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            Collapse all
          </button>
        </div>
      </div>
      <div className="max-h-[560px] overflow-auto p-2">
        {visible && visible.children && visible.children.length ? (
          <ul role="tree" aria-label="Repository files">
            {visible.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={0}
                expanded={expanded}
                toggle={toggle}
                forceOpen={Boolean(query.trim())}
                repoUrl={repoUrl}
                branch={branch}
              />
            ))}
          </ul>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-zinc-500">No files match “{query}”.</p>
        )}
      </div>
    </div>
  );
}
