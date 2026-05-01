import { match } from 'ts-pattern';
import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ApiContract } from './matcher';
import type { ContractChange } from './diff';

const METHOD_TONE = (m: ApiContract['method']) =>
  match(m)
    .with('GET', () => 'static' as const)
    .with('POST', () => 'info' as const)
    .with('PUT', () => 'isr' as const)
    .with('PATCH', () => 'isr' as const)
    .with('DELETE', () => 'err' as const)
    .exhaustive();

const STATUS_TONE: Record<ApiContract['status'], 'info' | 'warn' | 'muted'> = {
  matched: 'info',
  'orphan-caller': 'warn',
  'orphan-handler': 'muted',
};

interface Props {
  contract: ApiContract;
  drift: ContractChange[];
  expanded: boolean;
  onToggle(): void;
}

export function ContractCard({ contract, drift, expanded, onToggle }: Props) {
  const breakingDrift = drift.filter((d) => d.breaking);
  return (
    <div
      className={cn(
        'rounded-sm border border-line bg-bg',
        breakingDrift.length > 0 && 'border-sev-err/40',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto_16px] items-center gap-2 px-3 py-2 text-left text-xs"
      >
        <Chip tone={METHOD_TONE(contract.method)} size="xs" className="font-mono font-semibold">
          {contract.method}
        </Chip>
        <span className="truncate font-mono text-ink-1">{contract.endpoint}</span>
        <Chip tone={STATUS_TONE[contract.status]} size="xs">
          {contract.status === 'matched'
            ? `${contract.callers.length}c · 1h`
            : contract.status === 'orphan-caller'
              ? 'no handler'
              : 'no caller'}
        </Chip>
        {breakingDrift.length > 0 ? (
          <Chip tone="err" size="xs">
            drift
          </Chip>
        ) : (
          <span />
        )}
        <Icon.ChevRight
          className={cn(
            'h-3 w-3 text-ink-3 transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      {expanded ? (
        <div className="hairline-t grid grid-cols-[1fr_auto_1fr] gap-3 bg-bg-subtle/40 px-3 py-3 text-[11px]">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              client ({contract.callers.length})
            </div>
            {contract.callers.length === 0 ? (
              <div className="text-ink-3">— none —</div>
            ) : (
              <ul className="flex flex-col gap-1">
                {contract.callers.map((c, i) => (
                  <li key={`${c.file}:${c.line}:${i}`} className="rounded-sm bg-bg px-2 py-1">
                    <div className="flex items-center justify-between text-ink-3">
                      <span className="font-mono text-[10px]">
                        {c.file}:{c.line}
                      </span>
                      <Chip tone="muted" size="xs">
                        {c.client}
                      </Chip>
                    </div>
                    <code className="block truncate font-mono text-[11px] text-ink-1">
                      {c.snippet}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-center text-ink-3">
            <Icon.Right className="h-4 w-4" />
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              server
            </div>
            {contract.handler ? (
              <div className="rounded-sm bg-bg px-2 py-1">
                <div className="font-mono text-[10px] text-ink-3">
                  {contract.handler.file}:{contract.handler.line}
                </div>
                <div className="mt-0.5 text-ink-1">
                  <span className="text-ink-3">request:</span>{' '}
                  <code className="font-mono">{contract.handler.requestType ?? '—'}</code>
                </div>
                <div className="text-ink-1">
                  <span className="text-ink-3">response:</span>{' '}
                  <code className="font-mono">{contract.handler.responseType ?? '—'}</code>
                </div>
              </div>
            ) : (
              <div className="text-ink-3">— no matching handler —</div>
            )}
          </div>
          {drift.length > 0 ? (
            <div className="col-span-3 mt-1 rounded-sm border border-sev-warn/30 bg-sev-warn-soft/30 px-2 py-1.5">
              <div className="mb-0.5 text-[10px] uppercase tracking-caps text-sev-warn">
                drift ({drift.length})
              </div>
              <ul className="space-y-0.5">
                {drift.map((d, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {d.breaking ? (
                      <Chip tone="err" size="xs">
                        breaking
                      </Chip>
                    ) : (
                      <Chip tone="info" size="xs">
                        compat
                      </Chip>
                    )}
                    <span className="font-mono text-[11px] text-ink-2">{d.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
