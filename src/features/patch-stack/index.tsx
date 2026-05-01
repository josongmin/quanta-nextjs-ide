import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  HEALTH_CHECKS,
  KIND_TONE,
  STACK,
  STATUS_TONE,
  patchStats,
  type Patch,
} from './helpers';

export type { Patch, PatchFile, PatchKind, PatchStatus, HealthCheck } from './helpers';

export function PatchStackOverlay() {
  const open = useUiStore((s) => s.overlays.patchStack.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [order, setOrder] = useState<ReadonlyArray<string>>(() =>
    STACK.map((p) => p.id),
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => STACK[0]?.id ?? '',
  );

  const stack = useMemo<ReadonlyArray<Patch>>(() => {
    const byId = new Map(STACK.map((p) => [p.id, p]));
    return order
      .map((id) => byId.get(id))
      .filter((p): p is Patch => Boolean(p));
  }, [order]);

  const selected = useMemo<Patch | null>(
    () => stack.find((p) => p.id === selectedId) ?? stack[0] ?? null,
    [stack, selectedId],
  );

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      const a = next[idx];
      const b = next[swap];
      if (!a || !b) return prev;
      next[idx] = b;
      next[swap] = a;
      return next;
    });
    toast(`Reordered ${id} ${dir === -1 ? 'up' : 'down'}`);
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('patchStack')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Layers className="h-4 w-4 text-ink-3" />
          <span>Patch Stack</span>
        </span>
      }
      subtitle={`${stack.length} patches on top of main`}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {stack.length} patches · base: <span className="font-mono">main</span>
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Rebase onto main started (mock)')}
          >
            Rebase onto main
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast.success('Landed bottom-most patch (mock)', {
                description: stack[stack.length - 1]?.title ?? '',
              })
            }
          >
            Land bottom-most
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[340px_1fr_260px] divide-x divide-line">
        {/* Left rail: stack */}
        <aside className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
          <header className="mb-2 text-caps text-ink-3">Stack (top → base)</header>
          <ol className="space-y-1.5">
            {stack.map((p, idx) => {
              const stats = patchStats(p);
              const isSelected = selected?.id === p.id;
              return (
                <li key={p.id} className="relative">
                  {idx < stack.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute left-3 top-full block h-1.5 w-px bg-line"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-sm border border-line bg-bg p-2 text-left hover:bg-bg-subtle/40',
                      isSelected && 'border-accent/60 bg-accent-soft/30',
                    )}
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-line bg-bg-subtle text-[10px] font-mono text-ink-3">
                      ⋮⋮
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Chip tone={KIND_TONE[p.kind]} size="xs">
                          {p.kind}
                        </Chip>
                        <Chip tone={STATUS_TONE[p.status]} size="xs">
                          {p.status}
                        </Chip>
                        <span className="ml-auto font-mono text-[10px] text-ink-3">
                          {p.sha}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-[12px] text-ink-1">
                        {p.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-3">
                        <span className="text-sem-static">+{stats.added}</span>
                        <span className="text-sev-err">-{stats.removed}</span>
                        <span>· {stats.files} file{stats.files === 1 ? '' : 's'}</span>
                        <span className="ml-auto flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              move(p.id, -1);
                            }}
                            className="rounded-sm border border-line bg-bg px-1 text-ink-2 hover:bg-bg-hover"
                            aria-label="Move up"
                          >
                            <Icon.Up className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              move(p.id, 1);
                            }}
                            className="rounded-sm border border-line bg-bg px-1 text-ink-2 hover:bg-bg-hover"
                            aria-label="Move down"
                          >
                            <Icon.Down className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 p-2 text-[11px] text-ink-3">
            <Icon.Branch className="h-3 w-3" />
            <span className="font-mono">main</span>
            <span className="ml-auto">base</span>
          </div>
        </aside>

        {/* Main: detail */}
        <section className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
          {selected ? (
            <PatchDetail patch={selected} />
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-ink-3">
              Select a patch.
            </div>
          )}
        </section>

        {/* Right rail: stack health */}
        <aside className="min-w-0 max-h-[68vh] overflow-y-auto p-3">
          <header className="mb-2 text-caps text-ink-3">Stack health</header>
          <ul className="space-y-1.5">
            {HEALTH_CHECKS.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-2 rounded-sm border border-line bg-bg p-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                    c.ok
                      ? 'bg-sem-static-soft text-sem-static'
                      : 'bg-sev-err-soft text-sev-err',
                  )}
                >
                  {c.ok ? '✓' : '✗'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-ink-1">{c.label}</div>
                  <div className="text-[11px] text-ink-3">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-1">
            <Button
              size="sm"
              tone="default"
              onClick={() =>
                toast(`Sent PR for next patch (mock)`, {
                  description: stack[0]?.title ?? '',
                })
              }
            >
              Send PR for next
            </Button>
            <Button
              size="sm"
              tone="ghost"
              onClick={() => toast('Pushed all (mock)')}
            >
              Push all
            </Button>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function PatchDetail({ patch }: { patch: Patch }) {
  const stats = patchStats(patch);
  const action = (label: string, detail?: string) =>
    toast(label, detail ? { description: detail } : undefined);
  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Chip tone={KIND_TONE[patch.kind]} size="xs">
            {patch.kind}
          </Chip>
          <Chip tone={STATUS_TONE[patch.status]} size="xs">
            {patch.status}
          </Chip>
          <span className="font-mono text-[11px] text-ink-3">{patch.sha}</span>
          <span className="ml-auto text-[11px] text-ink-3">
            <span className="text-sem-static">+{stats.added}</span>
            <span className="ml-1 text-sev-err">-{stats.removed}</span>
            <span className="ml-1">· {stats.files} files</span>
          </span>
        </div>
        <h3 className="text-md font-semibold text-ink-1">{patch.title}</h3>
      </header>

      <CodeBlock
        code={patch.body}
        language="commit"
        showLineNumbers={false}
        maxHeight={140}
      />

      <section>
        <header className="mb-1 flex items-center gap-2 text-caps text-ink-3">
          Files
          <span className="font-mono text-[10px]">{patch.files.length}</span>
        </header>
        <ul className="divide-y divide-line rounded-sm border border-line bg-bg">
          {patch.files.map((f) => (
            <li
              key={f.path}
              className="flex items-center gap-2 px-2 py-1.5 text-[11px]"
            >
              <Icon.File className="h-3 w-3 text-ink-3" />
              <span className="truncate font-mono text-ink-1">{f.path}</span>
              <span className="ml-auto font-mono text-[10px]">
                <span className="text-sem-static">+{f.added}</span>{' '}
                <span className="text-sev-err">-{f.removed}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-1.5">
        <Button size="xs" tone="default" onClick={() => action('Pushed', patch.title)}>
          Push
        </Button>
        <Button size="xs" tone="ghost" onClick={() => action('Reword', patch.sha)}>
          Reword
        </Button>
        <Button size="xs" tone="ghost" onClick={() => action('Split', patch.sha)}>
          Split
        </Button>
        <Button
          size="xs"
          tone="ghost"
          onClick={() =>
            action('Squashed with parent', `${patch.sha} → ${patch.parent}`)
          }
        >
          Squash with parent
        </Button>
        <Button
          size="xs"
          tone="err"
          onClick={() => action('Dropped', patch.sha)}
        >
          Drop
        </Button>
      </section>
    </div>
  );
}
