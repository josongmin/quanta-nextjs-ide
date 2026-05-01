import type { PerfBudget, Route, RouteVitals } from '@shared/types';
import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Props {
  route: Route;
  budget: PerfBudget;
  vitals?: RouteVitals | null;
  onOpen?(): void;
  className?: string;
}

interface BarProps {
  label: string;
  current: number;
  max: number;
  unit: string;
}

function Bar({ label, current, max, unit }: BarProps) {
  const ratio = max === 0 ? 0 : Math.max(0, Math.min(1.4, current / max));
  const pct = Math.min(100, ratio * 100);
  const over = current > max;
  const tone = over
    ? 'bg-sev-err'
    : ratio > 0.85
      ? 'bg-sev-warn'
      : 'bg-sem-static';

  return (
    <div className="min-w-0 space-y-0.5">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-caps text-ink-3">
        <span>{label}</span>
        <span
          className={cn(
            'font-mono',
            over ? 'text-sev-err' : 'text-ink-2',
          )}
        >
          {current}
          <span className="text-ink-3">/{max}{unit}</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-bg-subtle hairline">
        <div
          className={cn('h-full transition-[width]', tone)}
          style={{ width: `${Math.min(100, pct)}%` }}
          aria-hidden
        />
        {/* "100%" tick */}
        <div
          className="absolute inset-y-0 w-px bg-line-strong"
          style={{ left: `${(max / Math.max(max, current)) * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function PerfBudgetRow({ route, budget, vitals, onOpen, className }: Props) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_280px_1fr_auto] items-center gap-3 px-3 py-2 hairline-b',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="truncate font-mono text-xs text-ink-1">{route.path}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-caps text-ink-3">
          <span>{route.archetype}</span>
          <span>·</span>
          <span>{route.rendering}</span>
          {vitals ? (
            <>
              <span>·</span>
              <span>conf {vitals.confidence}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Bar
          label="client"
          current={budget.currentClientKb}
          max={budget.maxClientKb}
          unit="KB"
        />
        <Bar
          label="server"
          current={budget.currentServerMs}
          max={budget.maxServerMs}
          unit="ms"
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {budget.violations.length === 0 ? (
          <Chip tone="muted" size="xs">
            within budget
          </Chip>
        ) : (
          budget.violations.map((v, i) => (
            <Chip key={`${route.id}-v-${i}`} tone="warn" size="xs">
              {v}
            </Chip>
          ))
        )}
      </div>

      <Button
        size="xs"
        tone="ghost"
        onClick={onOpen}
        aria-label={`Open inspector for ${route.path}`}
      >
        Open
      </Button>
    </div>
  );
}
