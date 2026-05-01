import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { KvRow } from '@widgets/right-panel/parts';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  AGENTS,
  STATUSES,
  TASKS,
  agentTone,
  fmtClock,
  fmtDuration,
  levelClass,
  statusTone,
  type AgentKind,
  type AgentTask,
  type TaskStatus,
} from './helpers';

const STATUS_GLYPH: Record<TaskStatus, string> = {
  queued: '·',
  running: '►',
  paused: '‖',
  done: '✓',
  failed: '✕',
};

export function AgentQueueOverlay() {
  const open = useUiStore((s) => s.overlays.agentQueue.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [statusFilter, setStatusFilter] = useState<ReadonlyArray<TaskStatus>>([]);
  const [agentFilter, setAgentFilter] = useState<ReadonlyArray<AgentKind>>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(TASKS[0]?.id ?? '');

  const filtered = useMemo<ReadonlyArray<AgentTask>>(() => {
    const q = search.trim().toLowerCase();
    return TASKS.filter((t) => {
      if (statusFilter.length > 0 && !statusFilter.includes(t.status)) {
        // also include parents whose children match? keep simple per-row filter
        return false;
      }
      if (agentFilter.length > 0 && !agentFilter.includes(t.agent)) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [statusFilter, agentFilter, search]);

  const selected = useMemo(
    () =>
      TASKS.find((t) => t.id === selectedId) ?? filtered[0] ?? TASKS[0] ?? null,
    [selectedId, filtered],
  );

  const stats = useMemo(() => {
    const running = TASKS.filter((t) => t.status === 'running').length;
    const queued = TASKS.filter((t) => t.status === 'queued').length;
    const totalCost = TASKS.reduce((acc, t) => acc + t.costUSD, 0);
    return { running, queued, totalCost };
  }, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('agentQueue'))}
      title="Agent Queue"
      subtitle="Autonomous task tree · 5 parents"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            <Chip tone="accent" size="xs">
              {stats.running} running
            </Chip>
            <Chip tone="muted" size="xs">
              {stats.queued} queued
            </Chip>
            <span className="font-mono text-ink-2">
              total ${stats.totalCost.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Spawn new task (mock)')}
            >
              Spawn new task
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('agentQueue')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="search tasks…"
          className="w-44"
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          status
        </span>
        {STATUSES.map((s) => (
          <ToggleChip
            key={s}
            active={statusFilter.includes(s)}
            onClick={() =>
              setStatusFilter((prev) =>
                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
              )
            }
          >
            {s}
          </ToggleChip>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          agent
        </span>
        {AGENTS.map((a) => (
          <ToggleChip
            key={a}
            active={agentFilter.includes(a)}
            onClick={() =>
              setAgentFilter((prev) =>
                prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
              )
            }
          >
            {a}
          </ToggleChip>
        ))}
      </PanelHeader>

      <div className="grid grid-cols-[360px_1fr] divide-x divide-line">
        {/* Task tree */}
        <div className="max-h-[60vh] overflow-y-auto">
          <ul className="divide-y divide-line">
            {filtered.map((t) => {
              const isChild = t.parentId !== null;
              const isSelected = t.id === selected?.id;
              return (
                <li
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    'cursor-pointer px-3 py-1.5 text-xs hover:bg-bg-hover',
                    isSelected && 'bg-accent-soft/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isChild && (
                      <span className="ml-2 text-ink-3" aria-hidden>
                        └
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        'inline-flex h-4 w-4 items-center justify-center rounded-sm border border-line bg-bg text-[10px]',
                        t.status === 'running' && 'text-accent',
                        t.status === 'failed' && 'text-sev-err',
                        t.status === 'done' && 'text-sev-info',
                        t.status === 'paused' && 'text-sev-warn',
                      )}
                    >
                      {STATUS_GLYPH[t.status]}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate',
                        isChild ? 'text-ink-2' : 'font-medium text-ink-1',
                      )}
                      title={t.title}
                    >
                      {t.title}
                    </span>
                    <Chip tone={agentTone(t.agent)} size="xs">
                      {t.agent}
                    </Chip>
                  </div>
                  <div className="mt-1 ml-6 flex items-center gap-2">
                    <div
                      className="h-1 w-24 overflow-hidden rounded-full bg-bg-subtle"
                      aria-label="progress"
                    >
                      <div
                        className={cn(
                          'h-full',
                          t.status === 'failed' ? 'bg-sev-err' : 'bg-accent',
                        )}
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-ink-3">
                      {t.progress}%
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-ink-3">
                      {fmtDuration(t.durationMs)}
                    </span>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-8 text-center text-[11px] text-ink-3">
                No tasks match.
              </li>
            )}
          </ul>
        </div>

        {/* Detail */}
        <aside className="max-h-[60vh] overflow-y-auto">
          {selected ? (
            <div className="px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    {selected.parentId === null ? 'Parent task' : 'Sub-task'}
                  </div>
                  <div className="mt-0.5 text-md font-medium text-ink-1">
                    {selected.title}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Chip tone={statusTone(selected.status)} size="xs">
                    {selected.status}
                  </Chip>
                  <Chip tone={agentTone(selected.agent)} size="xs">
                    {selected.agent}
                  </Chip>
                </div>
              </div>

              <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1.5">
                <KvRow label="started">
                  <span className="font-mono text-xs">
                    {fmtClock(selected.startedAt)} UTC
                  </span>
                </KvRow>
                <KvRow label="duration">
                  <span className="font-mono text-xs">
                    {fmtDuration(selected.durationMs)}
                  </span>
                </KvRow>
                <KvRow label="progress">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg">
                      <div
                        className={cn(
                          'h-full',
                          selected.status === 'failed'
                            ? 'bg-sev-err'
                            : 'bg-accent',
                        )}
                        style={{ width: `${selected.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-ink-1">
                      {selected.progress}%
                    </span>
                  </div>
                </KvRow>
                <KvRow label="cost">
                  <span className="font-mono text-xs">
                    ${selected.costUSD.toFixed(2)}
                  </span>
                </KvRow>
                <KvRow label="tok in">
                  <span className="font-mono text-xs">
                    {selected.tokensIn.toLocaleString()}
                  </span>
                </KvRow>
                <KvRow label="tok out">
                  <span className="font-mono text-xs">
                    {selected.tokensOut.toLocaleString()}
                  </span>
                </KvRow>
              </div>

              <div className="mt-3">
                <h4 className="text-caps text-ink-3">Recent activity</h4>
                <ul className="mt-1 divide-y divide-line rounded-sm border border-line">
                  {selected.log.map((l, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 px-2 py-1 text-xs"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                          levelClass(l.level),
                        )}
                      />
                      <span className="font-mono text-[10px] text-ink-3">
                        {fmtClock(l.ts)}
                      </span>
                      <span className="min-w-0 flex-1 text-ink-1">{l.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="xs"
                  tone="warn"
                  onClick={() => toast(`Paused ${selected.id}`)}
                >
                  Pause
                </Button>
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Resumed ${selected.id}`)}
                >
                  Resume
                </Button>
                <Button
                  size="xs"
                  tone="err"
                  onClick={() => toast(`Cancelled ${selected.id}`)}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  tone="soft"
                  onClick={() => toast('Branched from this task (mock)')}
                >
                  Branch from here
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 text-xs text-ink-3">
              Select a task to inspect.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
