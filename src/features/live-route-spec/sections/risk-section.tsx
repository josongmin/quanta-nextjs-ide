import { SeverityDot } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSpecRisk } from '../types';

interface Props {
  risks: ReadonlyArray<RouteSpecRisk>;
  onJumpRisk(file: string, line: number): void;
  onSeeAll(): void;
  className?: string;
}

const tintBySev = (sev: RouteSpecRisk['severity']) => {
  switch (sev) {
    case 'err':
      return 'bg-sev-err-soft';
    case 'warn':
      return 'bg-sev-warn-soft';
    case 'info':
    case 'hint':
      return 'bg-sev-info-soft/40';
  }
};

export function RiskSection({ risks, onJumpRisk, onSeeAll, className }: Props) {
  const top = risks[0];
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1 text-caps text-[10px] uppercase tracking-wide text-ink-3">
        <span>Risks</span>
        <span className="nums-tabular text-ink-2">·</span>
        <span className="nums-tabular text-ink-2">{risks.length}</span>
      </div>
      {!top ? (
        <span className="text-[11px] text-sem-static">clean — no diagnostics</span>
      ) : (
        <div
          className={cn(
            'flex items-center gap-2 rounded-sm px-1.5 py-1',
            tintBySev(top.severity),
          )}
        >
          <SeverityDot severity={top.severity} />
          <button
            type="button"
            onClick={() => onJumpRisk(top.file, top.line)}
            className="truncate text-left text-[11px] text-ink-1 hover:underline"
            title={`${top.file}:${top.line}`}
          >
            {top.title}
          </button>
          {risks.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeeAll();
              }}
              className="ml-auto whitespace-nowrap text-[10px] text-ink-3 hover:text-ink-1 hover:underline"
            >
              see all {risks.length}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
