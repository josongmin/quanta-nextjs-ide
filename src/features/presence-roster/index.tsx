import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel, Tooltip } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { cn } from '@shared/lib/cn';

type Status = 'active' | 'idle' | 'viewing' | 'editing';

interface Teammate {
  id: string;
  name: string;
  initials: string;
  color: string; // hex
  role: string;
  status: Status;
  currentFile: string;
  currentLine: number;
  lastSeen: string;
}

const TEAMMATES: ReadonlyArray<Teammate> = [
  {
    id: 'u1',
    name: 'Avery Chen',
    initials: 'AC',
    color: '#2F6BFF',
    role: 'Frontend',
    status: 'editing',
    currentFile: 'app/(shop)/cart/page.tsx',
    currentLine: 42,
    lastSeen: 'now',
  },
  {
    id: 'u2',
    name: 'Bao Nguyen',
    initials: 'BN',
    color: '#E0488B',
    role: 'Backend',
    status: 'editing',
    currentFile: 'app/api/orders/route.ts',
    currentLine: 88,
    lastSeen: 'now',
  },
  {
    id: 'u3',
    name: 'Cleo Diaz',
    initials: 'CD',
    color: '#19A37F',
    role: 'Design',
    status: 'viewing',
    currentFile: 'app/(shop)/cart/page.tsx',
    currentLine: 14,
    lastSeen: '20s',
  },
  {
    id: 'u4',
    name: 'Dani Park',
    initials: 'DP',
    color: '#B86BFF',
    role: 'QA',
    status: 'viewing',
    currentFile: 'app/(marketing)/page.tsx',
    currentLine: 7,
    lastSeen: '1m',
  },
  {
    id: 'u5',
    name: 'Ezra Patel',
    initials: 'EP',
    color: '#E29A2B',
    role: 'Platform',
    status: 'idle',
    currentFile: 'app/api/orders/route.ts',
    currentLine: 22,
    lastSeen: '6m',
  },
  {
    id: 'u6',
    name: 'Farah Lin',
    initials: 'FL',
    color: '#1FA2C2',
    role: 'PM',
    status: 'active',
    currentFile: 'app/(marketing)/page.tsx',
    currentLine: 38,
    lastSeen: 'now',
  },
];

const STATUS_LABEL: Record<Status, string> = {
  active: 'Active',
  idle: 'Idle',
  viewing: 'Viewing',
  editing: 'Editing',
};

function statusTone(s: Status): 'accent' | 'info' | 'muted' | 'neutral' {
  if (s === 'editing') return 'accent';
  if (s === 'viewing') return 'info';
  if (s === 'idle') return 'muted';
  return 'neutral';
}

export function PresenceRosterOverlay() {
  const open = useUiStore((s) => s.overlays.presenceRoster.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEAMMATES;
    return TEAMMATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        t.currentFile.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Teammate[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.currentFile);
      if (arr) arr.push(t);
      else map.set(t.currentFile, [t]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('presenceRoster')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Presence</span>
        </span>
      }
      subtitle="live cursors · who's where in the workspace"
      size="sm"
      footer={
        <>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Visibility toggled (mock)', { description: 'Hidden from teammates' })}
          >
            <Icon.Lock className="h-3.5 w-3.5" /> Toggle visibility
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() => toast.success('Huddle started (mock)', { description: '6 teammates invited' })}
          >
            <Icon.Zap className="h-3.5 w-3.5" /> Start huddle
          </Button>
        </>
      }
    >
      <PanelHeader>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name / role / file" />
        <span className="ml-auto text-[11px] text-ink-3">
          {filtered.length} of {TEAMMATES.length} teammate{TEAMMATES.length === 1 ? '' : 's'}
        </span>
      </PanelHeader>

      <div className="grid grid-cols-[240px_1fr] divide-x divide-line">
        {/* Avatar grid */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toast(`Following ${t.name}`, { description: `${t.currentFile}:${t.currentLine}` })}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-sm border border-line bg-bg px-2 py-2 text-center hover:bg-bg-hover',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white',
                    t.status === 'editing' && 'ring-2 ring-offset-1 ring-offset-bg',
                    t.status === 'idle' && 'opacity-60',
                  )}
                  style={{
                    backgroundColor: t.color,
                    boxShadow:
                      t.status === 'idle'
                        ? `inset 0 0 0 2px white, 0 0 0 2px ${t.color}66`
                        : t.status === 'editing'
                          ? `0 0 0 2px ${t.color}`
                          : undefined,
                  }}
                >
                  {t.initials}
                </span>
                <span className="truncate text-[11px] font-medium text-ink-1" title={t.name}>
                  {t.name.split(' ')[0]}
                </span>
                <Chip tone={statusTone(t.status)} size="xs">
                  {STATUS_LABEL[t.status]}
                </Chip>
              </button>
            ))}
            {filtered.length === 0 ? (
              <div className="col-span-2 py-6 text-center text-[11px] text-ink-3">
                No teammates match.
              </div>
            ) : null}
          </div>
        </div>

        {/* Where everyone is */}
        <div className="min-w-0 p-3">
          <header className="mb-2 text-caps text-ink-3">Where everyone is</header>
          <div className="space-y-3">
            {grouped.map(([file, members]) => (
              <section key={file} className="rounded-sm border border-line bg-bg-subtle/40">
                <div className="flex items-center gap-2 px-2 py-1.5 hairline-b">
                  <Icon.File className="h-3 w-3 text-ink-3" />
                  <span className="truncate font-mono text-[11px] text-ink-1" title={file}>
                    {file}
                  </span>
                  <Chip tone="muted" size="xs" className="ml-auto">
                    {members.length}
                  </Chip>
                </div>
                <ul>
                  {members.map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-center gap-2 px-2 py-1 text-[11px] hover:bg-bg-hover"
                    >
                      <span
                        aria-hidden
                        className="font-mono text-base leading-none"
                        style={{ color: t.color }}
                      >
                        ▌
                      </span>
                      <span
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.initials}
                      </span>
                      <span className="truncate text-ink-1" title={t.name}>
                        {t.name}
                      </span>
                      <Tooltip content={STATUS_LABEL[t.status]}>
                        <span>
                          <Chip tone={statusTone(t.status)} size="xs">
                            {STATUS_LABEL[t.status]}
                          </Chip>
                        </span>
                      </Tooltip>
                      <span className="ml-auto font-mono text-[10px] text-ink-3">
                        L{t.currentLine}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          toast('Jumped to teammate', {
                            description: `${t.currentFile}:${t.currentLine}`,
                          })
                        }
                        className="rounded-sm border border-line bg-bg px-1 text-[10px] text-ink-2 opacity-0 hover:bg-bg-hover hover:text-ink-1 group-hover:opacity-100"
                      >
                        Jump
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {grouped.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-ink-3">No matches.</div>
            ) : null}
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
