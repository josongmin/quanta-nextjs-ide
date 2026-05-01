import { type ReactNode } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useRouteStore } from '@entities/route';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Icon,
} from '@shared/ui';
import type { FileNode } from '@shared/mocks/file-tree';
import { cn } from '@shared/lib/cn';

interface FileTreeProps {
  /** Root file-tree node — children are rendered. */
  root: FileNode;
  /** Lower-cased query; when set, hides non-matching subtrees. */
  search: string;
  expanded: Set<string>;
  toggle(id: string): void;
}

interface RowProps {
  node: FileNode;
  depth: number;
  search: string;
  expanded: Set<string>;
  toggle(id: string): void;
}

function nodeMatches(node: FileNode, q: string): boolean {
  if (!q) return true;
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.path.toLowerCase().includes(q)) return true;
  if (node.children) return node.children.some((c) => nodeMatches(c, q));
  return false;
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function FileIcon({ name }: { name: string }): ReactNode {
  const ext = fileExtension(name);
  switch (ext) {
    case '.tsx':
    case '.ts':
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return <Icon.File className="h-3.5 w-3.5 text-ink-3" />;
    case '.css':
    case '.scss':
      return <Icon.Tag className="h-3.5 w-3.5 text-ink-3" />;
    case '.json':
    case '.md':
      return <Icon.Doc className="h-3.5 w-3.5 text-ink-3" />;
    case '.svg':
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.ico':
      return <Icon.Hex className="h-3.5 w-3.5 text-ink-3" />;
    default:
      return <Icon.Doc className="h-3.5 w-3.5 text-ink-3" />;
  }
}

function FileRow({ node, depth, search, expanded, toggle }: RowProps): ReactNode {
  const lower = search.toLowerCase();
  if (!nodeMatches(node, lower)) return null;

  const isDir = node.kind === 'dir';
  const isExpanded = expanded.has(node.path) || lower.length > 0;

  if (isDir) {
    return (
      <>
        <DirectoryRow
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          onToggle={() => toggle(node.path)}
        />
        {isExpanded && node.children
          ? node.children.map((c) => (
              <FileRow
                key={c.path}
                node={c}
                depth={depth + 1}
                search={search}
                expanded={expanded}
                toggle={toggle}
              />
            ))
          : null}
      </>
    );
  }

  return <FileLeafRow node={node} depth={depth} />;
}

function DirectoryRow({
  node,
  depth,
  isExpanded,
  onToggle,
}: {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
  onToggle(): void;
}) {
  return (
    <div
      role="treeitem"
      aria-expanded={isExpanded}
      className="group flex h-7 cursor-pointer items-center gap-1.5 pr-2 text-sm hover:bg-bg-hover"
      style={{ paddingLeft: 8 + depth * 12 }}
      onClick={onToggle}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="text-ink-3 hover:text-accent"
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? (
          <Icon.ChevDown className="h-3 w-3" />
        ) : (
          <Icon.ChevRight className="h-3 w-3" />
        )}
      </button>
      <Icon.Folder className="h-3.5 w-3.5 text-ink-3" />
      <span className="flex-1 truncate font-mono text-ink-2">{node.name}</span>
    </div>
  );
}

function FileLeafRow({ node, depth }: { node: FileNode; depth: number }) {
  const openTab = useEditorStore((s) => s.openTab);
  const pushRecent = useUiStore((s) => s.pushRecent);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const setLeftTab = useUiStore((s) => s.setLeftTab);
  const toggleBookmark = useUiStore((s) => s.toggleBookmark);
  const isBookmarked = useUiStore((s) => s.bookmarks.includes(node.path));

  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const fileDiagnostics = diagnostics.filter((d) => d.location.file === node.path);
  const errCount = fileDiagnostics.filter((d) => d.severity === 'err').length;
  const warnCount = fileDiagnostics.filter((d) => d.severity === 'warn').length;
  const infoCount = fileDiagnostics.length - errCount - warnCount;
  const total = fileDiagnostics.length;

  const routes = useRouteStore((s) => s.routes);
  const isRouteFile = routes.some((r) =>
    Object.values(r.files).some((f) => f === node.path),
  );

  const handleOpen = () => {
    const label = node.name;
    openTab({ id: `tab-${node.path}`, file: node.path, label });
    pushRecent({ kind: 'file', id: node.path, label });
  };

  const handleFindRefs = () => {
    openOverlay('findReferences', { kind: 'symbol', symbol: node.path });
  };

  const handleRevealRoute = () => {
    if (isRouteFile) {
      setLeftTab('routes');
      toast('Revealed in route map', { description: node.path });
    } else {
      toast('Not a route file', { description: node.path });
    }
  };

  const handleBookmark = () => {
    toggleBookmark(node.path);
  };

  const dotTone =
    errCount > 0
      ? 'bg-sev-err'
      : warnCount > 0
        ? 'bg-sev-warn'
        : infoCount > 0
          ? 'bg-sev-info'
          : '';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="treeitem"
          className="group flex h-7 cursor-pointer items-center gap-1.5 pr-2 text-sm hover:bg-bg-hover"
          style={{ paddingLeft: 8 + depth * 12 }}
          onClick={handleOpen}
        >
          <span className="w-3" />
          {isBookmarked ? (
            <Icon.Pin
              aria-label="Bookmarked"
              className="h-3 w-3 shrink-0 text-accent"
            />
          ) : null}
          <FileIcon name={node.name} />
          <span className="flex-1 truncate font-mono text-ink-1">{node.name}</span>
          {total > 0 ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-ink-3"
              title={`${errCount} err · ${warnCount} warn · ${infoCount} info`}
            >
              <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dotTone)} />
              <span>{total}</span>
            </span>
          ) : null}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{node.name}</ContextMenuLabel>
        <ContextMenuItem onSelect={handleOpen}>Open</ContextMenuItem>
        <ContextMenuItem onSelect={handleFindRefs}>Find references</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleRevealRoute} disabled={!isRouteFile}>
          Reveal in route map
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleBookmark}>
          {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function FileTree({ root, search, expanded, toggle }: FileTreeProps) {
  const children = root.children ?? [];
  return (
    <div role="tree" aria-label="Project files">
      {children.map((child) => (
        <FileRow
          key={child.path}
          node={child}
          depth={0}
          search={search}
          expanded={expanded}
          toggle={toggle}
        />
      ))}
    </div>
  );
}
