import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  fmtRelative,
  initialWatches,
  STATUS_LABEL,
  STATUS_TONE,
  suggestedWatches,
  type HistoryPoint,
  type WatchExpression,
} from './helpers';

const NOW_REF = 1_714_500_000_000 + 100;

interface SparkProps {
  points: ReadonlyArray<HistoryPoint>;
}

function Sparkline({ points }: SparkProps) {
  const numeric = points
    .map((p) => p.numeric)
    .filter((n): n is number => typeof n === 'number');
  if (numeric.length < 2) {
    return (
      <span className="font-mono text-[10px] text-ink-3">—</span>
    );
  }
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const range = max - min || 1;
  const w = 60;
  const h = 16;
  const step = numeric.length > 1 ? w / (numeric.length - 1) : 0;
  const path = numeric
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 2) - 1;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="text-accent"
      aria-hidden
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.25} />
      {numeric.map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * (h - 2) - 1;
        return <circle key={i} cx={x} cy={y} r={1.4} fill="currentColor" />;
      })}
    </svg>
  );
}

export function WatchExpressionsOverlay() {
  const open = useUiStore((s) => s.overlays.watchExpressions.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [list, setList] = useState<ReadonlyArray<WatchExpression>>(initialWatches);
  const [draft, setDraft] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>('w_1');

  const counts = useMemo(() => {
    return list.reduce(
      (acc, w) => {
        acc[w.status] += 1;
        return acc;
      },
      { ok: 0, err: 0, stale: 0 } as Record<'ok' | 'err' | 'stale', number>,
    );
  }, [list]);

  const submit = () => {
    const expr = draft.trim();
    if (!expr) {
      toast.error('Expression required');
      return;
    }
    const id = `w_${Math.random().toString(36).slice(2, 7)}`;
    const next: WatchExpression = {
      id,
      expression: expr,
      value: '<pending>',
      type: 'unknown',
      status: 'stale',
      lastEvaluatedMs: NOW_REF,
      history: [],
    };
    setList((l) => [next, ...l]);
    setDraft('');
    toast(`Added watch: ${expr}`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('watchExpressions')}
      title="Watch expressions"
      subtitle="evaluated against active frame"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            ok: <span className="font-mono text-ink-1">{counts.ok}</span>
          </span>
          <span>
            err: <span className="font-mono text-sev-err">{counts.err}</span>
          </span>
          <span>
            stale: <span className="font-mono text-sev-warn">{counts.stale}</span>
          </span>
          <span className="ml-auto flex gap-1.5">
            <Button size="xs" tone="ghost" onClick={() => toast('Refresh all watches')}>
              Refresh all
            </Button>
            <Button size="xs" tone="ghost" onClick={() => toast('Saved preset')}>
              Save preset
            </Button>
          </span>
        </span>
      }
    >
      {/* Add expression */}
      <div className="flex items-center gap-1 hairline-b bg-bg-subtle px-3 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Add watch expression…"
          className="h-7 flex-1 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
        />
        <Button size="sm" tone="accent" onClick={submit}>
          <Icon.Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_260px]">
        {/* List */}
        <ScrollArea className="h-[460px] hairline-r">
          <div>
            {list.map((w) => {
              const isOpen = expanded === w.id;
              return (
                <div key={w.id} className="hairline-b last:border-b-0">
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 hover:bg-bg-hover',
                      isOpen && 'bg-bg-subtle/50',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : w.id)}
                      className="inline-flex h-3.5 w-3.5 items-center justify-center text-ink-3 hover:text-ink-1"
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      {isOpen ? (
                        <Icon.ChevDown className="h-3 w-3" />
                      ) : (
                        <Icon.ChevRight className="h-3 w-3" />
                      )}
                    </button>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-1">
                      {w.expression}
                    </span>
                    <Chip tone={w.status === 'err' ? 'err' : 'muted'} size="xs">
                      {w.value.length > 28 ? w.value.slice(0, 28) + '…' : w.value}
                    </Chip>
                    <Chip tone="muted" size="xs">
                      {w.type}
                    </Chip>
                    <Chip tone={STATUS_TONE[w.status]} size="xs">
                      {STATUS_LABEL[w.status]}
                    </Chip>
                    <span className="font-mono text-[10px] text-ink-3">
                      {fmtRelative(NOW_REF, w.lastEvaluatedMs)}
                    </span>
                    <Sparkline points={w.history} />
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => toast(`Edit ${w.expression}`)}
                        className="rounded-sm p-0.5 text-ink-3 hover:bg-bg hover:text-ink-1"
                        aria-label="Edit"
                      >
                        <Icon.Code className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast(`Refreshed ${w.expression}`)}
                        className="rounded-sm p-0.5 text-ink-3 hover:bg-bg hover:text-ink-1"
                        aria-label="Refresh"
                      >
                        <Icon.Refresh className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setList((l) => l.filter((x) => x.id !== w.id));
                          toast(`Removed ${w.expression}`);
                        }}
                        className="rounded-sm p-0.5 text-ink-3 hover:bg-sev-err-soft hover:text-sev-err"
                        aria-label="Remove"
                      >
                        <Icon.X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {isOpen ? (
                    <div className="bg-bg-subtle/40 px-3 py-2">
                      <div className="mb-1 text-caps text-ink-3">history</div>
                      {w.history.length === 0 ? (
                        <div className="text-[11px] text-ink-3">No history yet</div>
                      ) : (
                        <div className="space-y-0.5">
                          {w.history.map((p, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 font-mono text-[11px]"
                            >
                              <span className="w-20 text-ink-3">
                                {fmtRelative(NOW_REF, p.at)}
                              </span>
                              <span className="text-ink-1">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {list.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-ink-3">
                No watch expressions
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Right rail: suggestions */}
        <div>
          <div className="flex h-7 items-center px-3 hairline-b text-caps text-ink-3">
            Suggested from frame
          </div>
          <div className="space-y-1.5 p-3">
            {suggestedWatches.map((s) => (
              <div
                key={s.expression}
                className="rounded-sm border border-line bg-bg p-2"
              >
                <div className="font-mono text-[11px] text-ink-1">
                  {s.expression}
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-[10px] text-ink-3">{s.reason}</span>
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => {
                      setDraft(s.expression);
                      toast(`Drafted ${s.expression}`);
                    }}
                  >
                    <Icon.Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
