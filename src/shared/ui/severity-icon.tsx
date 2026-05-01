import { cn } from '@shared/lib/cn';
import type { Severity } from '@shared/types';

interface Props {
  severity: Severity;
  className?: string;
}

const labels: Record<Severity, string> = {
  err: 'ERR',
  warn: 'WARN',
  info: 'INFO',
  hint: 'HINT',
};

const tone: Record<Severity, string> = {
  err: 'text-sev-err',
  warn: 'text-sev-warn',
  info: 'text-sev-info',
  hint: 'text-sev-hint',
};

export function SeverityDot({ severity, className }: Props) {
  return (
    <span
      role="img"
      aria-label={`severity ${severity}`}
      className={cn('inline-block h-1.5 w-1.5 rounded-full', className, {
        'bg-sev-err': severity === 'err',
        'bg-sev-warn': severity === 'warn',
        'bg-sev-info': severity === 'info',
        'bg-sev-hint': severity === 'hint',
      })}
    />
  );
}

export function SeverityLabel({ severity, className }: Props) {
  return (
    <span
      className={cn('text-caps', tone[severity], className)}
      aria-label={`severity ${severity}`}
    >
      {labels[severity]}
    </span>
  );
}
