import { useMemo } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { selectPageRoutes, useRouteStore } from '@entities/route';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  calculateCosts,
  diffCosts,
  formatUsd,
  type RouteCostRow,
} from './calculator';
import {
  findProvider,
  PROVIDERS,
  type CostBucket,
  type Provider,
} from './model';
import { useCostStore } from './store';
import { DiffCard } from './diff-card';

const BUCKET_TONE: Record<CostBucket, 'static' | 'isr' | 'dynamic' | 'edge'> = {
  static: 'static',
  isr: 'isr',
  ssr: 'dynamic',
  edge: 'edge',
};

const BUCKET_LABEL: Record<CostBucket, string> = {
  static: 'CDN',
  isr: 'ISR',
  ssr: 'SSR',
  edge: 'edge',
};

const TRAFFIC_OPTIONS = [
  { value: 100_000, label: '100K / mo' },
  { value: 1_000_000, label: '1M / mo' },
  { value: 10_000_000, label: '10M / mo' },
  { value: 100_000_000, label: '100M / mo' },
];

const formatTraffic = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

export function CostPredictorOverlay() {
  const open = useUiStore((s) => s.overlays.costPredictor.open);
  const close = useUiStore((s) => s.closeOverlay);
  const provider = useCostStore((s) => s.provider);
  const setProvider = useCostStore((s) => s.setProvider);
  const traffic = useCostStore((s) => s.trafficPerMonth);
  const setTraffic = useCostStore((s) => s.setTraffic);
  const baseline = useCostStore((s) => s.baseline);
  const snapshot = useCostStore((s) => s.snapshot);
  const clearBaseline = useCostStore((s) => s.clearBaseline);

  const pageRoutes = useRouteStore(selectPageRoutes);

  const pricing = findProvider(provider);

  const breakdown = useMemo(
    () => calculateCosts(pageRoutes, pricing, traffic),
    [pageRoutes, pricing, traffic],
  );

  const diffs = useMemo(
    () => (baseline.size > 0 ? diffCosts(breakdown, baseline, pricing) : []),
    [baseline, breakdown, pricing],
  );

  const totalDiff = useMemo(
    () => diffs.reduce((s, d) => s + d.monthlyDelta, 0),
    [diffs],
  );

  const buckets = breakdown.byBucket;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('costPredictor'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Hash className="h-4 w-4 text-sem-isr" />
          <span>Infra Cost Predictor</span>
        </span>
      }
      subtitle="per-route mode × traffic × provider · monthly forecast"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            total <span className="font-mono text-ink-1">{formatUsd(breakdown.totalMonthly)}</span> / mo
          </span>
          <span>
            <span className="text-sem-static">CDN</span>{' '}
            <span className="font-mono">{formatUsd(buckets.static)}</span>
          </span>
          <span>
            <span className="text-sem-isr">ISR</span>{' '}
            <span className="font-mono">{formatUsd(buckets.isr)}</span>
          </span>
          <span>
            <span className="text-sem-dynamic">SSR</span>{' '}
            <span className="font-mono">{formatUsd(buckets.ssr)}</span>
          </span>
          <span>
            <span className="text-sem-edge">edge</span>{' '}
            <span className="font-mono">{formatUsd(buckets.edge)}</span>
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                snapshot(pageRoutes);
                toast.success('Baseline snapshotted');
              }}
            >
              Snapshot baseline
            </Button>
            {baseline.size > 0 ? (
              <Button size="xs" tone="ghost" onClick={() => clearBaseline()}>
                Clear
              </Button>
            ) : null}
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <SelectControl
          label="provider"
          value={provider}
          onChange={(v) => setProvider(v as Provider)}
          options={PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
        />
        <SelectControl
          label="traffic"
          value={String(traffic)}
          onChange={(v) => setTraffic(Number(v))}
          options={TRAFFIC_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
        />
        <input
          type="range"
          min={50_000}
          max={500_000_000}
          step={50_000}
          value={traffic}
          onChange={(e) => setTraffic(Number(e.target.value))}
          className="ml-1 w-40"
          aria-label="traffic slider"
        />
        <span className="font-mono text-[10px] text-ink-3">
          {formatTraffic(traffic)}/mo
        </span>
        <span className="ml-auto text-[10px] text-ink-3">
          {pricing.computeNote}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="max-h-[440px] overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-bg-subtle text-left text-ink-3">
              <tr className="hairline-b">
                <th className="px-3 py-1.5 font-medium">route</th>
                <th className="px-2 py-1.5 font-medium">mode</th>
                <th className="px-2 py-1.5 text-right font-medium">$/req</th>
                <th className="px-2 py-1.5 text-right font-medium">monthly</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.rows.map((row) => (
                <Row key={row.routeId} row={row} />
              ))}
              {breakdown.rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-ink-3">
                    No page routes.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 p-3">
          <DiffCard diffs={diffs} totalDelta={totalDiff} />
          <div className="rounded-sm border border-line bg-bg-subtle/30 p-2 text-[11px]">
            <div className="text-caps mb-1 text-ink-3">rate card</div>
            <ul className="space-y-0.5 text-ink-2">
              <li className="flex items-center justify-between">
                <span><span className="text-sem-static">●</span> CDN</span>
                <span className="font-mono">${pricing.staticPerM.toFixed(2)} / 1M</span>
              </li>
              <li className="flex items-center justify-between">
                <span><span className="text-sem-isr">●</span> ISR regen</span>
                <span className="font-mono">${pricing.isrPerM.toFixed(2)} / 1M</span>
              </li>
              <li className="flex items-center justify-between">
                <span><span className="text-sem-dynamic">●</span> SSR</span>
                <span className="font-mono">${pricing.ssrPerM.toFixed(2)} / 1M</span>
              </li>
              <li className="flex items-center justify-between">
                <span><span className="text-sem-edge">●</span> Edge</span>
                <span className="font-mono">${pricing.edgePerM.toFixed(2)} / 1M</span>
              </li>
            </ul>
          </div>
          <div className="text-[10px] text-ink-3">
            Estimates are list-price approximations. Real costs vary with
            payload size, cache hit rate, and concurrency.
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}

function Row({ row }: { row: RouteCostRow }) {
  return (
    <tr className="hairline-b hover:bg-bg-hover">
      <td className="truncate px-3 py-1 font-mono text-ink-1">{row.path}</td>
      <td className="px-2 py-1">
        <Chip tone={BUCKET_TONE[row.bucket]} size="xs">
          {BUCKET_LABEL[row.bucket]}
        </Chip>
      </td>
      <td className="px-2 py-1 text-right font-mono text-ink-3">
        {row.perRequest === 0 ? '—' : `$${row.perRequest.toFixed(7)}`}
      </td>
      <td
        className={cn(
          'px-2 py-1 text-right font-mono',
          row.monthly > 100 ? 'text-sev-err' : row.monthly > 10 ? 'text-sev-warn' : 'text-ink-1',
        )}
      >
        {formatUsd(row.monthly)}
      </td>
    </tr>
  );
}
