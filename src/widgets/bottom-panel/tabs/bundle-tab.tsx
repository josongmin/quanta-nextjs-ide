import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  usePerformanceStore,
  type BundleSideFilter,
  type BundleUnit,
} from '@entities/performance';
import {
  analyzeClientModules,
  computeStreamMetrics,
  useLastTraceStore,
} from '@entities/rsc-payload';
import type { BundleNode, RouteVitals } from '@shared/types';
import { Button, Chip, ScrollArea } from '@shared/ui';
import {
  rateCls,
  rateInp,
  rateLcp,
  rateTtfb,
  type VitalRating,
} from '@shared/mocks/web-vitals';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { BundleTreemap } from '../parts/bundle-treemap';
import { WebVitalsDial } from '../parts/web-vitals-dial';
import { PerfBudgetRow } from '../parts/perf-budget-row';

type View = 'bundle' | 'vitals' | 'budget' | 'rsc';

const VIEWS: ReadonlyArray<{ key: View; label: string }> = [
  { key: 'bundle', label: 'Bundle' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'budget', label: 'Budget' },
  { key: 'rsc', label: 'RSC' },
];

const SIDE_OPTIONS: ReadonlyArray<{
  key: BundleSideFilter;
  label: string;
}> = [
  { key: 'client', label: 'client' },
  { key: 'server', label: 'server' },
  { key: 'shared', label: 'shared' },
];

const UNIT_OPTIONS: ReadonlyArray<{ key: BundleUnit; label: string }> = [
  { key: 'gzip', label: 'gzip' },
  { key: 'raw', label: 'raw' },
];

