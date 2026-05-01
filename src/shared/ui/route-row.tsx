import { cn } from '@shared/lib/cn';
import type { Route, RouteTreeNode } from '@shared/types';
import { CostChip } from './cost-chip';
import { Icon, IconBox } from './icons';
import { RenderingChip } from './rendering-chip';
import { SeverityDot } from './severity-icon';

interface Props {
  node: RouteTreeNode;
  route?: Route;
  selected: boolean;
  onClick(): void;
  depth: number;
  expanded: boolean;
  onToggle(): void;
  hasChildren: boolean;
}

const kindBadge = (kind: RouteTreeNode['kind']) => {
  switch (kind) {
    case 'route':
      return <IconBox letter="P" tone="neutral" />;
    case 'group':
      return <span className="text-[10px] font-mono text-ink-3">( )</span>;
    case 'parallel':
      return <span className="text-[10px] font-mono text-sem-edge">@</span>;
    case 'intercepting':
      return <span className="text-[10px] font-mono text-sem-edge">(.)</span>;
    case 'dynamic':
      return <span className="text-[10px] font-mono text-sem-dynamic">[ ]</span>;
    case 'file':
      return <Icon.File className="h-3.5 w-3.5 text-ink-3" />;
    default:
      return <Icon.Folder className="h-3.5 w-3.5 text-ink-3" />;
  }
};

/**
 * SignalDot — a single tiny pill summarising "is this row noteworthy?"
 *
 * Rules (resting state, ≤ 1 element rendered):
 *  - errCount > 0     → red pill with count
 *  - else warnCount   → amber pill with count
 *  - else dynamic    → tiny amber dot only
 *  - else cost ≥ D    → tiny warn dot
 *  - else nothing
 *
 * Full chip cluster (rendering / cost / risk) is reserved for hover & selected
 * state — same pattern as VS Code's per-file Problems badge + Cursor's Outline.
 */
function ResterSignal({ route }: { route: Route }) {
  if (route.riskCount > 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[11px] text-sev-warn"
        title={`${route.riskCount} risk${route.riskCount === 1 ? '' : 's'}`}
      >
        <SeverityDot severity="warn" />
        <span className="font-mono">{route.riskCount}</span>
      </span>
    );
  }
  if (route.rendering === 'dynamic') {
    return (
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-sem-dynamic/70"
        title="dynamic route"
        aria-label="dynamic route"
      />
    );
  }
  if (route.costClass === 'D' || route.costClass === 'E') {
    return (
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-sev-warn/70"
        title={`cost class ${route.costClass}`}
        aria-label={`cost class ${route.costClass}`}
      />
    );
  }
  return null;
}

export function RouteRow({
  node,
  route,
  selected,
  onClick,
  depth,
  expanded,
  onToggle,
  hasChildren,
}: Props) {
  return (
    <div
      role="treeitem"
      aria-selected={selected}
      aria-expanded={hasChildren ? expanded : undefined}
      className={cn(
        'group relative flex h-7 items-center gap-1.5 pr-2 text-sm hover:bg-bg-hover',
        selected && 'bg-bg-selected',
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
      onClick={onClick}
    >
      {selected && (
        <span className="absolute left-0 top-0 h-full w-0.5 bg-accent" aria-hidden />
      )}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-ink-3 hover:text-accent"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <Icon.ChevDown className="h-3 w-3" />
          ) : (
            <Icon.ChevRight className="h-3 w-3" />
          )}
        </button>
      ) : (
        <span className="w-3" />
      )}
      <span className="shrink-0">{kindBadge(node.kind)}</span>
      <span
        className={cn(
          'flex-1 truncate font-mono',
          node.kind === 'group' && 'text-ink-3',
          node.kind === 'parallel' && 'text-sem-edge',
          node.kind === 'intercepting' && 'text-sem-edge',
          node.kind === 'dynamic' && 'text-sem-dynamic',
          selected && 'text-ink-1',
        )}
      >
        {node.label}
      </span>

      {/* Resting signal — single dot/pill, only when noteworthy. Hidden on hover/selected. */}
      {route && (
        <span
          className={cn(
            'shrink-0 transition-opacity',
            selected ? 'opacity-0' : 'group-hover:opacity-0',
          )}
          aria-hidden={selected}
        >
          <ResterSignal route={route} />
        </span>
      )}

      {/* Full chip cluster — only on hover or when selected. */}
      {route && (
        <span
          className={cn(
            'absolute right-2 flex items-center gap-1.5 transition-opacity',
            selected
              ? 'opacity-100'
              : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
          )}
        >
          <RenderingChip
            rendering={route.rendering}
            confidence={route.renderingConfidence}
            showQuestion
          />
          <CostChip cost={route.costClass} />
          {route.riskCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] text-sev-warn"
              title={`${route.riskCount} risk${route.riskCount === 1 ? '' : 's'}`}
            >
              <SeverityDot severity="warn" />
              <span className="font-mono">{route.riskCount}</span>
            </span>
          )}
        </span>
      )}
    </div>
  );
}
