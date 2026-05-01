import { Chip } from '@shared/ui';
import type { DeadExport, ModuleNode } from '../helpers';

interface TreeShakingTraceProps {
  selected: ModuleNode;
  dead: ReadonlyArray<DeadExport>;
  deadSavings: number;
}

export function TreeShakingTrace({ selected, dead, deadSavings }: TreeShakingTraceProps) {
  return (
    <div className="mt-3 rounded-sm border border-line bg-bg-subtle px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-caps text-ink-3">
          Tree-shaking trace
        </div>
        {dead.length > 0 ? (
          <Chip tone="static" size="xs">
            ~{deadSavings}KB savings
          </Chip>
        ) : (
          <Chip tone="muted" size="xs">
            no dead exports
          </Chip>
        )}
      </div>
      {dead.length === 0 ? (
        <p className="mt-1.5 text-[11px] text-ink-3">
          No dead exports detected for{' '}
          <span className="font-mono text-ink-2">{selected.name}</span>.
        </p>
      ) : (
        <ul className="mt-1.5 space-y-1 text-[11px]">
          {dead.map((d) => (
            <li key={d.export} className="flex items-center gap-2">
              <span className="flex-1 truncate font-mono text-ink-2">
                {d.export}
              </span>
              <span className="font-mono text-sem-static">
                −{d.savingsKB}KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