function formatSize(bytes: number, unit: BundleUnit): string {
  const factor = unit === 'raw' ? 3 : 1;
  const value = bytes * factor;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

function ratingToCellClass(rating: VitalRating): string {
  return match(rating)
    .with('good', () => 'text-sem-static')
    .with('needs-improvement', () => 'text-sev-warn')
    .with('poor', () => 'text-sev-err')
    .exhaustive();
}

export function BundleTab() {
  const bundle = usePerformanceStore((s) => s.bundle);
  const vitals = usePerformanceStore((s) => s.vitals);
  const budgets = usePerformanceStore((s) => s.budgets);
  const selectedNodeId = usePerformanceStore((s) => s.selectedNodeId);
  const setSelectedNodeId = usePerformanceStore((s) => s.setSelectedNodeId);
  const sideFilter = usePerformanceStore((s) => s.sideFilter);
  const setSideFilter = usePerformanceStore((s) => s.setSideFilter);
  const unit = usePerformanceStore((s) => s.unit);
  const setUnit = usePerformanceStore((s) => s.setUnit);
  const heaviestPackages = usePerformanceStore((s) => s.heaviestPackages);

  const routes = useRouteStore((s) => s.routes);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);

  const [view, setView] = useState<View>('bundle');

  const totalBytes = bundle.size;

  const sideRoot = useMemo<BundleNode | null>(() => {
    return bundle.children?.find((c) => c.side === sideFilter) ?? null;
  }, [bundle, sideFilter]);

  const selectedNode = useMemo<BundleNode | null>(() => {
    if (!selectedNodeId) return null;
    const stack: BundleNode[] = [bundle];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.id === selectedNodeId) return n;
      n.children?.forEach((c) => stack.push(c));
    }
    return null;
  }, [bundle, selectedNodeId]);

  const heaviest = useMemo(
    () =>
      heaviestPackages(8).filter((p) =>
        sideFilter === 'shared' ? true : p.side === sideFilter,
      ),
    [heaviestPackages, sideFilter],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      {/* Toolbar ----------------------------------------------------- */}
      <PanelHeader>
        <div className="inline-flex h-6 items-center rounded-sm border border-line bg-bg p-px">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              aria-selected={view === v.key}
              className={cn(
                'h-5 px-2 text-[11px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                view === v.key && 'rounded-sm bg-bg-selected text-ink-1',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="mx-1 h-4 w-px bg-line" aria-hidden />

        <span className="text-[11px] text-ink-3">side</span>
        {SIDE_OPTIONS.map((o) => (
          <ToggleChip
            key={o.key}
            active={sideFilter === o.key}
            onClick={() => setSideFilter(o.key)}
          >
            {o.label}
          </ToggleChip>
        ))}

        <div className="mx-1 h-4 w-px bg-line" aria-hidden />

        <span className="text-[11px] text-ink-3">unit</span>
        {UNIT_OPTIONS.map((o) => (
          <ToggleChip
            key={o.key}
            active={unit === o.key}
            onClick={() => setUnit(o.key)}
          >
            {o.label}
          </ToggleChip>
        ))}

        <div className="ml-auto flex items-center gap-2 text-[11px] text-ink-3">
          <span>Total:</span>
          <span className="font-mono text-ink-1">{formatSize(totalBytes, unit)}</span>
        </div>
      </PanelHeader>

      {/* Body --------------------------------------------------------- */}
      <ScrollArea className="flex-1">
        {match(view)
          .with('bundle', () => (
            <BundleView
              bundle={bundle}
              sideRoot={sideRoot}
              side={sideFilter}
              unit={unit}
              selectedNode={selectedNode}
              onSelect={(n) => setSelectedNodeId(n.id)}
              heaviest={heaviest}
              onShowReason={() =>
                toast('Why this package?', {
                  description:
                    'Reason traces to direct/transitive imports — open the Bundle Inspector for details.',
                })
              }
              onOpenInspector={() => setInspectorContext({ kind: 'bundle' })}
            />
          ))
          .with('vitals', () => (
            <VitalsView vitals={vitals} routes={routes} />
          ))
          .with('budget', () => (
            <BudgetView
              budgets={budgets}
              vitals={vitals}
              routes={routes}
              onOpen={() => setInspectorContext({ kind: 'bundle' })}
            />
          ))
          .with('rsc', () => <RscMetricsView />)
          .exhaustive()}
      </ScrollArea>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Bundle view
// -----------------------------------------------------------------------------

interface BundleViewProps {
  bundle: BundleNode;
  sideRoot: BundleNode | null;
  side: BundleSideFilter;
  unit: BundleUnit;
  selectedNode: BundleNode | null;
  onSelect(n: BundleNode): void;
  heaviest: BundleNode[];
  onShowReason(node: BundleNode): void;
  onOpenInspector(): void;
}

function BundleView({
  bundle,
  sideRoot,
  side,
  unit,
  selectedNode,
  onSelect,
  heaviest,
  onShowReason,
  onOpenInspector,
}: BundleViewProps) {
  if (!sideRoot) {
    return (
      <div className="px-3 py-6 text-center text-xs text-ink-3">
        No bundle data for this side.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_280px] gap-0">
      <div className="p-3">
        <BundleTreemap
          data={bundle}
          selected={selectedNode?.id ?? null}
          onSelect={onSelect}
          side={side}
          unit={unit}
          width={640}
          height={320}
        />
      </div>

      <div className="hairline-l p-3">
        <div className="space-y-3">
          {/* Heaviest packages list */}
          <section className="hairline rounded-sm bg-bg">
            <header className="flex items-center justify-between gap-2 px-3 py-1.5 hairline-b bg-bg-subtle">
              <span className="text-[10px] uppercase tracking-caps text-ink-3">
                Heaviest packages
              </span>
              <Button size="xs" tone="ghost" onClick={onOpenInspector}>
                Inspect
              </Button>
            </header>
            <ul>
              {heaviest.map((p) => {
                const isSelected = selectedNode?.id === p.id;
                return (
                  <li
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1 hairline-b last:border-b-0 hover:bg-bg-hover',
                      isSelected && 'bg-bg-selected',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(p)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate font-mono text-xs text-ink-1">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-ink-3">
                        {formatSize(p.size, unit)}
                        {p.routes && p.routes.length
                          ? ` · ${p.routes.length} route${p.routes.length === 1 ? '' : 's'}`
                          : ''}
                      </div>
                    </button>
                    <Button
                      size="xs"
                      tone="ghost"
                      onClick={() => onShowReason(p)}
                      aria-label={`Why ${p.name}?`}
                    >
                      Why?
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Selected node detail */}
          {selectedNode ? (
            <section className="hairline rounded-sm bg-bg">
              <header className="flex items-center justify-between gap-2 px-3 py-1.5 hairline-b bg-bg-subtle">
                <span className="truncate font-mono text-xs text-ink-1">
                  {selectedNode.name}
                </span>
                <Chip tone="muted" size="xs">
                  {selectedNode.kind}
                </Chip>
              </header>
              <div className="space-y-1 px-3 py-2 text-xs">
                <Row label="size" value={formatSize(selectedNode.size, unit)} />
                <Row label="side" value={selectedNode.side} />
                {selectedNode.children?.length ? (
                  <Row
                    label="children"
                    value={`${selectedNode.children.length}`}
                  />
                ) : null}
                {selectedNode.routes && selectedNode.routes.length > 0 ? (
                  <div className="pt-1">
                    <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                      Routes ({selectedNode.routes.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.routes.map((rid) => (
                        <Chip key={rid} size="xs" tone="muted">
                          {rid.replace(/^route_/, '')}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedNode.children?.length ? (
                  <div className="pt-1">
                    <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                      Siblings
                    </div>
                    <ul className="space-y-0.5">
                      {selectedNode.children.slice(0, 8).map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-2 font-mono text-[11px]"
                        >
                          <span className="truncate text-ink-2">{c.name}</span>
                          <span className="text-ink-3">
                            {formatSize(c.size, unit)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          ) : (
            <p className="px-1 text-xs text-ink-3">
              Click a tile to see details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
      <span className="text-ink-3">{label}</span>
      <span className="text-ink-2">{value}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Vitals view
// -----------------------------------------------------------------------------

interface VitalsViewProps {
  vitals: RouteVitals[];
  routes: ReturnType<typeof useRouteStore.getState>['routes'];
}

function median(values: number[]): number {
  const filtered = values.filter((v) => v > 0);
  if (filtered.length === 0) return 0;
  const sorted = [...filtered].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

function VitalsView({ vitals, routes }: VitalsViewProps) {
  const projectLcp = useMemo(
    () => median(vitals.map((v) => v.estimated.lcp)),
    [vitals],
  );
  const projectInp = useMemo(
    () => median(vitals.map((v) => v.estimated.inp)),
    [vitals],
  );
  const projectCls = useMemo(
    () => median(vitals.map((v) => v.estimated.cls)),
    [vitals],
  );

  return (
    <div className="space-y-3 p-3">
      <section className="hairline rounded-sm bg-bg">
        <header className="flex items-center justify-between gap-2 px-3 py-1.5 hairline-b bg-bg-subtle">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            Project medians
          </span>
          <span className="text-[10px] text-ink-3">
            across {vitals.length} routes
          </span>
        </header>
        <div className="flex items-center justify-around gap-3 px-3 py-3">
          <WebVitalsDial label="LCP" value={projectLcp} good={2500} poor={4000} />
          <WebVitalsDial label="INP" value={projectInp} good={200} poor={500} />
          <WebVitalsDial
            label="CLS"
            value={projectCls}
            good={0.1}
            poor={0.25}
            unit=""
            max={0.5}
            precision={2}
          />
        </div>
      </section>

      <section className="hairline rounded-sm bg-bg">
        <header className="flex items-center gap-2 px-3 py-1.5 hairline-b bg-bg-subtle">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            Per-route vitals
          </span>
        </header>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-bg-subtle/40">
            <tr className="hairline-b text-ink-3">
              <th className="px-3 py-1 text-left font-medium">route</th>
              <th className="px-3 py-1 text-right font-medium">LCP</th>
              <th className="px-3 py-1 text-right font-medium">INP</th>
              <th className="px-3 py-1 text-right font-medium">CLS</th>
              <th className="px-3 py-1 text-right font-medium">TTFB</th>
              <th className="px-3 py-1 text-right font-medium">conf</th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v) => {
              const route = routes.find((r) => r.id === v.routeId);
              return (
                <tr key={v.routeId} className="hairline-b last:border-b-0">
                  <td className="px-3 py-1 font-mono text-ink-1">
                    {route?.path ?? v.routeId}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-1 text-right font-mono',
                      ratingToCellClass(rateLcp(v.estimated.lcp)),
                    )}
                  >
                    {v.estimated.lcp ? `${Math.round(v.estimated.lcp)}ms` : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-1 text-right font-mono',
                      ratingToCellClass(rateInp(v.estimated.inp)),
                    )}
                  >
                    {v.estimated.inp ? `${Math.round(v.estimated.inp)}ms` : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-1 text-right font-mono',
                      ratingToCellClass(rateCls(v.estimated.cls)),
                    )}
                  >
                    {v.estimated.cls ? v.estimated.cls.toFixed(2) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-1 text-right font-mono',
                      ratingToCellClass(rateTtfb(v.estimated.ttfb)),
                    )}
                  >
                    {v.estimated.ttfb ? `${Math.round(v.estimated.ttfb)}ms` : '—'}
                  </td>
                  <td className="px-3 py-1 text-right font-mono text-ink-3">
                    {v.confidence}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Budget view
// -----------------------------------------------------------------------------

interface BudgetViewProps {
  budgets: ReturnType<typeof usePerformanceStore.getState>['budgets'];
  vitals: RouteVitals[];
  routes: ReturnType<typeof useRouteStore.getState>['routes'];
  onOpen(): void;
}

function BudgetView({ budgets, vitals, routes, onOpen }: BudgetViewProps) {
  // Sort: violations first, then by current/max ratio.
  const ordered = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const av = a.violations.length > 0 ? 1 : 0;
      const bv = b.violations.length > 0 ? 1 : 0;
      if (av !== bv) return bv - av;
      const ar =
        a.maxClientKb === 0 ? 0 : a.currentClientKb / a.maxClientKb;
      const br =
        b.maxClientKb === 0 ? 0 : b.currentClientKb / b.maxClientKb;
      return br - ar;
    });
  }, [budgets]);

  return (
    <div>
      <header className="flex h-7 items-center gap-2 hairline-b bg-bg-subtle px-3 text-[10px] uppercase tracking-caps text-ink-3">
        <span>route</span>
        <span className="ml-auto">
          {budgets.filter((b) => b.violations.length > 0).length} violation
          {budgets.filter((b) => b.violations.length > 0).length === 1 ? '' : 's'}
        </span>
      </header>
      {ordered.map((b) => {
        const route = routes.find((r) => r.id === b.routeId);
        if (!route) return null;
        const v = vitals.find((x) => x.routeId === b.routeId) ?? null;
        return (
          <PerfBudgetRow
            key={b.routeId}
            route={route}
            budget={b}
            vitals={v}
            onOpen={onOpen}
          />
        );
      })}
    </div>
  );
}

function RscMetricsView() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const totalMs = useLastTraceStore((s) => s.totalMs);
  const metrics = useMemo(() => computeStreamMetrics(chunks), [chunks]);

  if (!url) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-ink-3">
        No RSC trace yet — fetch a route in the RSC payload step overlay.
      </div>
    );
  }

  const tiles: ReadonlyArray<{ label: string; value: string; tone?: 'accent' | 'edge' | 'info' | 'muted' }> = [
    { label: 'route', value: url, tone: 'info' },
    { label: 'total ms', value: `${Math.round(totalMs)}ms` },
    { label: 'TTFB', value: `${Math.round(metrics.ttfb)}ms` },
    { label: 'total bytes', value: `${metrics.totalBytes}B` },
    { label: 'client bundle', value: `${metrics.clientBundleBytes}B`, tone: metrics.clientBundleBytes > 5_000 ? 'edge' : 'accent' },
    { label: 'server bytes', value: `${metrics.serverBytes}B` },
    { label: 'chunks', value: String(metrics.chunkCount) },
    { label: 'unique ids', value: String(metrics.uniqueChunkIds) },
    { label: 'follow-ups', value: String(metrics.followUpCount), tone: metrics.followUpCount > 0 ? 'info' : 'muted' },
  ];

  const kindRows = (Object.keys(metrics.byKind) as Array<keyof typeof metrics.byKind>)
    .filter((k) => metrics.byKind[k] > 0)
    .map((k) => ({
      kind: k,
      count: metrics.byKind[k],
      bytes: metrics.bytesByKind[k],
      pct: metrics.totalBytes > 0 ? (metrics.bytesByKind[k] / metrics.totalBytes) * 100 : 0,
    }));

  return (
    <div className="p-3">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded border border-line-1 bg-bg-subtle px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">{t.label}</div>
            <div className="truncate font-mono text-[12px] text-ink-1" title={t.value}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          By kind (bytes)
        </div>
        <div className="space-y-1">
          {kindRows.map((r) => (
            <div key={r.kind} className="flex items-center gap-2 text-[11px]">
              <Chip tone="muted" size="xs">
                {r.kind}
              </Chip>
              <div className="flex-1 overflow-hidden rounded bg-bg-subtle">
                <div
                  className="h-2 bg-accent"
                  style={{ width: `${r.pct}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-ink-2">{r.bytes}B</span>
              <span className="w-10 text-right font-mono text-ink-3">×{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      <RscModulesBars />
    </div>
  );
}

function RscModulesBars() {
  const chunks = useLastTraceStore((s) => s.chunks);
  const modules = useMemo(() => analyzeClientModules(chunks), [chunks]);
  if (modules.length === 0) return null;
  const sorted = [...modules].sort((a, b) => b.sizeBytes - a.sizeBytes);
  const max = sorted[0]?.sizeBytes ?? 1;
  return (
    <div className="mt-3">
      <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
        Client modules (real, from RSC stream)
      </div>
      <div className="space-y-0.5">
        {sorted.map((m) => {
          const pct = (m.sizeBytes / max) * 100;
          const tone = m.isNextInternal
            ? 'muted'
            : m.isThirdParty
              ? 'info'
              : 'edge';
          return (
            <div key={m.id} className="flex items-center gap-2 text-[11px]" title={m.modulePath}>
              <span className="w-7 font-mono text-[10px] text-ink-3">{m.id}</span>
              <Chip tone={tone} size="xs">
                {m.isNextInternal ? 'next' : m.isThirdParty ? '3p' : 'user'}
              </Chip>
              <span className="w-32 truncate font-mono text-ink-1">{m.label}</span>
              <div className="flex-1 overflow-hidden rounded bg-bg-subtle">
                <div
                  className={cn(
                    'h-1.5',
                    tone === 'edge' && 'bg-edge',
                    tone === 'info' && 'bg-info',
                    tone === 'muted' && 'bg-ink-3',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-ink-2">{m.sizeBytes}B</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
