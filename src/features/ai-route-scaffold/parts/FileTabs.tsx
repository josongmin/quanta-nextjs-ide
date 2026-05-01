import {
  Chip,
  Icon,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import type { FileStatus, RouteIntent } from '../helpers';
import { FileStatusBadge } from './FileStatusBadge';

interface FileTabsProps {
  intent: RouteIntent;
  activeTab: string;
  onActiveTabChange(s: string): void;
  byFile: Record<string, string>;
  status: Record<string, FileStatus>;
}

export function FileTabs({
  intent,
  activeTab,
  onActiveTabChange,
  byFile,
  status,
}: FileTabsProps) {
  if (intent.files.length === 0 || activeTab === '') {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-sm border border-dashed border-line bg-bg-subtle/40 p-6 text-center text-xs text-ink-3">
        Pick an intent and click Generate to scaffold the route.
      </div>
    );
  }
  return (
    <>
      <Tabs value={activeTab} onValueChange={onActiveTabChange}>
        <TabsList>
          {intent.files.map((f) => (
            <TabsTrigger key={f.name} value={f.name}>
              <span className="font-mono text-[11px]">{f.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {intent.files.map((f) => {
          const text = byFile[f.name] ?? '';
          const st = status[f.name] ?? 'pending';
          return (
            <TabsContent key={f.name} value={f.name}>
              <div className="rounded-sm border border-line bg-bg">
                <div className="flex items-center gap-2 hairline-b px-2 py-1">
                  <Chip tone="muted" size="xs">
                    {f.language}
                  </Chip>
                  <span className="font-mono text-[11px] text-ink-2">
                    {intent.basePath}/{f.name}
                  </span>
                  <FileStatusBadge status={st} className="ml-auto" />
                </div>
                <pre
                  className="overflow-auto p-2 font-mono text-[11px] leading-[16px] text-ink-1"
                  style={{ maxHeight: 280 }}
                >
                  {text || (st === 'pending' ? '— pending —' : '')}
                  {st === 'streaming' ? (
                    <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-accent align-middle" />
                  ) : null}
                </pre>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      <div className="mt-3 rounded-sm border border-line bg-sev-info-soft/40 p-2 text-xs leading-5 text-ink-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <Icon.Info className="h-3 w-3 text-sev-info" />
          <span className="text-caps text-ink-3">Tradeoffs</span>
        </div>
        {intent.tradeoffs}
      </div>
    </>
  );
}
