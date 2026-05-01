import { cn } from '@shared/lib/cn';

type Tone =
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server'
  | 'err'
  | 'warn'
  | 'info'
  | 'hint';

interface Props {
  tone: Tone;
  className?: string;
  width?: 'thin' | 'thick';
}

const toneCls: Record<Tone, string> = {
  static: 'bg-sem-static',
  isr: 'bg-sem-isr',
  dynamic: 'bg-sem-dynamic',
  edge: 'bg-sem-edge',
  client: 'bg-sem-client',
  server: 'bg-sem-server',
  err: 'bg-sev-err',
  warn: 'bg-sev-warn',
  info: 'bg-sev-info',
  hint: 'bg-sev-hint',
};

export function SignBar({ tone, className, width = 'thin' }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        'block h-full',
        width === 'thin' ? 'w-px' : 'w-0.5',
        toneCls[tone],
        className,
      )}
    />
  );
}
