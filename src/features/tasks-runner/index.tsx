import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  TASKS_INITIAL,
  TASK_KINDS,
  fmtDuration,
  outputFor,
  statusTone,
  type Task,
  type TaskKind,
} from './helpers';

export function TasksRunnerOverlay() {
  const open = useUiStore((s) => s.overlays.tasksRunner.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [tasks, setTasks] = useState<ReadonlyArray<Task>>(TASKS_INITIAL);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] =
    useState<ReadonlyArray<TaskKind>>(TASK_KINDS);
  const [selectedId, setSelectedId] = useState<string>(
    TASKS_INITIAL[0]?.id ?? '',
  );
  const [quickOpen, setQuickOpen] = useState(false);
  const [runsToday, setRunsToday] = useState(14);

  const filtered = useMemo<ReadonlyArray<Task>>(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (!kindFilter.includes(t.kind)) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.command.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [tasks, search, kindFilter]);

  const running = tasks.filter((t) => t.runningPid !== null);

  const selected = useMemo(
    () =>
      tasks.find((t) => t.id === selectedId) ?? filtered[0] ?? tasks[0] ?? null,
    [selectedId, tasks, filtered],
  );

  const runTask = (t: Task) => {
    setRunsToday((n) => n + 1);
    setTasks((prev) =>
      prev.map((p) =>
        p.id === t.id
          ? {
              ...p,
              runningPid: 90_000 + Math.floor(Math.random() * 999),
              lastRun: { ...p.lastRun, status: 'running' },
            }
          : p,
      ),
    );
    toast(`Running ${t.name}`);
    // settle locally (mock).
    window.setTimeout(() => {
      setTasks((prev) =>
        prev.map((p) =>
          p.id === t.id
            ? {
                ...p,
                runningPid: null,
                lastRun: {
                  status: 'success',
                  durationMs: 1_200 + Math.floor(Math.random() * 800),
                  exit: 0,
                },
              }
            : p,
        ),
      );
    }, 800);
  };

  const stopTask = (t: Task) => {
    setTasks((prev) =>
      prev.map((p) =>
        p.id === t.id
          ? {
              ...p,
              runningPid: null,
              lastRun: { ...p.lastRun, status: 'idle' },
            }
          : p,
      ),
    );
    toast(`Stopped ${t.name}`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('tasksRunner'))}
      title="Tasks · npm scripts & custom"
      subtitle={`${tasks.length} tasks · ${running.length} running`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            {running.length === 0 ? (
              <span className="text-ink-3">no tasks running</span>
            ) : (
              running.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-bg px-1.5 py-0.5"
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
                    aria-hidden
                  />
                  <span className="font-mono text-[10px] text-ink-1">
                    {t.name}
                  </span>
                  <span className="font-mono text-[10px] text-ink-3">
                    pid {t.runningPid}
                  </span>
                  <button
                    type="button"
                    onClick={() => stopTask(t)}
                    className="rounded-sm px-1 text-[10px] text-sev-err hover:bg-sev-err-soft"
                  >
                    stop
                  </button>
                </span>
              ))
            )}
            <span className="font-mono text-ink-2">runs today: {runsToday}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="accent"
              onClick={() => toast('Running pre-commit chain (mock)')}
            >
              Run pre-commit chain
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('tasksRunner')}>
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
          kind
        </span>
        {TASK_KINDS.map((k) => (
          <ToggleChip
            key={k}
            active={kindFilter.includes(k)}
            onClick={() =>
              setKindFilter((prev) =>
                prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
              )
            }
          >
            {k}
          </ToggleChip>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        <Popover open={quickOpen} onOpenChange={setQuickOpen}>
          <PopoverTrigger asChild>
            <Button size="xs" tone="default">
              ▶ Run quickly…
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0">
            <ul className="max-h-72 overflow-y-auto py-1">
              {tasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      runTask(t);
                      setQuickOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-xs hover:bg-bg-hover"
                  >
                    <span className="font-medium text-ink-1">{t.name}</span>
                    <span className="font-mono text-[10px] text-ink-3">
                      {t.kbd}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="max-h-[64vh] overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((t) => {
              const isSel = t.id === selected?.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    'cursor-pointer rounded-sm border border-line bg-bg p-2 hover:border-line-strong',
                    isSel && 'border-accent ring-1 ring-accent/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-sm text-ink-1 truncate">
                        {t.name}
                      </span>
                      <Chip
                        tone={t.kind === 'npm' ? 'info' : 'muted'}
                        size="xs"
                      >
                        {t.kind}
                      </Chip>
                    </div>
                    <Chip tone={statusTone(t.lastRun.status)} size="xs">
                      {t.lastRun.status}
                    </Chip>
                  </div>
                  <div className="mt-1.5">
                    <CodeBlock
                      code={t.command}
                      language="sh"
                      showLineNumbers={false}
                      maxHeight={28}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-3">
                    <span className="font-mono">
                      {fmtDuration(t.lastRun.durationMs)} · exit {t.lastRun.exit}
                    </span>
                    <span className="font-mono">{t.kbd}</span>
                  </div>
                  <div className="mt-1.5 flex justify-end gap-1">
                    {t.runningPid !== null ? (
                      <Button
                        size="xs"
                        tone="err"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopTask(t);
                        }}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        tone="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          runTask(t);
                        }}
                      >
                        ▶ Run
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-3 px-3 py-8 text-center text-[11px] text-ink-3">
                No tasks match.
              </div>
            )}
          </div>
        </div>

        <aside className="max-h-[64vh] overflow-y-auto bg-bg-subtle">
          {selected ? (
            <div className="px-3 py-3">
              <div className="text-caps mb-1 text-[10px] uppercase text-ink-3">
                Output · {selected.name}
              </div>
              <CodeBlock
                code={outputFor(selected)}
                language="log"
                showLineNumbers={false}
                maxHeight={420}
              />
              <div className="mt-2 flex flex-wrap gap-1">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => runTask(selected)}
                >
                  ▶ Re-run
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast('Cleared output (mock)')}
                >
                  Clear
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast('Output copied (mock)')}
                >
                  Copy log
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-xs text-ink-3">
              Select a task to view output.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
