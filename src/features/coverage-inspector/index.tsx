import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  fileCoverages,
  fileCoveredPct,
  lineState,
  type FileCoverage,
  type LineHit,
} from './helpers';

function StackBar({ pct }: { pct: number }) {
  return (
    <span className="relative inline-block h-1 w-full overflow-hidden rounded-full bg-sev-err-soft">
      <span
        className="absolute left-0 top-0 h-full bg-sem-static"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

function GutterDot({ l }: { l: LineHit }) {
  const st = lineState(l);
  if (st === 'blank') return <span className="inline-block h-2 w-2" aria-hidden />;
  const cls =
    st === 'covered'
      ? 'bg-sem-static'
      : st === 'partial'
        ? 'bg-sev-warn'
        : 'bg-sev-err';
  return <span className={cn('inline-block h-2 w-2 rounded-full', cls)} />;
}

function RadialArc({
  pct,
  label,
  cx,
  cy,
  r,
}: {
  pct: number;
  label: string;
  cx: number;
  cy: number;
  r: number;
}) {
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;
  const tone =
    pct >= 90
      ? 'hsl(var(--sem-static))'
      : pct >= 75
        ? 'hsl(var(--info))'
        : pct >= 50
          ? 'hsl(var(--warn))'
          : 'hsl(var(--err))';
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r={r} fill="none" stroke="hsl(var(--bg-subtle))" strokeWidth="6" />
      <circle
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth="6"
        strokeDasharray={`${dash} ${C}`}
        strokeLinecap="round"
        transform="rotate(-90)"
      />
      <text
        textAnchor="middle"
        y="3"
        fontSize="11"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        fill="hsl(var(--ink-1))"
      >
        {pct}%
      </text>
      <text
        textAnchor="middle"
        y={r + 14}
        fontSize="9"
        fill="hsl(var(--ink-3))"
      >
        {label}
      </text>
    </g>
  );
}

export function CoverageInspectorOverlay() {
  const open = useUiStore((s) => s.overlays.coverageInspector.open);
  const requestedFile = useUiStore((s) => s.overlays.coverageInspector.file);
  const close = useUiStore((s) => s.closeOverlay);

  const sorted = useMemo(
    () => [...fileCoverages].sort((a, b) => fileCoveredPct(a) - fileCoveredPct(b)),
    [],
  );

  const [activeFile, setActiveFile] = useState<string>(
    requestedFile ?? sorted[0]?.file ?? '',
  );
  const active: FileCoverage | undefined = fileCoverages.find(
    (f) => f.file === activeFile,
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('coverageInspector'))}
      title="Coverage Inspector"
      subtitle={active?.file}
      size="md"
      footer={
        <Button
          size="xs"
          tone="accent"
          onClick={() =>
            toast(
              active
                ? `Suggest tests for uncovered lines in ${active.file}`
                : 'Suggest tests for uncovered',
            )
          }
        >
          Suggest tests for uncovered
        </Button>
      }
    >
      <div className="flex">
        <aside
          className="hairline-r bg-bg-subtle/40 py-2"
          style={{ width: 240 }}
        >
          <div className="px-3 pb-1 text-[10px] uppercase tracking-caps text-ink-3">
            Files (sorted asc)
          </div>
          <ul>
            {sorted.map((f) => {
              const pct = fileCoveredPct(f);
              const sel = f.file === active?.file;
              return (
                <li key={f.file}>
                  <button
                    onClick={() => setActiveFile(f.file)}
                    className={cn(
                      'block w-full px-3 py-1.5 text-left hover:bg-bg-hover',
                      sel && 'bg-bg-selected',
                    )}
                  >
                    <div className="truncate font-mono text-[11px] text-ink-1">
                      {f.file}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StackBar pct={pct} />
                      <span className="font-mono text-[10px] text-ink-3 w-9 text-right">
                        {pct}%
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-3">
          {active ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 180px' }}>
              <div className="overflow-hidden rounded-sm border border-line bg-bg">
                <div className="hairline-b bg-bg-subtle px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
                  {active.file}
                </div>
                <pre className="overflow-auto font-mono text-[11px] leading-[18px]">
                  <code className="block">
                    {active.lines.map((l) => {
                      const st = lineState(l);
                      const weak =
                        l.branchTotal > 0 && l.branchCovered < l.branchTotal;
                      return (
                        <Tooltip
                          key={l.line}
                          content={
                            <div className="space-y-0.5">
                              <div>
                                hits: <span className="font-mono">{l.hits}</span>
                              </div>
                              <div>
                                branches:{' '}
                                <span className="font-mono">
                                  {l.branchCovered}/{l.branchTotal}
                                </span>
                              </div>
                            </div>
                          }
                        >
                          <div
                            className={cn(
                              'flex min-h-[18px] items-start whitespace-pre hover:bg-bg-hover',
                              st === 'uncovered' && 'bg-sev-err-soft/30',
                              st === 'partial' && 'bg-sev-warn-soft/30',
                            )}
                          >
                            <span
                              aria-hidden
                              className="sticky left-0 inline-flex w-12 select-none items-center justify-end gap-1 border-r border-line bg-bg-subtle px-1 text-right text-ink-3"
                            >
                              <GutterDot l={l} />
                              <span>{l.line}</span>
                            </span>
                            <span className="flex-1 px-2 text-ink-1">
                              {l.text || ' '}
                            </span>
                            {weak && (
                              <span className="mr-1 inline-flex h-4 items-center rounded-sm bg-sev-warn-soft px-1 text-[9px] text-sev-warn">
                                weak
                              </span>
                            )}
                            <span className="mr-1 inline-flex w-8 justify-end font-mono text-[9px] text-ink-3">
                              {l.hits > 0 ? `×${l.hits}` : ''}
                            </span>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </code>
                </pre>
              </div>

              <div className="rounded-sm border border-line bg-bg p-2">
                <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                  Summary
                </div>
                <svg viewBox="0 0 180 220" className="block w-full">
                  <RadialArc
                    pct={active.summary.statements}
                    label="stmts"
                    cx={45}
                    cy={45}
                    r={26}
                  />
                  <RadialArc
                    pct={active.summary.branches}
                    label="branches"
                    cx={135}
                    cy={45}
                    r={26}
                  />
                  <RadialArc
                    pct={active.summary.functions}
                    label="funcs"
                    cx={45}
                    cy={155}
                    r={26}
                  />
                  <RadialArc
                    pct={active.summary.lines}
                    label="lines"
                    cx={135}
                    cy={155}
                    r={26}
                  />
                </svg>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-ink-3">
              No file selected.
            </div>
          )}
        </div>
      </div>
    </OverlayPanel>
  );
}
