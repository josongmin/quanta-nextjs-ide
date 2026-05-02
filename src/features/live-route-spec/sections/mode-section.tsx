import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSpecMode } from '../types';

interface Props {
  mode: RouteSpecMode;
  onJumpEvidence(file: string, line: number): void;
  className?: string;
}

const familyTone = (family: RouteSpecMode['family']) => {
  switch (family) {
    case 'static':
      return 'static' as const;
    case 'isr':
      return 'info' as const;
    case 'dynamic':
      return 'warn' as const;
    case 'streaming':
      return 'accent' as const;
  }
};

export function ModeSection({ mode, onJumpEvidence, className }: Props) {
  const tone = familyTone(mode.family);
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="text-caps text-[10px] uppercase tracking-wide text-ink-3">
        Render mode
      </div>
      <div className="flex items-center gap-1.5">
        <Chip tone={tone} size="sm" className="font-mono">
          {mode.label}
        </Chip>
        {mode.revalidate !== null ? (
          <Chip tone="muted" size="xs" className="font-mono nums-tabular">
            rev {mode.revalidate}s
          </Chip>
        ) : null}
        <Chip tone="muted" size="xs" className="capitalize">
          {mode.confidence}
        </Chip>
      </div>
      <div className="line-clamp-1 text-[11px] text-ink-2" title={mode.cause}>
        {mode.cause}
      </div>
      {mode.reasoning.length > 0 ? (
        <ul className="mt-0.5 flex flex-col gap-0.5 text-[11px]">
          {mode.reasoning.slice(0, 3).map((s, i) => (
            <li key={`${s.file}:${s.line}:${i}`} className="flex items-baseline gap-1.5">
              <span className="font-mono text-ink-3">·</span>
              <button
                type="button"
                onClick={() => onJumpEvidence(s.file, s.line)}
                className="truncate text-left font-mono text-ink-2 hover:text-text-link hover:underline"
                title={`${s.file}:${s.line} — ${s.effect}`}
              >
                {s.kind} <span className="text-ink-3">@</span>{' '}
                {shortFile(s.file)}:{s.line}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const shortFile = (f: string): string => {
  const parts = f.split('/');
  return parts.slice(-2).join('/');
};
