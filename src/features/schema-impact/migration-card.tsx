import { match } from 'ts-pattern';
import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { SchemaChange } from './diff';
import type { ChangeRisk, RiskSeverity } from './risk';

const TONE: Record<RiskSeverity, 'info' | 'warn' | 'err'> = {
  low: 'info',
  medium: 'warn',
  high: 'err',
};

const KIND_LABEL = (k: SchemaChange['kind']): string =>
  match(k)
    .with('field-added', () => 'add field')
    .with('field-removed', () => 'remove field')
    .with('field-renamed', () => 'rename field')
    .with('field-type-changed', () => 'change type')
    .with('field-nullability-changed', () => 'nullability')
    .with('field-constraint-changed', () => 'constraint')
    .with('model-added', () => 'add model')
    .with('model-removed', () => 'remove model')
    .exhaustive();

interface Props {
  change: SchemaChange;
  risk: ChangeRisk;
  expanded: boolean;
  onToggle(): void;
}

export function MigrationCard({ change, risk, expanded, onToggle }: Props) {
  return (
    <div
      className={cn(
        'rounded-sm border border-line bg-bg',
        risk.severity === 'high' && 'border-sev-err/40',
        risk.severity === 'medium' && 'border-sev-warn/40',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
      >
        <Chip tone={TONE[risk.severity]} size="xs">
          {risk.severity}
        </Chip>
        <Chip tone="muted" size="xs">
          {KIND_LABEL(change.kind)}
        </Chip>
        <span className="flex-1 truncate font-mono text-ink-1">
          {change.detail}
        </span>
        {risk.breaks.length > 0 ? (
          <Chip tone="err" size="xs">
            {risk.breaks.length} break{risk.breaks.length === 1 ? '' : 's'}
          </Chip>
        ) : (
          <span className="text-[10px] text-ink-3">no usages</span>
        )}
        <Icon.ChevRight
          className={cn(
            'h-3 w-3 text-ink-3 transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      {expanded ? (
        <div className="hairline-t bg-bg-subtle/40 px-3 py-2 text-[11px]">
          <div className="mb-1 text-ink-3">
            <span className="text-[10px] uppercase tracking-caps">mitigation</span>
            <p className="mt-0.5 text-ink-2">{risk.mitigation}</p>
          </div>
          {risk.breaks.length > 0 ? (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-caps text-ink-3">
                affected ({risk.breaks.length})
              </span>
              <ul className="mt-1 space-y-1">
                {risk.breaks.map((b, i) => (
                  <li key={`${b.file}:${b.line}:${i}`} className="rounded-sm bg-bg px-2 py-1">
                    <div className="flex items-center justify-between text-ink-3">
                      <span className="font-mono text-[10px]">
                        {b.file}:{b.line}
                      </span>
                      <span className="text-[10px]">{b.reason}</span>
                    </div>
                    <code className="block truncate font-mono text-[11px] text-ink-1">
                      {b.snippet}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {risk.affectedRoutes.length > 0 || risk.affectedActions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {risk.affectedRoutes.map((r) => (
                <Chip key={r} tone="info" size="xs">
                  /{r}
                </Chip>
              ))}
              {risk.affectedActions.map((a) => (
                <Chip key={a} tone="muted" size="xs">
                  {a}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
