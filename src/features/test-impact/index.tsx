import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  affectedTests,
  changedFiles,
  fmtMs,
  impactedRuntimeMs,
  tests,
  totalRuntimeMs,
  type TestKind,
} from './helpers';

const KIND_TONE: Record<TestKind, 'accent' | 'info' | 'warn'> = {
  unit: 'accent',
  integration: 'info',
  e2e: 'warn',
};

const RESULT_TONE: Record<string, 'static' | 'err' | 'warn' | 'muted'> = {
  pass: 'static',
  fail: 'err',
  flaky: 'warn',
  skipped: 'muted',
};

export function TestImpactOverlay() {
  const open = useUiStore((s) => s.overlays.testImpact.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeFiles, setActiveFiles] = useState<ReadonlyArray<string>>(changedFiles);

  const impacts = useMemo(
    () => affectedTests(activeFiles, tests),
    [activeFiles],
  );

  const fullSuiteMs = useMemo(() => totalRuntimeMs(tests), []);
  const impactedMs = impactedRuntimeMs(impacts);
  const savedMs = Math.max(0, fullSuiteMs - impactedMs);

  const toggleFile = (f: string) => {
    setActiveFiles((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  };

  // Build graph layout
  const leftNodes = activeFiles.map((f, i) => ({
    file: f,
    x: 30,
    y: 40 + i * 56,
  }));
  const rightNodes = impacts.map((r, i) => ({
    id: r.test.id,
    name: r.test.name,
    file: r.test.file,
    deps: r.test.deps,
    x: 760,
    y: 40 + i * 28,
  }));
  const edges: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; reason: string }> = [];
  for (const rn of rightNodes) {
    for (const ln of leftNodes) {
      if (rn.deps.includes(ln.file)) {
        edges.push({
          from: { x: ln.x + 200, y: ln.y + 12 },
          to: { x: rn.x, y: rn.y + 8 },
          reason: `${rn.name} depends on ${ln.file}`,
        });
      }
    }
  }
  const graphHeight = Math.max(
    leftNodes.length * 56 + 60,
    rightNodes.length * 28 + 60,
    220,
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('testImpact'))}
      title="Test Impact"
      subtitle="Which tests does this change break?"
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            Saves <span className="text-ink-1 font-medium">{fmtMs(savedMs)}</span> vs full suite (
            {fmtMs(fullSuiteMs)})
          </span>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Generated test plan (mock)')}
          >
            Generate test plan
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() =>
              toast(`Run ${impacts.length} impacted tests (~${fmtMs(impactedMs)})`)
            }
          >
            Run impacted (mock)
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Changed</span>
        <div className="inline-flex flex-wrap items-center gap-1">
          {changedFiles.map((f) => {
            const active = activeFiles.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggleFile(f)}
                aria-pressed={active}
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-[11px] font-mono',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-3 hover:bg-bg-hover',
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-[11px] text-ink-3">
          {impacts.length} impacted of {tests.length}
        </span>
      </div>

      <div className="px-3 py-3">
        <div className="rounded-sm border border-line bg-bg-subtle/30 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">
              Dependency graph
            </span>
            <span className="text-[10px] text-ink-3">
              {leftNodes.length} files → {rightNodes.length} tests
            </span>
          </div>
          {rightNodes.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-3">
              No tests impacted. Pick a changed file.
            </div>
          ) : (
            <svg
              width="100%"
              viewBox={`0 0 1000 ${graphHeight}`}
              height={graphHeight}
              className="block"
            >
              {edges.map((e, i) => (
                <g key={i}>
                  <title>{e.reason}</title>
                  <path
                    d={`M ${e.from.x} ${e.from.y} C ${e.from.x + 80} ${e.from.y}, ${e.to.x - 80} ${e.to.y}, ${e.to.x} ${e.to.y}`}
                    stroke="hsl(var(--accent))"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                    fill="none"
                  />
                </g>
              ))}
              {leftNodes.map((n) => (
                <g key={n.file} transform={`translate(${n.x},${n.y})`}>
                  <rect
                    width="200"
                    height="24"
                    rx="3"
                    fill="hsl(var(--accent-soft))"
                    stroke="hsl(var(--accent))"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y="16"
                    fontSize="10"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    fill="hsl(var(--accent))"
                  >
                    {n.file.length > 28 ? `…${n.file.slice(-27)}` : n.file}
                  </text>
                </g>
              ))}
              {rightNodes.map((n) => (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                  <rect
                    width="220"
                    height="16"
                    rx="2"
                    fill="hsl(var(--bg))"
                    stroke="hsl(var(--border))"
                  />
                  <text
                    x="6"
                    y="11"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    fill="hsl(var(--ink-1))"
                  >
                    {n.name.length > 32 ? `${n.name.slice(0, 31)}…` : n.name}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-sm border border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
                <th className="px-2 py-1 text-left">Test</th>
                <th className="px-2 py-1 text-left">Kind</th>
                <th className="px-2 py-1 text-right">Runtime</th>
                <th className="px-2 py-1 text-left">Last</th>
                <th className="px-2 py-1 text-left">Impact</th>
                <th className="px-2 py-1 text-right" />
              </tr>
            </thead>
            <tbody>
              {impacts.map((r) => (
                <tr
                  key={r.test.id}
                  className="border-t border-line/60 hover:bg-bg-hover"
                >
                  <td className="px-2 py-1">
                    <div className="text-ink-1">{r.test.name}</div>
                    <div className="font-mono text-[10px] text-ink-3">
                      {r.test.file}
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <Chip tone={KIND_TONE[r.test.kind]} size="xs">
                      {r.test.kind}
                    </Chip>
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-ink-2">
                    {fmtMs(r.test.avgRuntimeMs)}
                  </td>
                  <td className="px-2 py-1">
                    <Chip tone={RESULT_TONE[r.test.lastResult] ?? 'muted'} size="xs">
                      {r.test.lastResult}
                    </Chip>
                  </td>
                  <td className="px-2 py-1">
                    <Tooltip content={r.reasons.join(' · ')}>
                      <span
                        className={cn(
                          'inline-flex h-4 items-center rounded-sm border px-1 text-[10px]',
                          r.impactScore >= 3
                            ? 'border-sev-err/30 bg-sev-err-soft text-sev-err'
                            : r.impactScore >= 2
                              ? 'border-sev-warn/30 bg-sev-warn-soft text-sev-warn'
                              : 'border-line bg-bg-subtle text-ink-2',
                        )}
                      >
                        score {r.impactScore}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-2 py-1 text-right">
                    <Button
                      size="xs"
                      tone="ghost"
                      onClick={() => toast(`Run only "${r.test.name}"`)}
                    >
                      Run only
                    </Button>
                  </td>
                </tr>
              ))}
              {impacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-ink-3">
                    No impacted tests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </OverlayPanel>
  );
}
