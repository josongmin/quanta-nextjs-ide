import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  ALL_AUDIENCES,
  RISK_CHECKLIST,
  RISK_TONE,
  STAGE_PRESETS,
  STATUS_TONE,
  type Audience,
  type Flag,
} from '../helpers';

interface FlagDetailProps {
  selected: Flag;
  percentage: number;
  audiences: ReadonlyArray<Audience>;
  checked: ReadonlyArray<string>;
  onPercentageChange: (n: number) => void;
  onToggleAudience: (a: Audience) => void;
  onToggleCheck: (id: string) => void;
}

export function FlagDetail({
  selected,
  percentage,
  audiences,
  checked,
  onPercentageChange,
  onToggleAudience,
  onToggleCheck,
}: FlagDetailProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-md text-ink-1">{selected.key}</div>
          <div className="mt-0.5 text-[12px] text-ink-3">
            {selected.description}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Chip tone={STATUS_TONE[selected.status]} size="sm">
            {selected.status}
          </Chip>
          <Chip tone={RISK_TONE[selected.riskTier]} size="sm">
            risk · {selected.riskTier}
          </Chip>
        </div>
      </div>

      {/* Slider + presets */}
      <div className="mt-3 rounded-sm border border-line bg-bg-subtle p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            Rollout %
          </span>
          <span className="font-mono text-md text-ink-1">{percentage}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={percentage}
          onChange={(e) => onPercentageChange(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <div className="mt-1 flex items-center gap-1.5">
          {STAGE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onPercentageChange(p.value)}
              className={cn(
                'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
                percentage === p.value
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audiences */}
      <div className="mt-3">
        <h4 className="text-caps text-ink-3">Audiences</h4>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {ALL_AUDIENCES.map((a) => {
            const on = audiences.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => onToggleAudience(a)}
                className={cn(
                  'h-6 rounded-full border px-2 font-mono text-[11px]',
                  on
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk gate */}
      <div className="mt-3">
        <h4 className="text-caps text-ink-3">Risk gate</h4>
        <ul className="mt-1 space-y-1">
          {RISK_CHECKLIST.map((r) => {
            const on = checked.includes(r.id);
            return (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-2 text-[12px] text-ink-1">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggleCheck(r.id)}
                    className="h-3 w-3 accent-accent"
                  />
                  <span className={cn(on ? '' : 'text-ink-3')}>{r.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Timeline */}
      <div className="mt-3">
        <h4 className="text-caps text-ink-3">Recent events</h4>
        <ul className="mt-1 space-y-1">
          {selected.events.map((ev, i) => (
            <li
              key={`${selected.id}-${i}`}
              className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1"
            >
              <span className="text-ink-3" style={{ minWidth: 70 }}>
                {ev.when}
              </span>
              <span className="flex-1 truncate">{ev.action}</span>
              <span className="text-[10px] text-ink-3">{ev.actor}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
