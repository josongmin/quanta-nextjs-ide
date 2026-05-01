import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  PRESENCE_SESSION,
  opTone,
  relTime,
  type OptimisticOp,
  type PresencePeer,
} from './helpers';

export function PresenceDebuggerOverlay() {
  const open = useUiStore((s) => s.overlays.presenceDebugger.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);

  const peers = PRESENCE_SESSION.peers;
  const visiblePeers = useMemo<ReadonlyArray<PresencePeer>>(() => {
    if (!conflictsOnly) return peers;
    return peers.filter((p) => p.ops.some((o) => o.status === 'conflict'));
  }, [peers, conflictsOnly]);

  const allOps: ReadonlyArray<{ peer: PresencePeer; op: OptimisticOp }> = useMemo(() => {
    const list: Array<{ peer: PresencePeer; op: OptimisticOp }> = [];
    for (const p of visiblePeers) {
      for (const o of p.ops) {
        if (conflictsOnly && o.status !== 'conflict') continue;
        list.push({ peer: p, op: o });
      }
    }
    return list;
  }, [visiblePeers, conflictsOnly]);

  const selected = allOps.find((x) => x.op.id === selectedOpId) ?? allOps[0] ?? null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('presenceDebugger')}
      title="Presence debugger"
      subtitle={`${PRESENCE_SESSION.name} · ${peers.length} peers`}
      size="xl"
    >
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">session</span>
        <ToggleChip active onClick={() => undefined}>{PRESENCE_SESSION.name}</ToggleChip>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">filter</span>
        <ToggleChip active={conflictsOnly} onClick={() => setConflictsOnly((v) => !v)}>
          conflicts only
        </ToggleChip>
        <Chip tone="static" size="sm" className="ml-auto">
          {peers.length} peers
        </Chip>
      </div>

      <div className="grid grid-cols-[260px_1fr_260px]">
        <div className="hairline-r">
          <ScrollArea className="max-h-[60vh]">
            <ul className="p-2 space-y-1.5">
              {visiblePeers.map((p) => (
                <li key={p.id} className="rounded-sm border border-line bg-bg p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-3 w-3 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <span className="truncate text-xs font-medium text-ink-1">{p.name}</span>
                    <span className="ml-auto text-[10px] text-ink-3">{relTime(p.lastSeenAgoSec)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Chip tone="muted" size="xs" className="font-mono">{p.currentRoute}</Chip>
                    {p.ops.some((o) => o.status === 'conflict') ? (
                      <Chip tone="err" size="xs">conflict</Chip>
                    ) : null}
                  </div>
                  <div className="mt-1 flex gap-1 text-[10px] text-ink-3">
                    <span>cursor</span>
                    <span className="font-mono">{p.cursor.x},{p.cursor.y}</span>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        <div>
          <div className="p-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              optimistic ops timeline
            </div>
            <OpsTimeline
              peers={visiblePeers}
              onSelect={setSelectedOpId}
              selectedId={selected?.op.id ?? null}
              conflictsOnly={conflictsOnly}
            />
          </div>
          <div className="px-3 pb-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              reconciliation log (last 8)
            </div>
            <ul className="space-y-1">
              {PRESENCE_SESSION.reconciliationLog.map((l) => {
                const peer = peers.find((p) => p.id === l.peerId);
                return (
                  <li
                    key={l.id}
                    className="flex items-start gap-2 rounded-sm border border-line bg-bg p-2 text-[11px]"
                  >
                    {peer ? (
                      <span
                        className="mt-0.5 block h-2 w-2 rounded-full"
                        style={{ backgroundColor: peer.color }}
                        aria-hidden
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="text-ink-1">{l.cause}</div>
                      <div className="text-ink-3">{l.resolution}</div>
                    </div>
                    <span className="ml-auto text-[10px] text-ink-3">{relTime(l.agoSec)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="hairline-l">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">op detail</div>
              {selected ? (
                <>
                  <div className="mb-2 flex flex-wrap gap-1">
                    <Chip tone={opTone(selected.op.status)} size="xs">
                      {selected.op.status}
                    </Chip>
                    <Chip tone="muted" size="xs">{selected.op.kind}</Chip>
                    <Chip tone="hint" size="xs">{selected.peer.name}</Chip>
                  </div>
                  <CodeBlock
                    code={selected.op.payload}
                    language="json"
                    showLineNumbers={false}
                    maxHeight={140}
                  />
                  <div className="mt-2 space-y-1 text-[11px] text-ink-2">
                    <div>
                      <span className="text-ink-3">sentAt:</span>{' '}
                      <span className="font-mono">+{(selected.op.sentAt / 1000).toFixed(2)}s</span>
                    </div>
                    <div>
                      <span className="text-ink-3">ackedAt:</span>{' '}
                      <span className="font-mono">
                        {selected.op.ackedAt === null
                          ? '—'
                          : `+${(selected.op.ackedAt / 1000).toFixed(2)}s`}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-3">expected ack:</span>{' '}
                      <span className="font-mono">{selected.op.expectedAckMs}ms</span>
                    </div>
                    {selected.op.conflictReason ? (
                      <div className="rounded-sm bg-sev-err-soft p-1.5 text-sev-err">
                        {selected.op.conflictReason}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="xs" tone="default" onClick={() => toast('Force-acked (mock)')}>
                      Force ack
                    </Button>
                    <Button size="xs" tone="warn" onClick={() => toast('Rolled back (mock)')}>
                      Rollback
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-ink-3">No op selected</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </OverlayPanel>
  );
}

function OpsTimeline({
  peers,
  onSelect,
  selectedId,
  conflictsOnly,
}: {
  peers: ReadonlyArray<PresencePeer>;
  onSelect(id: string): void;
  selectedId: string | null;
  conflictsOnly: boolean;
}) {
  const W = 540;
  const rowH = 26;
  const padLeft = 80;
  const totalMs = 5500;
  const H = peers.length * rowH + 24;

  if (peers.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-sm border border-dashed border-line bg-bg-subtle/30 text-[11px] text-ink-3">
        No peers
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="rounded-sm border border-line bg-bg">
      {[0, 1000, 2000, 3000, 4000, 5000].map((ms) => (
        <g key={ms}>
          <line
            x1={padLeft + (ms / totalMs) * (W - padLeft - 12)}
            y1={0}
            x2={padLeft + (ms / totalMs) * (W - padLeft - 12)}
            y2={H - 16}
            stroke="#eef0f3"
          />
          <text
            x={padLeft + (ms / totalMs) * (W - padLeft - 12)}
            y={H - 4}
            fill="#9aa1ab"
            fontSize="9"
            fontFamily="system-ui"
            textAnchor="middle"
          >
            {ms / 1000}s
          </text>
        </g>
      ))}
      {peers.map((p, idx) => {
        const yBase = idx * rowH + 6;
        return (
          <g key={p.id}>
            <text x="6" y={yBase + 14} fill="#3c4043" fontSize="10" fontFamily="system-ui">
              {p.name.slice(0, 10)}
            </text>
            <line
              x1={padLeft}
              y1={yBase + rowH / 2}
              x2={W - 12}
              y2={yBase + rowH / 2}
              stroke="#f1f3f5"
            />
            {p.ops
              .filter((o) => (conflictsOnly ? o.status === 'conflict' : true))
              .map((o) => {
                const x1 = padLeft + (o.sentAt / totalMs) * (W - padLeft - 12);
                const ackTs = o.ackedAt ?? totalMs;
                const x2 = padLeft + (ackTs / totalMs) * (W - padLeft - 12);
                const isSel = o.id === selectedId;
                const fill =
                  o.status === 'conflict'
                    ? '#dc2626'
                    : o.status === 'pending'
                      ? '#f59e0b'
                      : p.color;
                const isPending = o.status === 'pending';
                return (
                  <g
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => onSelect(o.id)}
                  >
                    <title>{`${o.kind} · ${o.status} · sent +${(o.sentAt / 1000).toFixed(2)}s`}</title>
                    <rect
                      x={x1}
                      y={yBase + 6}
                      width={Math.max(4, x2 - x1)}
                      height={14}
                      rx={2}
                      fill={fill}
                      fillOpacity={isPending ? 0.4 : 0.85}
                      stroke={isSel ? '#1d6dfd' : 'none'}
                      strokeWidth={isSel ? 1.5 : 0}
                      strokeDasharray={isPending ? '3 2' : ''}
                    />
                  </g>
                );
              })}
          </g>
        );
      })}
    </svg>
  );
}
