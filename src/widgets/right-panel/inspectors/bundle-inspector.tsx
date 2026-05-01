import { useMemo } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDiagnosticStore } from '@entities/diagnostic';
import { usePerformanceStore } from '@entities/performance';
import { useRouteStore } from '@entities/route';
import type { BundleNode } from '@shared/types';
import { Button, Chip, Inspector, Section } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  rateCls,
  rateInp,
  rateLcp,
  type VitalRating,
} from '@shared/mocks/web-vitals';
import { EmptyState, KvRow, StateIcon } from '../parts';

const SUGGESTIONS: ReadonlyArray<{ id: string; title: string; rationale: string }> = [
  {
    id: 's1',
    title: 'Lazy-load recharts via next/dynamic with ssr:false',
    rationale: 'Removes 96KB from initial /dashboard chunk',
  },
  {
    id: 's2',
    title: 'Replace lodash full import with native methods',
    rationale: 'Saves ~24KB across 3 routes',
  },
  {
    id: 's3',
    title: 'Lazy-load monaco-editor on /admin/products',
    rationale: 'Drops the 320KB editor out of the eager bundle',
  },
  {
    id: 's4',
    title: 'Move MiniCart out of root client boundary',
    rationale: 'Brings /cart back within budget (-32KB)',
  },
  {
    id: 's5',
    title: 'Reserve skeleton min-height on /dashboard widgets',
    rationale: 'Reduces CLS from 0.28 to estimated 0.06',
  },
];

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
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

function vitalDot(rating: VitalRating): string {
  if (rating === 'good') return 'bg-sem-static';
  if (rating === 'needs-improvement') return 'bg-sev-warn';
  return 'bg-sev-err';
}

