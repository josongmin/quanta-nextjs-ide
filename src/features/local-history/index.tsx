import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  FILES,
  SNAPSHOTS,
  lineDelta,
  oldestSnapshotAge,
  relativeTime,
  snapshotsForFile,
  type Snapshot,
  type SnapshotKind,
} from './helpers';

function labelTone(
  kind: SnapshotKind,
): 'accent' | 'info' | 'warn' | 'neutral' | 'static' {
  switch (kind) {
    case 'Edit':
      return 'info';
    case 'Save':
      return 'accent';
    case 'External change':
      return 'warn';
    case 'Labeled':
      return 'static';
  }
}

export function LocalHistoryOverlay() {
  const open = useUiStore((s) => s.overlays.localHistory.open);
  const requestedFile = useUiStore((s) => s.overlays.localHistory.file);
  const close = useUiStore((s) => s.closeOverlay);

  const initialFile = requestedFile && FILES.includes(requestedFile)
    ? requestedFile
    : FILES[0]!;

  const [file, setFile] = useState<string>(initialFile);
  const list = useMemo(() => snapshotsForFile(file), [file]);
  const [snapId, setSnapId] = useState<string>(() => list[0]?.id ?? '');
  const [labelDraft, setLabelDraft] = useState<string>('');

  const snap: Snapshot | undefined = useMemo(
    () => list.find((s) => s.id === snapId) ?? list[0],
    [list, snapId],
  );

  function chooseFile(f: string): void {
    setFile(f);
    const next = snapshotsForFile(f)[0];
    setSnapId(next ? next.id : '');
    setLabelDraft('');
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('localHistory')}
      title="Local History"
      subtitle="Auto file-level snapshots, independent of git"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">total snapshots:</span>{' '}
              <span className="font-mono text-ink-1">{SNAPSHOTS.length}</span>
            </span>
            <span>
              <span className="text-ink-2">oldest:</span>{' '}
              <span className="font-mono text-ink-1">{oldestSnapshotAge()}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Purged snapshots older than 7d (mock)')}
            >
              Purge older than 7d
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('localHistory')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: '260px 1fr 240px' }}
      >
        {/* Left rail: file picker + snapshot list */}
        <aside className="hairline-r">
          <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
            files
          </div>
          <ul className="px-1 py-1">
            {FILES.map((f) => {
              const active = f === file;
              const count = snapshotsForFile(f).length;
              const short = f.split('/').slice(-2).join('/');
              return (
                <li key={f}>
                  <button
                    onClick={() => chooseFile(f)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-bg-hover',
                      active && 'bg-bg-selected text-ink-1',
                    )}
                  >
                    <span className="truncate font-mono">{short}</span>
                    <span className="font-mono text-[10px] text-ink-3">
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b hairline-t bg-bg-subtle">
            snapshots ({list.length})
          </div>
          <ScrollArea className="max-h-[420px]">
            <ul className="px-1 py-1">
              {list.map((s) => {
                const active = s.id === (snap?.id ?? '');
                const d = lineDelta(s);
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSnapId(s.id)}
                      className={cn(
                        'flex w-full flex-col gap-0.5 rounded-sm px-2 py-1 text-left hover:bg-bg-hover',
                        active && 'bg-bg-selected',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Chip tone={labelTone(s.labelKind)} size="xs">
                          {s.labelKind}
                        </Chip>
                        <span className="ml-auto font-mono text-[10px] text-ink-3">
                          {relativeTime(s.ts)}
                        </span>
                      </span>
                      <span className="truncate text-[11px] text-ink-1">
                        {s.label}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-sem-static">+{d.adds}</span>
                        <span className="text-sev-err">-{d.removes}</span>
                        <span className="text-sev-info">~{d.mods}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </aside>

        {/* Main: side-by-side diff */}
        <section className="p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="font-mono text-ink-1">{file}</span>
            {snap ? (
              <>
                <span className="text-ink-3">·</span>
                <Chip tone={labelTone(snap.labelKind)} size="xs">
                  {snap.label}
                </Chip>
                <span className="text-ink-3">·</span>
                <span className="text-ink-3">{relativeTime(snap.ts)}</span>
              </>
            ) : null}
          </div>
          {snap ? (
            <>
              <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                    before
                  </div>
                  <CodeBlock
                    code={snap.contentBefore}
                    language="ts"
                    diff="before"
                    maxHeight={300}
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                    after
                  </div>
                  <CodeBlock
                    code={snap.contentAfter}
                    language="ts"
                    diff="after"
                    maxHeight={300}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-caps text-ink-3">
                  changed lines
                </span>
                {snap.changedLines.map((c) => (
                  <Chip
                    key={`${c.line}-${c.kind}`}
                    tone={
                      c.kind === 'add'
                        ? 'static'
                        : c.kind === 'remove'
                          ? 'err'
                          : 'info'
                    }
                    size="xs"
                  >
                    L{c.line}{' '}
                    {c.kind === 'add' ? '+' : c.kind === 'remove' ? '−' : '~'}
                  </Chip>
                ))}
                {snap.changedLines.length === 0 ? (
                  <span className="text-[11px] text-ink-3">no line changes</span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="px-2 py-6 text-center text-xs text-ink-3">
              No snapshots for this file.
            </div>
          )}
        </section>

        {/* Right rail: actions */}
        <aside className="hairline-l p-3">
          <div className="rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
              restore
            </div>
            <div className="space-y-1.5 p-2">
              <Button
                size="xs"
                tone="default"
                className="w-full justify-start"
                onClick={() =>
                  snap && toast(`Restored snapshot ${snap.label} (mock)`)
                }
              >
                Restore whole snapshot
              </Button>
              <Button
                size="xs"
                tone="soft"
                className="w-full justify-start"
                onClick={() =>
                  snap && toast(`Restored line range from ${snap.label} (mock)`)
                }
              >
                Restore line range
              </Button>
              <Button
                size="xs"
                tone="ghost"
                className="w-full justify-start"
                onClick={() =>
                  snap &&
                  toast(`Compared ${snap.label} with current buffer (mock)`)
                }
              >
                Compare with current
              </Button>
            </div>
          </div>

          <div className="mt-3 rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
              label this snapshot
            </div>
            <div className="space-y-1.5 p-2">
              <input
                type="text"
                placeholder="e.g. before refactor"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                className="h-6 w-full rounded-sm border border-line bg-bg px-1.5 text-xs text-ink-1 placeholder:text-ink-3 focus:outline-none focus:border-accent"
              />
              <Button
                size="xs"
                tone="accent"
                className="w-full justify-center"
                onClick={() => {
                  if (!snap) return;
                  toast(
                    `Saved label "${labelDraft || '(blank)'}" on ${snap.label}`,
                  );
                  setLabelDraft('');
                }}
              >
                Save label
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
