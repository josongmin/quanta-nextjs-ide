import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useBoundaryStore } from '@entities/boundary';
import { useSemanticDiffStore } from '@entities/semantic-diff';
import { Chip, Inspector, Section } from '@shared/ui';
import type { CostClass, SemanticDiffEntry } from '@shared/types';
import { cn } from '@shared/lib/cn';
import {
  useRunnerStore,
  useBuildStatus,
  useTypeCheckStatus,
  useLintStatus,
  useTestStatus,
  useDeployRiskScore,
} from '@shared/runner';
import { EmptyState, KvRow } from '../parts';

const COST_CLASSES: CostClass[] = ['A', 'B', 'C', 'D', 'E'];

const COST_BAR_BG: Record<CostClass, string> = {
  A: 'bg-sem-static',
  B: 'bg-ink-2',
  C: 'bg-sem-isr',
  D: 'bg-sev-warn',
  E: 'bg-sev-err',
};

const COST_TEXT: Record<CostClass, string> = {
  A: 'text-sem-static',
  B: 'text-ink-2',
  C: 'text-sem-isr',
  D: 'text-sev-warn',
  E: 'text-sev-err',
};

interface Hotspot {
  label: string;
  detail: string;
}

const SEMANTIC_DIFF_CATEGORIES: SemanticDiffEntry['category'][] = [
  'rendering',
  'cache',
  'boundary',
  'auth',
  'contract',
  'metadata',
  'cost',
];

