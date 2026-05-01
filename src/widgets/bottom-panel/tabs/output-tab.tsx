import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';

interface LogEntry {
  ts: string;
  channel: string;
  level: 'info' | 'warn' | 'err';
  message: string;
}

const MOCK_LOG: ReadonlyArray<LogEntry> = [
  { ts: '08:00:01.012', channel: 'NSS', level: 'info', message: 'analyzer ready · 17 routes · 8 tags · 3 actions' },
  { ts: '08:00:01.044', channel: 'NSS', level: 'info', message: 'inspecting profile: commerce' },
  { ts: '08:00:01.182', channel: 'NSS', level: 'info', message: 'route tree indexed in 138ms' },
  { ts: '08:00:02.003', channel: 'NSS', level: 'info', message: 'cache lineage rebuilt — 8 tags resolved' },
  { ts: '08:00:02.041', channel: 'NSS', level: 'warn', message: 'tag taxonomy: "Product" / "product" / "products" share inconsistencyGroup=products' },
  { ts: '08:00:03.155', channel: 'NSS', level: 'info', message: 'semantic diff: feature/checkout-overhaul vs main' },
  { ts: '08:00:03.211', channel: 'NSS', level: 'warn', message: '9 behavior changes detected (3 rendering · 2 cache · 1 boundary · 1 auth · 1 contract · 1 cost)' },
  { ts: '08:00:03.412', channel: 'NSS', level: 'err',  message: 'auth: requireRole removed on /admin/users/delete (commit a8f1c2)' },
  { ts: '08:00:03.498', channel: 'NSS', level: 'err',  message: 'contract: /checkout requireIdempotency regressed' },
  { ts: '08:00:04.001', channel: 'NSS', level: 'info', message: 'evidence tracer indexed 14 propagation chains' },
  { ts: '08:00:04.220', channel: 'NSS', level: 'warn', message: 'use-client-blast: AppShell.tsx pulls 38 files (~260KB) into client bundle' },
  { ts: '08:00:05.000', channel: 'NSS', level: 'info', message: 'watching for changes…' },
];

export function OutputTab() {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([...MOCK_LOG]);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.message.toLowerCase().includes(q) ||
        l.channel.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q),
    );
  }, [logs, search]);

  const handleClear = () => {
    setLogs([]);
    toast('Output cleared', {
      description: 'Re-run analyzer to repopulate',
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <PanelHeader>
        <Icon.Terminal className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-[11px] text-ink-3">channel</span>
        <span className="font-mono text-[11px] text-ink-1">Next Static Studio</span>
        <span className="text-ink-3">·</span>
        <span className="text-[11px] text-ink-3">{filtered.length} lines</span>

        <div className="ml-auto flex items-center gap-1">
          <div className="w-44">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Filter output"
            />
          </div>
          <Button size="xs" tone="ghost" onClick={handleClear}>
            <Icon.X className="h-3 w-3" />
            Clear
          </Button>
        </div>
      </PanelHeader>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            {logs.length === 0
              ? 'Output cleared. Waiting for analyzer events…'
              : `No output matching “${search}”.`}
          </div>
        ) : (
          <pre className="m-0 px-3 py-2 font-mono text-[11px] leading-relaxed">
            {filtered.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 text-ink-3">[{l.ts}]</span>
                <span className="shrink-0 text-ink-3">[{l.channel}]</span>
                <span
                  className={cn(
                    'shrink-0 uppercase tracking-caps',
                    l.level === 'info' && 'text-sev-info',
                    l.level === 'warn' && 'text-sev-warn',
                    l.level === 'err' && 'text-sev-err',
                  )}
                >
                  {l.level}
                </span>
                <span className="text-ink-1">{l.message}</span>
              </div>
            ))}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
}
