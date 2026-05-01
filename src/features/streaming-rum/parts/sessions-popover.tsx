import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui';
import { type RouteStream, type SessionPreview } from '../helpers';

interface SessionsPopoverProps {
  route: RouteStream;
  sessions: ReadonlyArray<SessionPreview>;
}

export function SessionsPopover({
  route,
  sessions,
}: SessionsPopoverProps): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="xs" tone="default">
          Sample 1 session
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-3">
        <div className="mb-2 text-[11px] uppercase tracking-caps text-ink-3">
          8 random sessions on {route.label}
        </div>
        <ul className="space-y-1 text-[11px]">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1"
            >
              <span className="font-mono text-ink-2">{s.id}</span>
              <Chip tone="muted" size="xs">
                {s.device}
              </Chip>
              <span className="ml-auto font-mono text-ink-3">
                FCP {s.fcpMs}ms · LCP {s.lcpMs}ms
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
