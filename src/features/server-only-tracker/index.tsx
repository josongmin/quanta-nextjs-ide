import { Fragment, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { analyzeClientModules, useLastTraceStore } from '@entities/rsc-payload';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ALL_KINDS,
  KIND_LABEL,
  KIND_TONE,
  VIOLATIONS,
  type Violation,
  type ViolationKind,
} from './helpers';

export function ServerOnlyTrackerOverlay() {
  const open = useUiStore((s) => s.overlays.serverOnlyTracker.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeKinds, setActiveKinds] = useState<ReadonlyArray<ViolationKind>>(
    ALL_KINDS,
  );
  const [boundaryOnly, setBoundaryOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(VIOLATIONS[0]?.id ?? null);

  const filtered = useMemo<ReadonlyArray<Violation>>(() => {
    return VIOLATIONS.filter((v) => {
      if (!activeKinds.includes(v.kind)) return false;
      if (boundaryOnly) {
        if (
          v.kind !== 'server-only-leaked-to-client' &&
          v.kind !== 'client-only-leaked-to-server'
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activeKinds, boundaryOnly]);

  const selected = useMemo(
    () => VIOLATIONS.find((v) => v.id === selectedId),
    [selectedId],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('serverOnlyTracker'))}
      title="Server-only tracker"
      subtitle={`${VIOLATIONS.length} violations · ${VIOLATIONS.filter((v) => v.severity === 'err').length} blocking`}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-xs text-ink-3">
            {filtered.length} of {VIOLATIONS.length} shown
          </span>
          <Button size="xs" tone="accent" onClick={() => toast('Generated fix PR (mock)')}>
            Generate fix PR
          </Button>
        </>
      }
    >
      <RscClientLeakageBanner />
      <PanelHeader>
        <span className="tracking-caps text-ink-3">kind</span>
        {ALL_KINDS.map((k) => (
          <ToggleChip
            key={k}
            active={activeKinds.includes(k)}
            onClick={() =>
              setActiveKinds((p) =>
                p.includes(k) ? p.filter((x) => x !== k) : [...p, k],
              )
            }
          >
            {KIND_LABEL[k]}
          </ToggleChip>
        ))}
        <span className="ml-auto" />
        <ToggleChip active={boundaryOnly} onClick={() => setBoundaryOnly((v) => !v)}>
          boundary only
        </ToggleChip>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <ScrollArea className="h-[540px]">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-bg-subtle">
              <tr className="text-[10px] uppercase tracking-caps text-ink-3">
                <Th>file</Th>
                <Th>kind</Th>
                <Th>sev</Th>
                <Th>line preview</Th>
                <Th right>trace</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const isExpanded = expandedId === v.id;
                const isSel = selectedId === v.id;
                return (
                  <Fragment key={v.id}>
                    <tr
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        'cursor-pointer hover:bg-bg-hover',
                        isSel && 'bg-accent-soft/30',
                      )}
                    >
                      <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-1">
                        {v.file}:{v.line}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <Chip tone={KIND_TONE[v.kind]} size="xs">
                          {KIND_LABEL[v.kind]}
                        </Chip>
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <Chip
                          tone={v.severity === 'err' ? 'err' : v.severity === 'warn' ? 'warn' : 'info'}
                          size="xs"
                        >
                          {v.severity}
                        </Chip>
                      </td>
                      <td className="hairline-b px-2 py-1 font-mono text-[10px] text-ink-2">
                        {v.preview}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : v.id);
                          }}
                          className="text-[11px] text-accent hover:underline"
                        >
                          {isExpanded ? 'hide' : 'trace'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr>
                        <td colSpan={5} className="hairline-b bg-bg-subtle px-3 py-2">
                          <TraceGraph violation={v} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[11px] text-ink-3">
                    No violations match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </ScrollArea>

        <ScrollArea className="h-[540px]">
          <div className="px-3 py-3">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Violation detail
            </div>
            {selected ? (
              <div className="mt-2 space-y-3 text-xs">
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="font-mono text-ink-1">
                    {selected.file}:{selected.line}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Chip tone={KIND_TONE[selected.kind]} size="xs">
                      {KIND_LABEL[selected.kind]}
                    </Chip>
                    <Chip
                      tone={selected.severity === 'err' ? 'err' : selected.severity === 'warn' ? 'warn' : 'info'}
                      size="xs"
                    >
                      {selected.severity}
                    </Chip>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Import chain
                  </div>
                  <ol className="mt-1 space-y-0.5 font-mono text-[10px] text-ink-2">
                    {selected.trace.map((e, i) => (
                      <li key={i}>
                        {i + 1}. {e.from} → {e.to}{' '}
                        <span className="text-ink-3">({e.reason})</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Suggested fix
                  </div>
                  <p className="mt-1 text-[11px] text-ink-2">{selected.fix}</p>
                  <div className="mt-2 space-y-2">
                    <CodeBlock code={selected.before} language="ts" diff="before" maxHeight={140} />
                    <CodeBlock code={selected.after} language="ts" diff="after" maxHeight={140} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                Select a violation to inspect.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function RscClientLeakageBanner() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const modules = useMemo(() => analyzeClientModules(chunks), [chunks]);
  if (!url) return null;
  const userModules = modules.filter((m) => !m.isNextInternal && !m.isThirdParty);
  const userBytes = userModules.reduce((s, m) => s + m.sizeBytes, 0);
  return (
    <div className="hairline-b bg-bg-subtle px-3 py-2">
      <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-caps text-ink-3">
        <span>From last RSC trace</span>
        <span className="font-mono normal-case text-ink-2">{url}</span>
        <span className="ml-auto">
          {userModules.length} user · {modules.length - userModules.length} internal · {userBytes}B
        </span>
      </div>
      {userModules.length === 0 ? (
        <div className="text-xs text-ink-3">
          No user-authored client modules ship for this route — clean.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {userModules.map((m) => (
            <Chip key={m.id} tone="edge" size="xs" title={m.modulePath}>
              {m.label} ({m.sizeBytes}B)
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        'hairline-b bg-bg-subtle px-2 py-1.5 font-normal',
        right ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function TraceGraph({ violation }: { violation: Violation }) {
  const NODE_W = 200;
  const NODE_H = 26;
  const COL = 240;
  const ROW = 50;

  // Each edge introduces from + to nodes; collect unique
  const nodeIds = useMemoIds(violation);

  const width = nodeIds.length * COL + 40;
  const height = ROW * 2 + 40;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ height }} className="block">
        {nodeIds.map((id, i) => {
          const x = 20 + i * COL;
          const y = 30;
          const isLeaf = i === nodeIds.length - 1;
          const isRoot = i === 0;
          const fill = isLeaf
            ? 'fill-sev-err-soft'
            : isRoot
              ? 'fill-sev-info-soft'
              : 'fill-bg-subtle';
          const stroke = isLeaf ? 'stroke-sev-err' : 'stroke-line';
          return (
            <g key={id} transform={`translate(${x},${y})`}>
              <rect
                x={0}
                y={0}
                width={NODE_W}
                height={NODE_H}
                rx={3}
                className={cn(fill, stroke)}
              />
              <text x={NODE_W / 2} y={17} textAnchor="middle" fontSize={10} className="fill-ink-1 font-mono">
                {id.length > 28 ? id.slice(0, 26) + '…' : id}
              </text>
            </g>
          );
        })}
        {violation.trace.map((edge, i) => {
          const x1 = 20 + i * COL + NODE_W;
          const x2 = 20 + (i + 1) * COL;
          const y = 30 + NODE_H / 2;
          const labelX = (x1 + x2) / 2;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                className="stroke-ink-3"
                strokeWidth={1}
                markerEnd="url(#arrow-trace)"
              />
              <text x={labelX} y={y - 4} textAnchor="middle" fontSize={8} className="fill-ink-3">
                {edge.reason}
              </text>
            </g>
          );
        })}
        <defs>
          <marker
            id="arrow-trace"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-ink-3" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

function useMemoIds(violation: Violation): string[] {
  const seen: string[] = [];
  for (const e of violation.trace) {
    if (!seen.includes(e.from)) seen.push(e.from);
    if (!seen.includes(e.to)) seen.push(e.to);
  }
  return seen;
}
