import type { Route } from '@shared/types';
import { Chip, Icon } from '@shared/ui';

interface Props {
  file: string;
  route?: Route | undefined;
}

export function EditorBreadcrumb({ file, route }: Props) {
  const segments = file.split('/');
  return (
    <div className="flex h-7 shrink-0 items-center gap-1 hairline-b bg-bg px-3 text-xs text-ink-3">
      {segments.map((s, i) => {
        const isLast = i === segments.length - 1;
        const isGroup = /^\(.+\)$/.test(s);
        const isParallel = s.startsWith('@');
        const isDynamic = /^\[.+\]$/.test(s);
        return (
          <span key={`${s}-${i}`} className="flex items-center gap-1">
            <span
              className={
                isGroup
                  ? 'text-ink-3'
                  : isParallel || isDynamic
                    ? 'text-sem-edge'
                    : isLast
                      ? 'text-ink-1'
                      : 'text-ink-2'
              }
            >
              {s}
            </span>
            {!isLast && <Icon.ChevRight className="h-3 w-3 text-ink-3" />}
          </span>
        );
      })}
      {route && (
        <span className="ml-2 flex items-center gap-1.5">
          <Chip tone="muted" size="xs">
            Server
          </Chip>
        </span>
      )}
    </div>
  );
}