export function BundleInspector() {
  const bundle = usePerformanceStore((s) => s.bundle);
  const vitals = usePerformanceStore((s) => s.vitals);
  const budgets = usePerformanceStore((s) => s.budgets);
  const heaviestPackages = usePerformanceStore((s) => s.heaviestPackages);
  const routes = useRouteStore((s) => s.routes);

  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);

  const perfDiagnostics = useDiagnosticStore((s) =>
    s.diagnostics.filter((d) => d.category === 'perf'),
  );

  const top: BundleNode[] = useMemo(() => heaviestPackages(5), [heaviestPackages]);
  const maxSize = top[0]?.size ?? 1;

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

  const violatingBudgets = useMemo(
    () => budgets.filter((b) => b.violations.length > 0),
    [budgets],
  );

  const totalClient =
    bundle.children?.find((c) => c.side === 'client')?.size ?? 0;
  const totalServer =
    bundle.children?.find((c) => c.side === 'server')?.size ?? 0;
  const totalShared =
    bundle.children?.find((c) => c.side === 'shared')?.size ?? 0;

  if (!bundle) {
    return (
      <Inspector
        title="BUNDLE"
        meta="composition · vitals · budget"
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>No bundle data.</EmptyState>
      </Inspector>
    );
  }

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <Chip tone="accent" size="xs">
            BUNDLE
          </Chip>
          <span className="text-sm text-ink-1">Project bundle</span>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          <span className="text-ink-3">composition · vitals · budget</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Composition --------------------------------------------------- */}
      <Section title="Composition" defaultOpen>
        <div className="space-y-1">
          <KvRow label="client">
            <span className="font-mono text-xs">{formatKb(totalClient)}</span>
          </KvRow>
          <KvRow label="server">
            <span className="font-mono text-xs">{formatKb(totalServer)}</span>
          </KvRow>
          <KvRow label="shared">
            <span className="font-mono text-xs">{formatKb(totalShared)}</span>
          </KvRow>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Top 5 heaviest packages
          </div>
          {top.map((p) => {
            const ratio = (p.size / maxSize) * 100;
            return (
              <div key={p.id} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-mono text-ink-1">{p.name}</span>
                  <span className="font-mono text-ink-3">{formatKb(p.size)}</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-bg-subtle hairline">
                  <div
                    className={cn(
                      'h-full bg-accent transition-[width]',
                      p.size > 80_000 && 'bg-sev-warn',
                      p.size > 200_000 && 'bg-sev-err',
                    )}
                    style={{ width: `${Math.max(2, ratio)}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Per-route impact --------------------------------------------- */}
      <Section title="Per-route impact" defaultOpen={false}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="hairline-b text-ink-3">
                <th className="px-2 py-1 text-left font-medium">route</th>
                <th className="px-2 py-1 text-right font-medium">client KB</th>
                <th className="px-2 py-1 text-right font-medium">server ms</th>
              </tr>
            </thead>
            <tbody>
              {budgets.slice(0, 12).map((b) => {
                const route = routes.find((r) => r.id === b.routeId);
                if (!route) return null;
                const overClient = b.currentClientKb > b.maxClientKb;
                const overServer = b.currentServerMs > b.maxServerMs;
                return (
                  <tr key={b.routeId} className="hairline-b last:border-b-0">
                    <td className="truncate px-2 py-1 font-mono text-ink-1">
                      {route.path}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1 text-right font-mono',
                        overClient ? 'text-sev-err' : 'text-ink-2',
                      )}
                    >
                      {b.currentClientKb}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1 text-right font-mono',
                        overServer ? 'text-sev-err' : 'text-ink-2',
                      )}
                    >
                      {b.currentServerMs}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Web Vitals snapshot ------------------------------------------ */}
      <Section title="Web Vitals snapshot" defaultOpen>
        <div className="grid grid-cols-3 gap-2">
          <MiniDial
            label="LCP"
            value={Math.round(projectLcp)}
            unit="ms"
            rating={rateLcp(projectLcp)}
          />
          <MiniDial
            label="INP"
            value={Math.round(projectInp)}
            unit="ms"
            rating={rateInp(projectInp)}
          />
          <MiniDial
            label="CLS"
            value={projectCls.toFixed(2)}
            unit=""
            rating={rateCls(projectCls)}
          />
        </div>
      </Section>

      {/* Budget violations -------------------------------------------- */}
      <Section
        title={`Budget violations (${violatingBudgets.length})`}
        defaultOpen={violatingBudgets.length > 0}
      >
        {violatingBudgets.length === 0 ? (
          <EmptyState>All routes within budget.</EmptyState>
        ) : (
          <div className="space-y-1">
            {violatingBudgets.map((b) => {
              const route = routes.find((r) => r.id === b.routeId);
              return (
                <div
                  key={b.routeId}
                  className="flex items-start gap-2 py-1 text-xs"
                >
                  <StateIcon state="warn" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-ink-1">
                      {route?.path ?? b.routeId}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {b.violations.map((v, i) => (
                        <Chip key={i} tone="warn" size="xs">
                          {v}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Perf diagnostics --------------------------------------------- */}
      <Section
        title={`Open perf diagnostics (${perfDiagnostics.length})`}
        defaultOpen={false}
      >
        {perfDiagnostics.length === 0 ? (
          <EmptyState>No perf diagnostics found.</EmptyState>
        ) : (
          <ul className="space-y-1 text-xs">
            {perfDiagnostics.slice(0, 8).map((d) => (
              <li
                key={d.id}
                className="flex items-start gap-2 hairline-b py-1 last:border-b-0"
              >
                <Chip
                  size="xs"
                  tone={
                    d.severity === 'err'
                      ? 'err'
                      : d.severity === 'warn'
                        ? 'warn'
                        : 'muted'
                  }
                >
                  {d.severity}
                </Chip>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-ink-1">{d.title}</div>
                  <div className="mt-0.5 truncate text-[11px] text-ink-3">
                    {d.message}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Suggested optimizations -------------------------------------- */}
      <Section title="Suggested optimizations" defaultOpen={false}>
        <ul className="space-y-1.5">
          {SUGGESTIONS.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-2 py-1 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink-1">{s.title}</div>
                <div className="mt-0.5 truncate text-[11px] text-ink-3">
                  {s.rationale}
                </div>
              </div>
              <Button
                size="xs"
                tone="ghost"
                onClick={() =>
                  toast(`Apply: ${s.title}`, { description: s.rationale })
                }
              >
                Apply
              </Button>
            </li>
          ))}
        </ul>
      </Section>
    </Inspector>
  );
}

interface MiniDialProps {
  label: string;
  value: number | string;
  unit: string;
  rating: VitalRating;
}

function MiniDial({ label, value, unit, rating }: MiniDialProps) {
  return (
    <div className="hairline rounded-sm bg-bg p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          {label}
        </span>
        <span
          className={cn('h-1.5 w-1.5 rounded-full', vitalDot(rating))}
          aria-label={`rating ${rating}`}
        />
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-ink-1">
        {value}
        {unit ? <span className="text-[10px] text-ink-3"> {unit}</span> : null}
      </div>
    </div>
  );
}