export function ProjectHealthInspector() {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const routes = useRouteStore((s) => s.routes);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const islands = useBoundaryStore((s) => s.islands);
  const layouts = useBoundaryStore((s) => s.layouts);
  const diff = useSemanticDiffStore((s) => s.diff);

  // Live deploy readiness signals (Phase 3 — runner-driven).
  const ensureWired = useRunnerStore((s) => s.ensureWired);
  const startByLabel = useRunnerStore((s) => s.startByLabel);
  const build = useBuildStatus();
  const typecheck = useTypeCheckStatus();
  const lint = useLintStatus();
  const test = useTestStatus();
  const riskScore = useDeployRiskScore();
  useEffect(() => {
    void ensureWired();
  }, [ensureWired]);

  const riskBand: 'good' | 'warn' | 'err' =
    riskScore >= 50 ? 'err' : riskScore >= 10 ? 'warn' : 'good';

  const total = routes.length;
  const staticIsr = routes.filter(
    (r) => r.rendering === 'static' || r.rendering === 'isr',
  ).length;
  const dynamic = routes.filter((r) => r.rendering === 'dynamic').length;
  const unknown = routes.filter((r) => r.rendering === 'unknown').length;

  const costCounts: Record<CostClass, number> = COST_CLASSES.reduce(
    (acc, c) => {
      acc[c] = routes.filter((r) => r.costClass === c).length;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0, E: 0 } as Record<CostClass, number>,
  );
  const costTotal = COST_CLASSES.reduce((sum, c) => sum + costCounts[c], 0);

  const high = diagnostics.filter((d) => d.severity === 'err').length;
  const medium = diagnostics.filter((d) => d.severity === 'warn').length;
  const low = diagnostics.filter(
    (d) => d.severity === 'hint' || d.severity === 'info',
  ).length;

  // Hotspots (mock derivation)
  const layoutHotspots: Hotspot[] = layouts
    .slice()
    .sort((a, b) => b.affectedRouteCount - a.affectedRouteCount)
    .slice(0, 2)
    .map((l) => ({
      label: l.file,
      detail: `affects ${l.affectedRouteCount} routes`,
    }));
  const islandHotspots: Hotspot[] = islands
    .filter((i) => i.excessive)
    .slice()
    .sort((a, b) => b.estimatedKb - a.estimatedKb)
    .slice(0, 2)
    .map((i) => ({
      label: i.file,
      detail: `client boundary ${i.affectedRouteIds.length} files (~${i.estimatedKb}KB)`,
    }));
  const hotspots: Hotspot[] = [...layoutHotspots, ...islandHotspots].slice(0, 5);

  const diffByCategory: Record<SemanticDiffEntry['category'], number> =
    SEMANTIC_DIFF_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = diff.entries.filter((e) => e.category === cat).length;
        return acc;
      },
      {
        rendering: 0,
        cache: 0,
        boundary: 0,
        auth: 0,
        contract: 0,
        metadata: 0,
        cost: 0,
      } as Record<SemanticDiffEntry['category'], number>,
    );
  const diffEntries = SEMANTIC_DIFF_CATEGORIES.filter(
    (c) => diffByCategory[c] > 0,
  );

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">
            PROJECT
          </span>
          <span className="font-mono text-sm text-ink-1">health snapshot</span>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          {total} routes · {islands.length} islands · {diagnostics.length} risks
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Deploy readiness (live runner) -------------------------------- */}
      <Section title="Deploy readiness" defaultOpen>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-caps text-[11px] uppercase text-ink-3">
              Risk score
            </span>
            <Chip
              size="xs"
              tone={riskBand === 'err' ? 'err' : riskBand === 'warn' ? 'warn' : 'static'}
            >
              <span className="font-mono">{riskScore}</span>
            </Chip>
          </div>
          <div className="space-y-0">
            <ReadinessRow
              label="Build"
              state={build?.state}
              detail={
                build?.durationMs != null && build.state === 'succeeded'
                  ? `${(build.durationMs / 1000).toFixed(1)}s`
                  : build?.state === 'failed'
                    ? 'failed'
                    : '—'
              }
              onRun={() => startByLabel('build')}
            />
            <ReadinessRow
              label="TypeCheck"
              state={typecheck?.state}
              detail={
                typecheck?.typecheckErrors
                  ? `${typecheck.typecheckErrors} errors`
                  : typecheck?.state === 'succeeded'
                    ? 'clean'
                    : '—'
              }
              onRun={() => startByLabel('typecheck')}
            />
            <ReadinessRow
              label="Lint"
              state={lint?.state}
              detail={
                lint?.lintErrors || lint?.lintWarnings
                  ? `${lint.lintErrors ?? 0} err · ${lint.lintWarnings ?? 0} warn`
                  : lint?.state === 'succeeded'
                    ? 'clean'
                    : '—'
              }
              onRun={() => startByLabel('lint')}
            />
            <ReadinessRow
              label="Tests"
              state={test?.state}
              detail={
                test?.testsPassed != null || test?.testsFailed
                  ? `${test.testsPassed ?? 0} ✓ / ${test.testsFailed ?? 0} ✗`
                  : '—'
              }
              onRun={() => startByLabel('test')}
            />
          </div>
        </div>
      </Section>

      {/* Routes -------------------------------------------------------- */}
      <Section title="Routes" defaultOpen>
        <div className="space-y-0">
          <KvRow label="Total">
            <span className="font-mono text-xs text-ink-2">{total}</span>
          </KvRow>
          <KvRow label="Static/ISR">
            <span className="font-mono text-xs text-sem-static">{staticIsr}</span>
          </KvRow>
          <KvRow label="Dynamic">
            <span className="font-mono text-xs text-sem-dynamic">{dynamic}</span>
          </KvRow>
          <KvRow label="Unknown">
            <span className="font-mono text-xs text-ink-3">{unknown}</span>
          </KvRow>
        </div>
      </Section>

      {/* Cost classes -------------------------------------------------- */}
      <Section title="Cost classes" defaultOpen>
        <div className="space-y-2">
          <div className="flex h-2 w-full overflow-hidden rounded-sm border border-line bg-bg-subtle">
            {COST_CLASSES.map((c) => {
              const pct = costTotal > 0 ? (costCounts[c] / costTotal) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={c}
                  className={cn('h-full', COST_BAR_BG[c])}
                  style={{ width: `${pct}%` }}
                  title={`${c}: ${costCounts[c]}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {COST_CLASSES.map((c) => (
              <span
                key={c}
                className={cn(
                  'inline-flex items-center gap-1 font-mono',
                  COST_TEXT[c],
                )}
              >
                <span className="font-semibold">{c}</span>
                <span className="text-ink-3">{costCounts[c]}</span>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Risks --------------------------------------------------------- */}
      <Section title="Risks (by severity)" defaultOpen>
        <div className="space-y-0">
          <div className="grid min-h-[28px] grid-cols-[80px_1fr_auto] items-center gap-2 py-0.5 text-xs">
            <span className="text-caps text-[11px] uppercase text-sev-err">
              High
            </span>
            <span className="font-mono text-ink-2">err</span>
            <span className="font-mono text-sev-err">{high}</span>
          </div>
          <div className="grid min-h-[28px] grid-cols-[80px_1fr_auto] items-center gap-2 py-0.5 text-xs">
            <span className="text-caps text-[11px] uppercase text-sev-warn">
              Med
            </span>
            <span className="font-mono text-ink-2">warn</span>
            <span className="font-mono text-sev-warn">{medium}</span>
          </div>
          <div className="grid min-h-[28px] grid-cols-[80px_1fr_auto] items-center gap-2 py-0.5 text-xs">
            <span className="text-caps text-[11px] uppercase text-sev-hint">
              Low
            </span>
            <span className="font-mono text-ink-2">hint/info</span>
            <span className="font-mono text-sev-hint">{low}</span>
          </div>
        </div>
      </Section>

      {/* Hotspots ------------------------------------------------------ */}
      <Section title="Hotspots" defaultOpen={false}>
        {hotspots.length === 0 ? (
          <EmptyState>No hotspots detected.</EmptyState>
        ) : (
          <ol className="space-y-0.5 text-xs">
            {hotspots.map((h, i) => (
              <li
                key={h.label}
                className="grid min-h-[28px] grid-cols-[16px_1fr_auto] items-center gap-2 py-0.5"
              >
                <span className="font-mono text-ink-3">{i + 1}.</span>
                <span className="truncate font-mono text-ink-2">{h.label}</span>
                <span className="text-ink-3">{h.detail}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Cost regression (this branch) -------------------------------- */}
      <Section
        title={
          <span className="inline-flex items-center gap-1.5">
            <span>Cost regression</span>
            <Chip size="xs" tone="muted">
              <span className="font-mono">
                {diff.base} → {diff.head}
              </span>
            </Chip>
          </span>
        }
        defaultOpen={false}
      >
        {diffEntries.length === 0 ? (
          <EmptyState>No semantic changes detected.</EmptyState>
        ) : (
          <div className="space-y-0">
            {diffEntries.map((cat) => (
              <div
                key={cat}
                className="grid min-h-[28px] grid-cols-[100px_1fr_auto] items-center gap-2 py-0.5 text-xs"
              >
                <span className="text-caps text-[11px] uppercase text-ink-3">
                  {cat}
                </span>
                <span className="text-ink-2">
                  {diffByCategory[cat]} change
                  {diffByCategory[cat] === 1 ? '' : 's'}
                </span>
                <Chip size="xs" tone="muted">
                  {diffByCategory[cat]}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Inspector>
  );
}

function ReadinessRow(props: {
  label: string;
  state: 'running' | 'succeeded' | 'failed' | 'stopped' | undefined;
  detail: string;
  onRun: () => void;
}) {
  const { label, state, detail, onRun } = props;
  const dot =
    state === 'succeeded'
      ? 'bg-sem-static'
      : state === 'failed'
        ? 'bg-sev-err'
        : state === 'running'
          ? 'bg-accent animate-pulse'
          : 'bg-ink-3/40';
  return (
    <div className="grid min-h-[28px] grid-cols-[14px_80px_1fr_auto] items-center gap-2 py-0.5 text-xs">
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      <span className="text-caps text-[11px] uppercase text-ink-3">{label}</span>
      <span className="font-mono text-ink-2">{detail}</span>
      <button
        type="button"
        onClick={onRun}
        className="text-[11px] text-accent hover:underline disabled:opacity-50"
        disabled={state === 'running'}
      >
        {state === 'running' ? 'running…' : 'run'}
      </button>
    </div>
  );
}
