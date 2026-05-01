import { toast } from 'sonner';
import { Button, Chip } from '@shared/ui';
import { STATUSES, statusTone, type PublishStatus } from '../helpers';

interface FooterBarProps {
  counts: Record<PublishStatus, number>;
}

export function FooterBar({ counts }: FooterBarProps) {
  return (
    <div className="flex w-full items-center gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-1">
        {STATUSES.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px]"
          >
            <Chip tone={statusTone(s)} size="xs">
              {s}
            </Chip>
            <span className="text-ink-2">{counts[s]}</span>
          </span>
        ))}
      </div>
      <Button
        size="xs"
        tone="accent"
        className="ml-auto"
        onClick={() => toast('Generated ICS calendar (mock)')}
      >
        Generate ICS calendar
      </Button>
    </div>
  );
}
