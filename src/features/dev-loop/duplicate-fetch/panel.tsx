/**
 * Duplicate Fetch panel — renders the list of grouped duplicate fetches with
 * suggested loader hoist + per-call evidence rows.
 */

import { useEditorStore } from '@entities/editor';
import { Button, Chip, EmptyState, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useDuplicateFetchStore } from './store';
import type { DuplicateGroup } from './types';

const SEV_TONE: Record<DuplicateGroup['severity'], 'info' | 'warn' | 'err'> = {
  info: 'info',
  warn: 'warn',
  err: 'err',
};

function shortKey(key: string): string {
  // Prefer the URL part of the cache key for display.
  const parts = key.split('|');
  return parts[1] ?? key;
}

export function DuplicateFetchPanel() {
  const groups = useDuplicateFetchStore((s) => s.groups);
  const selectedKey = useDuplicateFetchStore((s) => s.selectedKey);
  const setSelected = useDuplicateFetchStore((s) => s.setSelected);
  const openTab = useEditorStore((s) => s.openTab);

  if (groups.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Icon.Net className="h-4 w-4" />}
          title="No duplicate fetches detected"
          description="Each fetch in the current waterfall has a unique cache key. Re-run the page or trigger a build to refresh."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] divide-x divide-line">
      <ul className="max-h-[520px] overflow-y-auto">
        {groups.map((g) => {
          const active = selectedKey === g.key;
          return (
            <li key={g.key}>
              <button
                type="button"
                onClick={() => setSelected(active ? null : g.key)}
                className={cn(
                  'flex w-full flex-col items-start gap-1 px-3 py-2 text-left hairline-b transition-colors duration-150',
                  active ? 'bg-bg-hover' : 'hover:bg-bg-hover',
                )}
              >
                <div className="flex w-full items-center gap-2">
                  <Chip tone={SEV_TONE[g.severity]} size="xs">
                    {g.calls.length}× duplicate
                  </Chip>
                  <span className="truncate font-mono text-[11px] text-ink-1">
                    {shortKey(g.key)}
                  </span>
                  <span className="ml-auto text-[10px] text-ink-3">
                    {g.callerCount} caller{g.callerCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pl-1">
                  {g.calls.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      className="rounded-sm border border-line bg-bg-subtle px-1 font-mono text-[10px] text-ink-3"
                    >
                      {c.file}:{c.line}
                    </span>
                  ))}
                  {g.calls.length > 4 && (
                    <span className="text-[10px] text-ink-3">
                      +{g.calls.length - 4} more
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <DetailsPane
        group={groups.find((g) => g.key === selectedKey) ?? null}
        onJump={(file, line) =>
          openTab({
            id: `dupfetch-${file}-${line}`,
            file,
            label: file.split('/').pop() ?? file,
          })
        }
      />
    </div>
  );
}

function DetailsPane({
  group,
  onJump,
}: {
  group: DuplicateGroup | null;
  onJump(file: string, line: number): void;
}) {
  if (!group) {
    return (
      <div className="p-3 text-[11px] text-ink-3">
        Select a duplicate group to see suggested fix.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <div className="text-caps text-ink-3">cache key</div>
        <div className="mt-1 break-all rounded-sm border border-line bg-bg-subtle px-2 py-1 font-mono text-[10px] text-ink-1">
          {group.key}
        </div>
      </div>
      <div>
        <div className="text-caps text-ink-3">callers</div>
        <ul className="mt-1 flex flex-col gap-0.5">
          {group.calls.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onJump(c.file, c.line)}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-0.5 text-left text-[11px] hover:bg-bg-hover"
              >
                <span className="truncate font-mono text-ink-1">{c.file}</span>
                <span className="font-mono text-ink-3">:{c.line}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-caps text-ink-3">suggestion</div>
        <p className="mt-1 text-[11px] text-ink-2">
          Hoist into a shared loader so React caches the call across components
          on the same render.
        </p>
        <div className="mt-1 break-all rounded-sm border border-dashed border-accent/40 bg-accent-soft/30 px-2 py-1 font-mono text-[10px] text-accent">
          {group.suggestedLoader}
        </div>
        <Button
          size="xs"
          tone="ghost"
          className="mt-2"
          onClick={() => onJump(group.suggestedLoader, 1)}
        >
          Open / scaffold loader
        </Button>
      </div>
    </div>
  );
}
