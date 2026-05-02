/**
 * Ship-it Drawer / Cost delta section.
 *
 * Compact bar chart per route with stagger-in entrance.
 * Increase = red, decrease = green. Empty state: "No baseline".
 */

import { useEffect, useState } from 'react';
import { formatUsd } from '@features/cost-predictor/calculator';
import { cn } from '@shared/lib/cn';
import type { CostDeltaSummary } from './types';

export function SectionCost({ delta }: { delta: CostDeltaSummary }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 30);
    return () => clearTimeout(t);
  }, [delta.totalDelta, delta.rows.length]);

  if (delta.rows.length === 0) {
    return (
      <div className="px-4 py-3">
        <div className="text-caps mb-2 text-ink-3">Cost delta</div>
        <div className="rounded-md border border-line bg-bg-subtle/40 p-3 text-xs text-ink-3">
          No baseline. Snapshot in the Cost Predictor to see deltas.
        </div>
      </div>
    );
  }

  const max = Math.max(...delta.rows.map((r) => Math.abs(r.monthlyDelta)), 1);
  const totalSign = delta.totalDelta >= 0 ? '+' : '';

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-caps text-ink-3">Cost delta</div>
        <div
          className={cn(
            'font-mono text-xs',
            delta.isIncrease ? 'text-sev-err' : delta.totalDelta < -0.5 ? 'text-sem-static' : 'text-ink-2',
          )}
        >
          {totalSign}
          {formatUsd(delta.totalDelta)} / mo
        </div>
      </div>
      <ul className="space-y-1">
        {delta.rows.slice(0, 6).map((row, i) => {
          const pct = (Math.abs(row.monthlyDelta) / max) * 100;
          const isInc = row.monthlyDelta > 0;
          return (
            <li
              key={row.routeId}
              className="flex items-center gap-2 text-[11px]"
              data-testid="ship-cost-row"
            >
              <span className="w-32 truncate font-mono text-ink-1">{row.path}</span>
              <span className="text-[10px] text-ink-3">
                {row.fromBucket} → {row.toBucket}
              </span>
              <div className="relative ml-auto h-2 w-24 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    isInc ? 'bg-sev-err' : 'bg-sem-static',
                  )}
                  style={{
                    width: animated ? `${pct}%` : '0%',
                    transition: `width 600ms cubic-bezier(.2,1,.3,1)`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
              <span
                className={cn(
                  'w-14 text-right font-mono',
                  isInc ? 'text-sev-err' : 'text-sem-static',
                )}
              >
                {isInc ? '+' : ''}
                {formatUsd(row.monthlyDelta)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
