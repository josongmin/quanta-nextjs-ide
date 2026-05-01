import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  PROVIDER_LABEL,
  type ExternalCallRisk,
} from './external-risk';

const SEV_TONE: Record<ExternalCallRisk['severity'], 'info' | 'warn' | 'err'> = {
  low: 'info',
  medium: 'warn',
  high: 'err',
};

const TRACK_COLOR = (score: number): string => {
  if (score >= 75) return 'bg-sev-info';
  if (score >= 50) return 'bg-sev-warn';
  return 'bg-sev-err';
};

interface Props {
  risk: ExternalCallRisk;
}

export function ExtCard({ risk }: Props) {
  return (
    <div
      className={cn(
        'rounded-sm border border-line bg-bg p-3',
        risk.severity === 'high' && 'border-sev-err/40',
      )}
    >
      <div className="flex items-center gap-2 text-xs">
        <Icon.Net className="h-3 w-3 text-accent" />
        <span className="font-medium text-ink-1">{PROVIDER_LABEL[risk.provider]}</span>
        <Chip tone={SEV_TONE[risk.severity]} size="xs">
          {risk.severity}
        </Chip>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {risk.callSites.length} call site{risk.callSites.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="relative inline-block h-1.5 flex-1 overflow-hidden rounded-full bg-bg-subtle">
          <span
            className={cn('absolute left-0 top-0 h-full', TRACK_COLOR(risk.reliabilityScore))}
            style={{ width: `${risk.reliabilityScore}%` }}
          />
        </span>
        <span className="font-mono text-[11px] text-ink-2">{risk.reliabilityScore}/100</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <Chip tone={risk.safeguards.hasRetry ? 'info' : 'muted'} size="xs">
          {risk.safeguards.hasRetry ? 'retry' : 'no retry'}
        </Chip>
        <Chip tone={risk.safeguards.hasTimeout ? 'info' : 'muted'} size="xs">
          {risk.safeguards.hasTimeout ? 'timeout' : 'no timeout'}
        </Chip>
        <Chip tone={risk.safeguards.hasRateLimit ? 'info' : 'muted'} size="xs">
          {risk.safeguards.hasRateLimit ? 'rate-limit' : 'no rate-limit'}
        </Chip>
      </div>

      {risk.missing.length > 0 ? (
        <p className="mt-2 text-[11px] text-ink-3">
          Missing safeguards: <span className="text-sev-warn">{risk.missing.join(', ')}</span>
        </p>
      ) : null}

      <ul className="mt-2 space-y-0.5">
        {risk.callSites.slice(0, 3).map((c, i) => (
          <li key={i} className="flex items-center gap-1 font-mono text-[10px] text-ink-3">
            <span>{c.file}:{c.line}</span>
            <span className="truncate text-ink-2">— {c.snippet}</span>
          </li>
        ))}
        {risk.callSites.length > 3 ? (
          <li className="text-[10px] text-ink-3">
            +{risk.callSites.length - 3} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}
