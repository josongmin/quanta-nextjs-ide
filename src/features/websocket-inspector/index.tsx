import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  WS_CONNECTIONS,
  WS_ROOMS,
  frameKindTone,
  statusTone,
  type FrameKind,
  type FrameDirection,
  type WSFrame,
} from './helpers';

const ALL_KINDS: ReadonlyArray<FrameKind> = ['text', 'binary', 'ping', 'pong', 'close'];

export function WebsocketInspectorOverlay() {
  const open = useUiStore((s) => s.overlays.websocketInspector.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [connId, setConnId] = useState<string>(WS_CONNECTIONS[0]?.id ?? '');
  const [activeKinds, setActiveKinds] = useState<ReadonlySet<FrameKind>>(new Set(ALL_KINDS));
  const [dir, setDir] = useState<'all' | FrameDirection>('all');
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const conn = useMemo(
    () => WS_CONNECTIONS.find((c) => c.id === connId) ?? WS_CONNECTIONS[0],
    [connId],
  );

  const frames = useMemo<ReadonlyArray<WSFrame>>(() => {
    if (!conn) return [];
    return conn.frames.filter(
      (f) => activeKinds.has(f.kind) && (dir === 'all' || f.direction === dir),
    );
  }, [conn, activeKinds, dir]);

  const selectedFrame =
    frames.find((f) => f.id === selectedFrameId) ?? frames[0] ?? null;

  if (!conn) return null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('websocketInspector')}
      title="Websocket inspector"
      subtitle={`${conn.url} · ${conn.protocol}`}
      size="xl"
    >
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">connection</span>
        <div className="flex gap-1">
          {WS_CONNECTIONS.map((c) => (
            <ToggleChip
              key={c.id}
              active={c.id === connId}
              onClick={() => {
                setConnId(c.id);
                setSelectedFrameId(null);
              }}
            >
              {c.url.split('/').pop()}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">kind</span>
        <div className="flex gap-1">
          {ALL_KINDS.map((k) => (
            <ToggleChip
              key={k}
              active={activeKinds.has(k)}
              onClick={() => {
                setActiveKinds((prev) => {
                  const next = new Set(prev);
                  if (next.has(k)) next.delete(k);
                  else next.add(k);
                  return next;
                });
              }}
            >
              {k}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">dir</span>
        <div className="flex gap-1">
          {(['all', 'in', 'out'] as const).map((d) => (
            <ToggleChip key={d} active={d === dir} onClick={() => setDir(d)}>
              {d}
            </ToggleChip>
          ))}
        </div>
        <Chip tone={statusTone(conn.status)} size="sm" className="ml-auto">
          {conn.status}
        </Chip>
        <Chip tone="muted" size="sm">{conn.pingMs}ms</Chip>
      </div>

      <div className="grid grid-cols-[1fr_300px]">
        <div>
          <div className="p-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              timeline (last 60s)
            </div>
            <Timeline frames={frames} onSelect={setSelectedFrameId} selectedId={selectedFrame?.id ?? null} />
          </div>

          <div className="px-3 pb-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              frames ({frames.length})
            </div>
            <ScrollArea className="max-h-[260px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-bg-subtle">
                  <tr className="text-left text-[10px] uppercase tracking-caps text-ink-3">
                    <th className="px-2 py-1">dir</th>
                    <th className="px-2 py-1">kind</th>
                    <th className="px-2 py-1">size</th>
                    <th className="px-2 py-1">ts</th>
                    <th className="px-2 py-1">payload</th>
                  </tr>
                </thead>
                <tbody>
                  {frames.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedFrameId(f.id)}
                      className={cn(
                        'cursor-pointer border-t border-line/60 hover:bg-bg-hover',
                        f.id === (selectedFrame?.id ?? null) && 'bg-bg-selected',
                      )}
                    >
                      <td className="px-2 py-1">
                        <Chip tone={f.direction === 'in' ? 'info' : 'static'} size="xs">
                          {f.direction === 'in' ? '←' : '→'}
                        </Chip>
                      </td>
                      <td className="px-2 py-1">
                        <Chip tone={frameKindTone(f.kind)} size="xs">
                          {f.kind}
                        </Chip>
                      </td>
                      <td className="px-2 py-1 font-mono text-[11px] text-ink-2">{f.size}B</td>
                      <td className="px-2 py-1 font-mono text-[11px] text-ink-3">
                        +{(f.ts / 1000).toFixed(1)}s
                      </td>
                      <td className="px-2 py-1 truncate font-mono text-[11px] text-ink-1">
                        {f.payloadPreview}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>

        <div className="hairline-l">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                frame detail
              </div>
              {selectedFrame ? (
                <>
                  <div className="mb-2 flex flex-wrap gap-1">
                    <Chip tone={frameKindTone(selectedFrame.kind)} size="xs">
                      {selectedFrame.kind}
                    </Chip>
                    <Chip tone={selectedFrame.direction === 'in' ? 'info' : 'static'} size="xs">
                      {selectedFrame.direction}
                    </Chip>
                    <Chip tone="muted" size="xs">{selectedFrame.size}B</Chip>
                    {selectedFrame.latencyMs !== undefined ? (
                      <Chip tone="accent" size="xs">{selectedFrame.latencyMs}ms RTT</Chip>
                    ) : null}
                  </div>
                  <CodeBlock
                    code={selectedFrame.payload}
                    language="json"
                    showLineNumbers={false}
                    maxHeight={200}
                  />
                  {selectedFrame.roomId ? (
                    <div className="mt-2 text-[11px] text-ink-2">
                      <span className="text-ink-3">room:</span>{' '}
                      <span className="font-mono">{selectedFrame.roomId}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-[11px] text-ink-3">No frame selected</div>
              )}

              <div className="mt-4 mb-1 text-[10px] uppercase tracking-caps text-ink-3">rooms</div>
              <ul className="space-y-1.5">
                {WS_ROOMS.map((r) => (
                  <li key={r.id} className="rounded-sm border border-line bg-bg p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-ink-1">{r.name}</span>
                      <Chip tone="muted" size="xs">{r.members.length}</Chip>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.members.map((m) => (
                        <Chip key={m} tone="hint" size="xs">{m}</Chip>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        </div>
      </div>
    </OverlayPanel>
  );
}

function Timeline({
  frames,
  onSelect,
  selectedId,
}: {
  frames: ReadonlyArray<WSFrame>;
  onSelect(id: string): void;
  selectedId: string | null;
}) {
  const W = 880;
  const H = 80;
  const totalMs = 60_000;
  if (frames.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-sm border border-dashed border-line bg-bg-subtle/30 text-[11px] text-ink-3">
        No frames match filters
      </div>
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="rounded-sm border border-line bg-bg">
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#e6e8eb" />
      {[0, 10, 20, 30, 40, 50, 60].map((sec) => (
        <g key={sec}>
          <line x1={(sec / 60) * W} y1={H / 2 - 4} x2={(sec / 60) * W} y2={H / 2 + 4} stroke="#cbd0d6" />
          <text x={(sec / 60) * W + 2} y={H - 4} fill="#9aa1ab" fontSize="9" fontFamily="system-ui">
            {sec}s
          </text>
        </g>
      ))}
      {frames.map((f) => {
        const x = Math.min((f.ts / totalMs) * W, W - 4);
        const y = f.direction === 'in' ? 10 : H / 2 + 8;
        const color =
          f.kind === 'text'
            ? f.direction === 'in'
              ? '#1d6dfd'
              : '#1f9d55'
            : f.kind === 'binary'
              ? '#9333ea'
              : f.kind === 'ping' || f.kind === 'pong'
                ? '#9aa1ab'
                : '#dc2626';
        const h = Math.max(6, Math.min(20, f.size / 100));
        const isSel = f.id === selectedId;
        return (
          <g key={f.id} className="cursor-pointer" onClick={() => onSelect(f.id)}>
            <title>{`${f.kind} ${f.direction} ${f.size}B · +${(f.ts / 1000).toFixed(1)}s`}</title>
            <rect
              x={x - 2}
              y={y}
              width="4"
              height={h}
              fill={color}
              stroke={isSel ? '#1d6dfd' : 'none'}
              strokeWidth={isSel ? 1.5 : 0}
            />
          </g>
        );
      })}
    </svg>
  );
}
