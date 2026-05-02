import { useEffect } from 'react';
import { match } from 'ts-pattern';
import { useUiStore, type BottomTab } from '@entities/ui-shell';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useSemanticDiffStore } from '@entities/semantic-diff';
import { cn } from '@shared/lib/cn';
import { ProblemsTab } from './tabs/problems-tab';
import { SemanticDiffTab } from './tabs/semantic-diff-tab';
import { RoutesTab } from './tabs/routes-tab';
import { CacheLineageTab } from './tabs/cache-lineage-tab';
import { BundleTab } from './tabs/bundle-tab';
import { LiveTab } from './tabs/live-tab';
import { OutputTab } from './tabs/output-tab';
import { TerminalTab } from './tabs/terminal-tab';
import { RunnerOutputPanel } from '@features/runner-output';
import {
  CacheStateTab,
  LiveEventsTab,
  TraceGraphTab,
  registerLiveBottomTabs,
} from '@features/live-bottom-tabs';

const tabs: Array<{ key: BottomTab; label: string }> = [
  { key: 'problems', label: 'Problems' },
  { key: 'semantic-diff', label: 'Semantic Diff' },
  { key: 'routes', label: 'Routes' },
  { key: 'cache-lineage', label: 'Cache Lineage' },
  { key: 'bundle', label: 'Bundle · Vitals' },
  { key: 'live', label: 'Live · Logs' },
  { key: 'output', label: 'Output' },
  { key: 'terminal', label: 'Terminal' },
  { key: 'runner', label: 'Runner' },
  { key: 'live-events', label: 'Live Events' },
  { key: 'cache-state', label: 'Cache State' },
  { key: 'trace-graph', label: 'Trace' },
];

export function BottomPanel() {
  const tab = useUiStore((s) => s.bottomTab);
  const setTab = useUiStore((s) => s.setBottomTab);
  const diagCount = useDiagnosticStore((s) => s.diagnostics.length);
  const diffCount = useSemanticDiffStore((s) => s.diff.entries.length);

  useEffect(() => {
    const reg = registerLiveBottomTabs();
    return () => reg.detach();
  }, []);

  return (
    <section
      role="region"
      aria-label="Bottom panel"
      className="flex h-full min-h-0 flex-col bg-bg"
    >
      <div className="flex h-9 shrink-0 items-stretch hairline-b bg-bg-subtle">
        {tabs.map((t) => {
          const active = tab === t.key;
          const badge =
            t.key === 'problems'
              ? diagCount
              : t.key === 'semantic-diff'
                ? diffCount
                : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={active}
              className={cn(
                'mi-press mi-underline mi-focus-ring',
                'group relative inline-flex h-9 items-center gap-1.5 px-3 text-sm text-ink-2 hover:text-ink-1',
                active && 'text-ink-1 font-medium',
              )}
            >
              <span>{t.label}</span>
              {badge != null && badge > 0 && (
                <span className="rounded-sm border border-line bg-bg px-1 text-[10px] font-semibold text-ink-2">
                  {badge}
                </span>
              )}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-px bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {match(tab)
          .with('problems', () => <ProblemsTab />)
          .with('semantic-diff', () => <SemanticDiffTab />)
          .with('routes', () => <RoutesTab />)
          .with('cache-lineage', () => <CacheLineageTab />)
          .with('bundle', () => <BundleTab />)
          .with('live', () => <LiveTab />)
          .with('output', () => <OutputTab />)
          .with('terminal', () => <TerminalTab />)
          .with('runner', () => <RunnerOutputPanel />)
          .with('live-events', () => <LiveEventsTab />)
          .with('cache-state', () => <CacheStateTab />)
          .with('trace-graph', () => <TraceGraphTab />)
          .exhaustive()}
      </div>
    </section>
  );
}
