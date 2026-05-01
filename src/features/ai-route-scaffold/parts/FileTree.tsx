import { Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { FileStatus, RouteIntent } from '../helpers';
import { FileStatusBadge } from './FileStatusBadge';

interface FileTreeProps {
  intent: RouteIntent;
  status: Record<string, FileStatus>;
  activeTab: string;
  onActiveTabChange(s: string): void;
}

export function FileTree({ intent, status, activeTab, onActiveTabChange }: FileTreeProps) {
  return (
    <ScrollArea className="hairline-r" style={{ height: 460 }}>
      <div className="px-3 py-2 text-caps text-ink-3">{intent.basePath}</div>
      <ul>
        {intent.files.map((f) => {
          const st = status[f.name] ?? 'pending';
          const isActive = activeTab === f.name;
          return (
            <li
              key={f.name}
              onClick={() => onActiveTabChange(f.name)}
              className={cn(
                'flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs hairline-b',
                isActive ? 'bg-bg-selected' : 'hover:bg-bg-hover',
              )}
            >
              <Icon.File className="h-3 w-3 text-ink-3" />
              <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                {f.name}
              </span>
              <FileStatusBadge status={st} />
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
