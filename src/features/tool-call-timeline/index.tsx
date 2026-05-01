import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  TOOL_CALLS,
  TOOL_KINDS,
  statusTone,
  toolColor,
  totalToolMs,
  totalWallMs,
  type ToolCall,
  type ToolKind,
} from './helpers';

const ROW_HEIGHT = 26;
const LANE_LABEL_W = 64;
const SVG_HEIGHT = TOOL_KINDS.length * ROW_HEIGHT + 36;

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function ToolCallTimelineOverlay() {
  const open = useUiStore((s) => s.overlays.toolCallTimeline.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [activeTools, setActiveTools] = useState<ReadonlyArray<ToolKind>>([]);
  const [selectedId, setSelectedId] = useState<string>(TOOL_CALLS[0]?.id ?? '');

  const wall = useMemo(() => totalWallMs(TOOL_CALLS), []);
  const tot = useMemo(() => totalToolMs(TOOL_CALLS), []);
  const parallelism = wall === 0 ? 0 : Math.min(1, tot / wall);

  const filtered = useMemo<ReadonlyArray<ToolCall>>(() => {
    const q = search.trim().toLowerCase();
    return TOOL_CALLS.filter((c) => {
      if (activeTools.length > 0 && !activeTools.includes(c.tool)) return false;
      if (
        q &&
        !c.args.toLowerCase().includes(q) &&
        !c.tool.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [search, activeTools]);

  const selected = useMemo(
    () =>
      TOOL_CALLS.find((c) => c.id === selectedId) ??
      filtered[0] ??
      TOOL_CALLS[0] ??
      null,
    [selectedId, filtered],
  );

  // approximate inner width minus right rail
  const innerW = 1100 - 300 - 16;
  const plotW = innerW - LANE_LABEL_W;
  const xOf = (ms: number): number =>
    plotW <= 0 ? 0 : LANE_LABEL_W + (ms / Math.max(wall, 1)) * plotW;
  const wOf = (ms: number): number =>
    plotW <= 0 ? 1 : Math.max(2, (ms / Math.max(wall, 1)) * plotW);

  const tickStep = wall <= 10_000 ? 1_000 : wall <= 30_000 ? 5_000 : 10_000;
  const ticks: number[] = [];
  for (let t = 0; t <= wall; t += tickStep) ticks.push(t);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('toolCallTimeline'))}
      title="Tool Call Timeline"
      subtitle={`Run · ${TOOL_CALLS.length} calls · wall ${fmtMs(wall)}`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-ink-3">
              wall <span className="font-mono text-ink-1">{fmtMs(wall)}</span>
            </span>
            <span className="text-ink-3">
              tool-time <span className="font-mono text-ink-1">{fmtMs(tot)}</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-ink-3">parallelism</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.round(parallelism * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-ink-1">
                {(parallelism * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Trace exported (mock)')}
            >
              Export trace
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => close('toolCallTimeline')}
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        {/* Left: timeline + table */}
        <div className="min-w-0">
          <div className="px-3 pb-2 pt-3">
            <svg
              role="img"
              aria-label="Tool call swimlane timeline"
              width="100%"
              height={SVG_HEIGHT}
              viewBox={`0 0 ${innerW} ${SVG_HEIGHT}`}
              className="overflow-visible"
            >
              {TOOL_KINDS.map((tk, i) => {
                const y = i * ROW_HEIGHT + 24;
                return (
                  <g key={tk}>
                    <rect
                      x={LANE_LABEL_W}
                      y={y}
                      width={plotW}
                      height={ROW_HEIGHT - 2}
                      className={cn(i % 2 === 0 ? 'fill-bg' : 'fill-bg-subtle')}
                    />
                    <text
                      x={LANE_LABEL_W - 6}
                      y={y + (ROW_HEIGHT - 2) / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-ink-3 text-[10px] uppercase tracking-caps"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {tk}
                    </text>
                  </g>
                );
              })}
              {ticks.map((t) => (
                <g key={t}>
                  <line
                    x1={xOf(t)}
                    x2={xOf(t)}
                    y1={20}
                    y2={SVG_HEIGHT - 4}
                    className="stroke-line"
                    strokeDasharray="2 3"
                    strokeWidth={1}
                  />
                  <text
                    x={xOf(t)}
                    y={14}
                    textAnchor="middle"
                    className="fill-ink-3 text-[10px]"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {fmtMs(t)}
                  </text>
                </g>
              ))}
              {TOOL_CALLS.map((c) => {
                const lane = TOOL_KINDS.indexOf(c.tool);
                if (lane < 0) return null;
                const isSelected = c.id === selected?.id;
                const x = xOf(c.ts);
                const w = wOf(c.durationMs);
                const y = lane * ROW_HEIGHT + 24 + 2;
                const h = ROW_HEIGHT - 6;
                const dim =
                  activeTools.length > 0 && !activeTools.includes(c.tool);
                return (
                  <Tooltip
                    key={c.id}
                    content={
                      <div className="text-[11px]">
                        <div className="font-medium text-ink-1">
                          {c.tool} · {fmtMs(c.durationMs)}
                        </div>
                        <div className="font-mono text-ink-3">{c.args}</div>
                        <div className="text-ink-3">@{fmtMs(c.ts)}</div>
                      </div>
                    }
                  >
                    <g
                      onClick={() => setSelectedId(c.id)}
                      className="cursor-pointer"
                      opacity={dim ? 0.2 : 1}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={2}
                        className={cn(
                          toolColor(c.tool),
                          c.status === 'error' && 'fill-sev-err',
                          c.status === 'cancelled' && 'fill-line',
                        )}
                        opacity={isSelected ? 1 : 0.7}
                      />
                      {isSelected && (
                        <rect
                          x={x - 1}
                          y={y - 1}
                          width={w + 2}
                          height={h + 2}
                          rx={3}
                          className="fill-none stroke-ink-1"
                          strokeWidth={1.5}
                        />
                      )}
                    </g>
                  </Tooltip>
                );
              })}
            </svg>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-ink-3">
              {TOOL_KINDS.map((tk) => (
                <span key={tk} className="inline-flex items-center gap-1">
                  <svg width={12} height={8} className="overflow-visible">
                    <rect
                      x={0}
                      y={0}
                      width={12}
                      height={8}
                      rx={1}
                      className={toolColor(tk)}
                    />
                  </svg>
                  {tk}
                </span>
              ))}
            </div>
          </div>

          <PanelHeader>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="search args / tool…"
              className="w-44"
            />
            <span className="h-4 w-px bg-line" aria-hidden />
            {TOOL_KINDS.map((tk) => (
              <ToggleChip
                key={tk}
                active={activeTools.includes(tk)}
                onClick={() =>
                  setActiveTools((prev) =>
                    prev.includes(tk)
                      ? prev.filter((x) => x !== tk)
                      : [...prev, tk],
                  )
                }
              >
                {tk}
              </ToggleChip>
            ))}
            {activeTools.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTools([])}
                className="text-[10px] text-ink-3 hover:text-ink-1"
              >
                clear
              </button>
            )}
          </PanelHeader>

          <div className="max-h-[40vh] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
                <tr>
                  <th className="hairline-b px-2 py-1 text-left">@ms</th>
                  <th className="hairline-b px-2 py-1 text-left">tool</th>
                  <th className="hairline-b px-2 py-1 text-left">args</th>
                  <th className="hairline-b px-2 py-1 text-right">dur</th>
                  <th className="hairline-b px-2 py-1 text-left">status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isSel = c.id === selected?.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'cursor-pointer hover:bg-bg-hover',
                        isSel && 'bg-accent-soft/30',
                      )}
                    >
                      <td className="hairline-b px-2 py-0.5 font-mono text-[11px] text-ink-3">
                        {fmtMs(c.ts)}
                      </td>
                      <td className="hairline-b px-2 py-0.5">
                        <Chip tone="muted" size="xs">
                          {c.tool}
                        </Chip>
                      </td>
                      <td className="hairline-b max-w-0 truncate px-2 py-0.5 font-mono text-[11px] text-ink-1">
                        {c.args}
                      </td>
                      <td className="hairline-b px-2 py-0.5 text-right font-mono text-[11px] text-ink-2">
                        {fmtMs(c.durationMs)}
                      </td>
                      <td className="hairline-b px-2 py-0.5">
                        <Chip tone={statusTone(c.status)} size="xs">
                          {c.status}
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-[11px] text-ink-3"
                    >
                      No calls match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right rail */}
        <aside className="min-w-0 px-3 py-3">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-caps text-ink-3">Call detail</h3>
                <Chip tone={statusTone(selected.status)} size="xs">
                  {selected.status}
                </Chip>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Chip tone="muted" size="xs">
                  {selected.tool}
                </Chip>
                <span className="font-mono text-[11px] text-ink-3">
                  @{fmtMs(selected.ts)}
                </span>
                <span className="ml-auto font-mono text-[11px] text-ink-1">
                  {fmtMs(selected.durationMs)}
                </span>
              </div>

              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  args
                </div>
                <CodeBlock
                  code={selected.args}
                  showLineNumbers={false}
                  maxHeight={64}
                />
              </div>
              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  output
                </div>
                <CodeBlock
                  code={selected.output}
                  showLineNumbers={false}
                  maxHeight={160}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Replaying ${selected.id}`)}
                >
                  Replay
                </Button>
                <Button
                  size="xs"
                  tone="soft"
                  onClick={() =>
                    toast(`Cancelled similar (${selected.tool}) calls`)
                  }
                >
                  Cancel similar
                </Button>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-ink-3">Select a call to inspect.</div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
