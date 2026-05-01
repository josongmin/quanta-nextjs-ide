import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  CodeBlock,
  EmptyState,
  Icon,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  flattenTree,
  lineDiff,
  reportFor,
  reports,
  type HydrationMatch,
  type HydrationNode,
} from './helpers';

const matchIcon: Record<HydrationMatch, string> = {
  ok: '✓',
  mismatch: '⚠',
  'missing-server': '−',
  'missing-client': '+',
};

const matchTone: Record<HydrationMatch, 'static' | 'warn' | 'muted' | 'info'> = {
  ok: 'static',
  mismatch: 'warn',
  'missing-server': 'muted',
  'missing-client': 'info',
};

export function HydrationInspectorOverlay() {
  const open = useUiStore((s) => s.overlays.hydrationInspector.open);
  const requested = useUiStore((s) => s.overlays.hydrationInspector.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [routeId, setRouteId] = useState<string>(reports[0]?.routeId ?? 'route_home');
  const [mismatchOnly, setMismatchOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (requested && reports.some((r) => r.routeId === requested)) {
      setRouteId(requested);
    }
  }, [open, requested]);

  const report = reportFor(routeId);

  // pick first mismatch node by default whenever route changes
  useEffect(() => {
    if (!report) {
      setSelectedId(null);
      return;
    }
    const all = flattenTree(report.root);
    const firstMismatch = all.find((n) => n.match !== 'ok');
    setSelectedId((firstMismatch ?? all[0])?.id ?? null);
  }, [report]);

  const allNodes = useMemo(
    () => (report ? flattenTree(report.root) : []),
    [report],
  );
  const selected = allNodes.find((n) => n.id === selectedId);

  const routeOptions = useMemo(() => {
    return reports
      .map((r) => {
        const route = routes.find((x) => x.id === r.routeId);
        return { value: r.routeId, label: route?.path ?? r.routeId };
      });
  }, [routes]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('hydrationInspector'))}
      title="Hydration Inspector"
      subtitle="server markup vs client hydration"
      size="lg"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Open in editor (mock)')}>
            <Icon.File className="h-3 w-3" /> Open in editor
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Hydration audit re-running (mock)')}>
            <Icon.Refresh className="h-3 w-3" /> Run audit
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <SelectControl
          label="route"
          value={routeId}
          options={routeOptions}
          onChange={setRouteId}
        />
        <ToggleChip active={mismatchOnly} onClick={() => setMismatchOnly((v) => !v)}>
          mismatch only
        </ToggleChip>
        {report ? (
          <div className="ml-auto inline-flex items-center gap-2 text-[11px] text-ink-3">
            <Chip tone={report.mismatches > 0 ? 'warn' : 'static'} size="xs">
              {report.mismatches} mismatch{report.mismatches === 1 ? '' : 'es'}
            </Chip>
            <span className="font-mono">{report.ms}ms hydrate</span>
          </div>
        ) : null}
      </div>

      {!report ? (
        <div className="p-4">
          <EmptyState title="No report" description="No hydration data available for this route." />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_320px]">
          <ScrollArea className="max-h-[60vh] hairline-r">
            <ul className="py-1">
              <NodeRow
                node={report.root}
                depth={0}
                mismatchOnly={mismatchOnly}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </ul>
          </ScrollArea>
          <div className="bg-bg-subtle/40">
            {selected ? (
              <SelectedDetail node={selected} />
            ) : (
              <div className="p-4 text-xs text-ink-3">Select a node to inspect.</div>
            )}
          </div>
        </div>
      )}
    </OverlayPanel>
  );
}

interface NodeRowProps {
  node: HydrationNode;
  depth: number;
  mismatchOnly: boolean;
  selectedId: string | null;
  onSelect(id: string): void;
}

function NodeRow({ node, depth, mismatchOnly, selectedId, onSelect }: NodeRowProps) {
  const subtree = useMemo(() => flattenTree(node), [node]);
  const subtreeHasMismatch = subtree.some((n) => n.match !== 'ok');
  if (mismatchOnly && !subtreeHasMismatch) return null;

  const selected = node.id === selectedId;
  return (
    <>
      <li>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={cn(
            'flex w-full items-center gap-1.5 px-3 py-1 text-left text-xs hover:bg-bg-hover',
            selected && 'bg-bg-selected',
            node.match === 'mismatch' && 'bg-sev-err-soft/30 hover:bg-sev-err-soft/50',
          )}
          style={{ paddingLeft: 12 + depth * 14 }}
        >
          <span
            aria-hidden
            className={cn(
              'inline-flex h-4 w-4 items-center justify-center text-[11px]',
              node.match === 'ok' && 'text-sem-static',
              node.match === 'mismatch' && 'text-sev-warn',
              node.match === 'missing-server' && 'text-ink-3',
              node.match === 'missing-client' && 'text-sev-info',
            )}
          >
            {matchIcon[node.match]}
          </span>
          <span className="font-mono text-ink-1">{node.tag}</span>
          <Chip
            tone={node.kind === 'server' ? 'server' : 'client'}
            size="xs"
            className="ml-1"
          >
            {node.kind === 'server' ? 'S' : 'C'}
          </Chip>
          {node.match !== 'ok' ? (
            <Chip tone={matchTone[node.match]} size="xs">
              {node.match}
            </Chip>
          ) : null}
          {node.reason ? (
            <span className="ml-1 truncate text-[10px] text-ink-3">— {node.reason}</span>
          ) : null}
        </button>
      </li>
      {node.children.map((c) => (
        <NodeRow
          key={c.id}
          node={c}
          depth={depth + 1}
          mismatchOnly={mismatchOnly}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function SelectedDetail({ node }: { node: HydrationNode }) {
  const diff = lineDiff(node.serverHtml, node.clientHtml);
  const hasDiff = diff.some((d) => !d.same);
  return (
    <div className="flex h-full flex-col gap-3 p-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">selected</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="font-mono text-ink-1">{node.tag}</span>
          <Chip tone={node.kind === 'server' ? 'server' : 'client'} size="xs">
            {node.kind === 'server' ? 'server' : 'client'}
          </Chip>
          <Chip tone={matchTone[node.match]} size="xs">
            {node.match}
          </Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">server html</div>
          <CodeBlock
            code={node.serverHtml}
            showLineNumbers={false}
            diff={hasDiff ? 'before' : undefined}
            maxHeight={88}
          />
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">client html</div>
          <CodeBlock
            code={node.clientHtml}
            showLineNumbers={false}
            diff={hasDiff ? 'after' : undefined}
            maxHeight={88}
          />
        </div>
      </div>

      {node.reason ? (
        <div className="rounded-sm border border-line bg-bg p-2">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">reason</div>
          <div className="mt-0.5 text-ink-1">{node.reason}</div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-1.5">
        <Button
          size="xs"
          tone="ghost"
          onClick={() => toast('Suppress hydration warning (preview)')}
        >
          Suppress hydration warning
        </Button>
        <Button
          size="xs"
          tone="ghost"
          onClick={() => toast('Move computation to useEffect (preview)')}
        >
          Move to useEffect
        </Button>
      </div>
    </div>
  );
}
