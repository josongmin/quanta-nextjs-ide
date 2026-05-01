import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Chip, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  findWinner,
  layers,
  specStr,
  targetSelectors,
  type LayerRule,
} from './helpers';

const STACK_W = 540;
const ROW_H = 28;

export function CascadeLayersOverlay() {
  const open = useUiStore((s) => s.overlays.cascadeLayers.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [target, setTarget] = useState<string>(
    targetSelectors[0] ?? '.button.primary',
  );

  const winner = useMemo(() => findWinner(target), [target]);

  // collect all matching rules with layer for specificity panel
  const allMatches = useMemo(() => {
    const out: ReadonlyArray<{
      layerName: string;
      layerId: string;
      rule: LayerRule;
    }>[] = [];
    const flat = layers.flatMap((l) =>
      l.rules
        .filter((r) => r.matches)
        .map((r) => ({ layerName: l.name, layerId: l.id, rule: r })),
    );
    out.push(flat);
    return flat;
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('cascadeLayers'))}
      title="Cascade layers"
      subtitle="@layer priority + specificity calculator"
      size="lg"
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Target</span>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="h-6 w-44 rounded-sm border border-line bg-bg px-1.5 font-mono text-[11px] text-ink-1 focus:outline-none"
        />
        {targetSelectors.map((s) => (
          <ToggleChip
            key={s}
            active={target === s}
            onClick={() => setTarget(s)}
          >
            {s}
          </ToggleChip>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="overflow-y-auto p-4">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Layer stack (highest priority on top)
          </div>
          <div className="mt-2 space-y-2">
            {[...layers].reverse().map((l) => {
              const matchingRules = l.rules.filter((r) => r.matches);
              const isWinningLayer = winner.layerId === l.id;
              return (
                <div
                  key={l.id}
                  className={cn(
                    'rounded-sm border bg-bg p-2',
                    isWinningLayer ? 'border-accent/40' : 'border-line',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[10px] font-mono text-ink-3">
                        rank {l.rank}
                      </span>
                      <span className="text-sm font-semibold text-ink-1">
                        @layer {l.name}
                      </span>
                      {isWinningLayer && (
                        <Chip tone="accent" size="xs">
                          winner
                        </Chip>
                      )}
                    </div>
                    <Chip
                      tone={matchingRules.length > 0 ? 'info' : 'muted'}
                      size="xs"
                    >
                      {matchingRules.length} match
                    </Chip>
                  </div>

                  <svg
                    width={STACK_W}
                    height={Math.max(matchingRules.length, 1) * ROW_H + 6}
                    viewBox={`0 0 ${STACK_W} ${Math.max(matchingRules.length, 1) * ROW_H + 6}`}
                    className="mt-2 block"
                    role="img"
                    aria-label={`${l.name} layer rules`}
                  >
                    {matchingRules.length === 0 && (
                      <text
                        x={8}
                        y={18}
                        fontSize={10}
                        fill="rgb(148 163 184)"
                        fontFamily="ui-monospace, monospace"
                      >
                        — no matching rules
                      </text>
                    )}
                    {matchingRules.map((r, idx) => {
                      const isWinner = winner.ruleId === r.id;
                      return (
                        <g key={r.id}>
                          <rect
                            x={0}
                            y={idx * ROW_H + 2}
                            width={STACK_W}
                            height={ROW_H - 4}
                            fill={
                              isWinner
                                ? 'rgb(99 102 241 / 0.10)'
                                : 'rgb(0 0 0 / 0.02)'
                            }
                            stroke={
                              isWinner
                                ? 'rgb(99 102 241 / 0.5)'
                                : 'rgb(0 0 0 / 0.08)'
                            }
                            strokeWidth={1}
                          />
                          <text
                            x={10}
                            y={idx * ROW_H + 18}
                            fontSize={11}
                            fontFamily="ui-monospace, monospace"
                            fill="rgb(17 24 39)"
                          >
                            {isWinner ? '✓ ' : '  '}
                            {r.selector} {`{ ${r.declaration} }`}
                          </text>
                          <text
                            x={STACK_W - 10}
                            y={idx * ROW_H + 18}
                            fontSize={10}
                            textAnchor="end"
                            fontFamily="ui-monospace, monospace"
                            fill="rgb(75 85 99)"
                          >
                            {specStr(r.specificity)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Specificity for matched
          </div>
          <ul className="mt-1 space-y-1">
            {allMatches.map((m) => (
              <li
                key={m.rule.id}
                className={cn(
                  'rounded-sm border px-2 py-1.5 text-[11px]',
                  winner.ruleId === m.rule.id
                    ? 'border-accent/40 bg-accent-soft'
                    : 'border-line bg-bg',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-ink-1">{m.rule.selector}</span>
                  <span className="font-mono text-[10px] text-ink-3">
                    {specStr(m.rule.specificity)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-ink-3">
                  <span>@layer {m.layerName}</span>
                  <span className="font-mono">{m.rule.declaration}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
            Reorder hint
          </div>
          <div className="mt-1 rounded-sm border border-sev-info/30 bg-sev-info-soft px-2 py-1.5 text-[11px] text-ink-1">
            {winner.layerId
              ? `Winning rule lives in @layer ${
                  layers.find((l) => l.id === winner.layerId)?.name ?? '?'
                }. Move conflicting overrides into a later layer to win.`
              : 'No matches — try a different target selector.'}
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
