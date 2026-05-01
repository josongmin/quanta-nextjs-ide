import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  ACTION_LABEL,
  ACTION_TONE,
  CONFLICT_LABEL,
  CONFLICT_TONE,
  REBASE_COMMITS,
  projectRebase,
  type RebaseAction,
  type RebaseCommit,
} from './helpers';

export type {
  ConflictPrediction,
  ProjectedCommit,
  RebaseAction,
  RebaseCommit,
} from './helpers';

const ACTION_OPTIONS: ReadonlyArray<{ value: RebaseAction; label: string }> = [
  { value: 'pick', label: 'pick' },
  { value: 'reword', label: 'reword' },
  { value: 'edit', label: 'edit' },
  { value: 'squash', label: 'squash' },
  { value: 'fixup', label: 'fixup' },
  { value: 'drop', label: 'drop' },
];

export function InteractiveRebaseOverlay() {
  const open = useUiStore((s) => s.overlays.interactiveRebase.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [target, setTarget] = useState<string>('main');
  const [order, setOrder] = useState<ReadonlyArray<string>>(() =>
    REBASE_COMMITS.map((c) => c.id),
  );
  const [actions, setActions] = useState<Record<string, RebaseAction>>(() =>
    Object.fromEntries(REBASE_COMMITS.map((c) => [c.id, c.defaultAction])),
  );
  const [messages, setMessages] = useState<Record<string, string>>(() =>
    Object.fromEntries(REBASE_COMMITS.map((c) => [c.id, c.message])),
  );

  const commits = useMemo<ReadonlyArray<RebaseCommit>>(() => {
    const byId = new Map(REBASE_COMMITS.map((c) => [c.id, c]));
    return order.map((id) => byId.get(id)).filter((c): c is RebaseCommit => Boolean(c));
  }, [order]);

  const projected = useMemo(
    () => projectRebase(commits, actions, messages),
    [commits, actions, messages],
  );

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const swap = idx + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      const a = next[idx];
      const b = next[swap];
      if (!a || !b) return prev;
      next[idx] = b;
      next[swap] = a;
      return next;
    });
  }

  function setAction(id: string, action: RebaseAction) {
    setActions((prev) => ({ ...prev, [id]: action }));
  }

  function setMessage(id: string, message: string) {
    setMessages((prev) => ({ ...prev, [id]: message }));
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('interactiveRebase')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Branch className="h-4 w-4 text-ink-3" />
          <span>Interactive Rebase</span>
        </span>
      }
      subtitle={`${commits.length} commits · onto ${target}`}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {projected.length} commit{projected.length === 1 ? '' : 's'} after rebase
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Saved rebase plan to continue later (mock)')}
          >
            Save and continue later
          </Button>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Rebase aborted')}
          >
            Abort
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast.success('Rebase applied (mock)', {
                description: `${projected.length} commits onto ${target}`,
              })
            }
          >
            Apply rebase
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <span className="text-caps text-ink-3">Onto</span>
        <label className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px]">
          <span className="text-ink-3">ref:</span>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-32 bg-transparent font-mono text-[11px] text-ink-1 focus:outline-none"
          />
        </label>
        <Button
          size="xs"
          tone="ghost"
          className="ml-auto"
          onClick={() => toast('Editor opened (mock)')}
        >
          <Icon.Code className="h-3 w-3" /> Open editor
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="min-w-0 max-h-[64vh] overflow-y-auto p-3">
          <header className="mb-2 flex items-center gap-2 text-caps text-ink-3">
            <span>Plan</span>
            <span className="font-mono text-[10px]">top → base</span>
          </header>
          <ol className="space-y-1">
            {commits.map((c, idx) => {
              const action = actions[c.id] ?? c.defaultAction;
              const nested = action === 'squash' || action === 'fixup';
              const isReword = action === 'reword';
              return (
                <li
                  key={c.id}
                  className={cn(
                    'rounded-sm border border-line bg-bg p-2',
                    nested && 'ml-6 border-l-2 border-l-accent/40',
                  )}
                >
                  {nested ? (
                    <span
                      aria-hidden
                      className="absolute -ml-6 mt-3 inline-block h-px w-4 bg-line"
                    />
                  ) : null}
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-line bg-bg-subtle text-[10px] font-mono text-ink-3"
                      title="drag handle"
                    >
                      ⋮⋮
                    </span>
                    <SelectControl<RebaseAction>
                      value={action}
                      options={ACTION_OPTIONS}
                      onChange={(v) => setAction(c.id, v)}
                    />
                    <Chip tone={ACTION_TONE[action]} size="xs">
                      {ACTION_LABEL[action]}
                    </Chip>
                    <span className="font-mono text-[10px] text-ink-3">{c.sha}</span>
                    <Chip
                      tone={CONFLICT_TONE[c.conflict]}
                      size="xs"
                      className="ml-1"
                    >
                      {CONFLICT_LABEL[c.conflict]}
                    </Chip>
                    <span className="ml-auto flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(c.id, -1)}
                        disabled={idx === 0}
                        className="rounded-sm border border-line bg-bg px-1 text-ink-2 hover:bg-bg-hover disabled:opacity-40"
                        aria-label="Move up"
                      >
                        <Icon.Up className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(c.id, 1)}
                        disabled={idx === commits.length - 1}
                        className="rounded-sm border border-line bg-bg px-1 text-ink-2 hover:bg-bg-hover disabled:opacity-40"
                        aria-label="Move down"
                      >
                        <Icon.Down className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toast(`Diff for ${c.sha} (mock)`, {
                            description: c.message,
                          })
                        }
                        className="rounded-sm border border-line bg-bg px-1.5 py-[1px] text-[10px] text-ink-2 hover:bg-bg-hover"
                      >
                        Open diff
                      </button>
                    </span>
                  </div>
                  <div className="mt-1.5 ml-7">
                    {isReword ? (
                      <input
                        type="text"
                        value={messages[c.id] ?? ''}
                        onChange={(e) => setMessage(c.id, e.target.value)}
                        className="w-full rounded-sm border border-accent/40 bg-accent-soft/30 px-1.5 py-0.5 font-mono text-[11px] text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    ) : (
                      <span className="block truncate font-mono text-[11px] text-ink-1">
                        {messages[c.id] ?? c.message}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Right rail: preview */}
        <aside className="min-w-0 max-h-[64vh] overflow-y-auto p-3">
          <header className="mb-2 text-caps text-ink-3">Preview</header>
          <ol className="space-y-1">
            {projected.map((p, i) => (
              <li
                key={`${p.sha}-${i}`}
                className={cn(
                  'flex items-center gap-1.5 rounded-sm border border-line bg-bg px-2 py-1 text-[11px]',
                  p.nested && 'ml-4 border-l-2 border-l-accent/40',
                )}
              >
                <Chip tone={ACTION_TONE[p.action]} size="xs">
                  {ACTION_LABEL[p.action]}
                </Chip>
                <span className="font-mono text-[10px] text-ink-3">{p.sha}</span>
                <span className="truncate font-mono text-[11px] text-ink-1">
                  {p.message.split('\n')[0] ?? ''}
                </span>
              </li>
            ))}
          </ol>
          <header className="mb-2 mt-4 text-caps text-ink-3">Conflict prediction</header>
          <ul className="space-y-1">
            {commits
              .filter((c) => c.conflict !== 'none')
              .map((c) => (
                <li
                  key={`pred-${c.id}`}
                  className="flex items-center gap-1.5 rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                >
                  <span className="font-mono text-[10px] text-ink-3">{c.sha}</span>
                  <span className="truncate text-ink-1">{c.message}</span>
                  <Chip tone={CONFLICT_TONE[c.conflict]} size="xs" className="ml-auto">
                    {CONFLICT_LABEL[c.conflict]}
                  </Chip>
                </li>
              ))}
            {commits.every((c) => c.conflict === 'none') ? (
              <li className="rounded-sm border border-dashed border-line bg-bg-subtle/40 p-2 text-center text-[11px] text-ink-3">
                No conflicts predicted.
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
