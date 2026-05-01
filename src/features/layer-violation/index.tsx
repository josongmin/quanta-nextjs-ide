/**
 * Layer Violation overlay — pyramid + violations list.
 *
 * The detector consumes the import graph from `code-graph.ts`. We don't
 * import the worker directly here (the parent wiring layer should hand
 * us a graph); instead, the overlay accepts whatever `report` is in the
 * store, with a "demo" graph as a fallback so the surface is never empty
 * the first time a user opens it.
 */

import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { detectViolations } from './detector';
import { LayerPyramid } from './pyramid';
import { useLayerViolationStore } from './store';
import type { LayerKind, Violation } from './types';

const DEMO_GRAPH: Record<string, ReadonlyArray<string>> = {
  'src/app/checkout/page.tsx': [
    'src/lib/db/orders.ts',
    'src/lib/services/payments.ts',
  ],
  'src/components/CartButton.tsx': ['src/lib/db/prismaClient.ts'],
  'src/lib/services/payments.ts': ['src/lib/db/orders.ts'],
  'src/lib/db/orders.ts': ['src/components/badge.tsx'],
};

export function LayerViolationOverlay() {
  const open = useUiStore((s) => s.overlays.layerViolation.open);
  const close = useUiStore((s) => s.closeOverlay);
  const layers = useLayerViolationStore((s) => s.layers);
  const storedReport = useLayerViolationStore((s) => s.report);

  const [hover, setHover] = useState<LayerKind | null>(null);

  const report = useMemo(() => {
    if (storedReport.violations.length || storedReport.scanned > 0) return storedReport;
    return detectViolations(DEMO_GRAPH, { layers });
  }, [storedReport, layers]);

  const filtered = useMemo<ReadonlyArray<Violation>>(() => {
    if (!hover) return report.violations;
    return report.violations.filter((v) => v.fromLayer === hover || v.toLayer === hover);
  }, [report.violations, hover]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of report.violations) {
      counts[v.kind] = (counts[v.kind] ?? 0) + 1;
    }
    return counts;
  }, [report.violations]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('layerViolation'))}
      title={
        <span className="flex items-center gap-2">
          <span>Layer Violation Detector</span>
          <Chip tone={report.violations.length ? 'err' : 'static'} size="sm">
            {report.violations.length} violation{report.violations.length === 1 ? '' : 's'}
          </Chip>
        </span>
      }
      subtitle={
        <span className="font-mono text-[11px] text-ink-3">
          {report.scanned} files scanned · {report.edges} import edges
        </span>
      }
      size="lg"
      footer={
        <>
          <Button size="sm" tone="ghost" onClick={() => close('layerViolation')}>
            Close
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_360px] divide-x divide-line">
        <section className="min-w-0 p-4">
          <LayerPyramid
            layers={layers}
            violations={report.violations}
            highlight={hover}
            onHover={setHover}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(summary).map(([kind, count]) => (
              <Chip key={kind} tone={kind === 'reverse' ? 'err' : 'warn'} size="sm">
                {kind}: {count}
              </Chip>
            ))}
            {!report.violations.length && (
              <span className="text-[12px] text-ink-3">
                No violations detected — every import respects the layer order.
              </span>
            )}
          </div>
        </section>
        <ScrollArea className="max-h-[480px]">
          <ul className="divide-y divide-line text-[12px]">
            {filtered.map((v) => (
              <li key={v.id} className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Chip tone={v.kind === 'reverse' ? 'err' : 'warn'} size="xs">
                    {v.kind}
                  </Chip>
                  <span className="font-mono text-[11px] text-ink-3">
                    {v.fromLayer} → {v.toLayer}
                  </span>
                </div>
                <div className="mt-1 truncate font-mono text-[11px] text-ink-1">{v.from}</div>
                <div className={cn('truncate font-mono text-[11px] text-ink-2')}>↳ {v.to}</div>
                <div className="mt-1 text-[11px] text-ink-3">{v.hint}</div>
              </li>
            ))}
            {!filtered.length && (
              <li className="px-3 py-6 text-center text-[12px] text-ink-3">
                No violations match the current filter.
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}
