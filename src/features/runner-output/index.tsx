// Runner Output panel — terminal-like view of the latest build / typecheck /
// lint / test child process. Wired to `useRunnerStore` so it auto-updates as
// stdout/stderr/exit events stream from Tauri.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Icon, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { cn } from '@shared/lib/cn';
import {
  useRunnerStore,
  type RunnerKindLabel,
  type RunRecord,
} from '@shared/runner';

const TABS: ReadonlyArray<{ key: RunnerKindLabel; label: string }> = [
  { key: 'build', label: 'Build' },
  { key: 'typecheck', label: 'Type Check' },
  { key: 'lint', label: 'Lint' },
  { key: 'test', label: 'Test' },
  { key: 'e2e', label: 'E2E' },
];

const ANSI_RE = /\x1B\[[0-9;]*[A-Za-z]/g;

function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, '');
}

export function RunnerOutputPanel() {
  const ensureWired = useRunnerStore((s) => s.ensureWired);
  const startByLabel = useRunnerStore((s) => s.startByLabel);
  const stop = useRunnerStore((s) => s.stop);
  const runs = useRunnerStore((s) => s.runs);
  const active = useRunnerStore((s) => s.active);
  const latest = useRunnerStore((s) => s.latest);
  const lastError = useRunnerStore((s) => s.lastError);

  const [tab, setTab] = useState<RunnerKindLabel>('build');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void ensureWired();
  }, [ensureWired]);

  const runId = active[tab] ?? latest[tab]?.runId ?? null;
  const run: RunRecord | null = runId ? runs[runId] ?? null : null;

  const isRunning = !!active[tab];

  const lines = useMemo(() => run?.logs ?? [], [run]);

  // Autoscroll on new log lines.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const handleRun = () => {
    void startByLabel(tab);
  };
  const handleStop = () => {
    if (runId) void stop(runId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <PanelHeader>
        <Icon.Terminal className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-[11px] text-ink-3">runner</span>
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const status = latest[t.key]?.state;
            const dot =
              status === 'succeeded'
                ? 'bg-sem-static'
                : status === 'failed'
                  ? 'bg-sev-err'
                  : status === 'running'
                    ? 'bg-accent animate-pulse'
                    : 'bg-ink-3/40';
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-sm border border-transparent px-2 py-0.5 text-[11px] text-ink-2 hover:text-ink-1',
                  tab === t.key && 'border-line bg-bg text-ink-1',
                )}
              >
                <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dot)} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {isRunning ? (
            <Button size="xs" tone="ghost" onClick={handleStop}>
              <Icon.X className="h-3 w-3" />
              Stop
            </Button>
          ) : (
            <Button size="xs" tone="ghost" onClick={handleRun}>
              <Icon.Refresh className="h-3 w-3" />
              Run {TABS.find((t) => t.key === tab)?.label}
            </Button>
          )}
        </div>
      </PanelHeader>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          {lines.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-ink-3">
              {lastError
                ? lastError
                : isRunning
                  ? 'Starting…'
                  : `No ${tab} run yet. Click "Run" to start.`}
            </div>
          ) : (
            <pre className="m-0 px-3 py-2 font-mono text-[11px] leading-relaxed">
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2',
                    l.channel === 'stderr' && 'text-sev-warn',
                  )}
                >
                  <span className="text-ink-1">{stripAnsi(l.text)}</span>
                </div>
              ))}
            </pre>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default RunnerOutputPanel;
