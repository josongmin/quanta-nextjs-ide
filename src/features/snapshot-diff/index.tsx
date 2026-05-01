import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  lineDiff,
  snapshots,
  type LineDiffEntry,
  type SnapshotCase,
  type SnapshotKind,
} from './helpers';

const KIND_TONE: Record<SnapshotKind, 'accent' | 'info' | 'warn'> = {
  jsx: 'accent',
  json: 'info',
  image: 'warn',
};

function MiniDiffBar({ s }: { s: SnapshotCase }) {
  const total = Math.max(1, s.addedLines + s.removedLines);
  const addPct = (s.addedLines / total) * 100;
  const delPct = (s.removedLines / total) * 100;
  return (
    <span className="relative inline-block h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
      <span
        className="absolute left-0 top-0 h-full bg-sem-static"
        style={{ width: `${addPct}%` }}
      />
      <span
        className="absolute top-0 h-full bg-sev-err"
        style={{ left: `${addPct}%`, width: `${delPct}%` }}
      />
    </span>
  );
}

function SideBySideDiff({
  diff,
  side,
}: {
  diff: ReadonlyArray<LineDiffEntry>;
  side: 'before' | 'after';
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <div className="hairline-b bg-bg-subtle px-2 py-0.5 text-[10px] uppercase tracking-caps text-ink-3">
        {side}
      </div>
      <pre className="overflow-auto font-mono text-[11px] leading-[16px]">
        <code className="block">
          {diff.map((d, i) => {
            const visible =
              side === 'before' ? d.op !== 'add' : d.op !== 'del';
            const tone =
              side === 'before' && d.op === 'del'
                ? 'bg-sev-err-soft text-sev-err'
                : side === 'after' && d.op === 'add'
                  ? 'bg-sem-static-soft text-sem-static'
                  : 'text-ink-1';
            const lineNo =
              side === 'before' ? d.beforeNo : d.afterNo;
            return (
              <div
                key={i}
                className={cn(
                  'flex min-h-[16px] items-start whitespace-pre',
                  tone,
                  !visible && 'opacity-0',
                )}
              >
                <span
                  aria-hidden
                  className="sticky left-0 inline-block w-9 select-none border-r border-line bg-bg-subtle px-1.5 text-right text-ink-3"
                >
                  {lineNo ?? ''}
                </span>
                <span className="px-2">{d.text || ' '}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

function ImageDiff({ s }: { s: SnapshotCase }) {
  // Hand-rolled SVG before/after with diff regions.
  const seed = s.id.length;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-sm border border-line bg-bg p-2">
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          before
        </div>
        <svg viewBox="0 0 240 140" className="block w-full">
          <rect x="0" y="0" width="240" height="140" fill="hsl(var(--bg-subtle))" />
          <rect x="20" y="20" width="200" height="60" rx="4" fill="hsl(var(--accent-soft))" />
          <rect x="20" y="92" width="120" height="10" rx="2" fill="hsl(var(--ink-3))" opacity="0.4" />
          <rect x="20" y="108" width="80" height="8" rx="2" fill="hsl(var(--ink-3))" opacity="0.3" />
          <circle cx={180 + (seed % 8)} cy="106" r="10" fill="hsl(var(--accent))" opacity="0.6" />
        </svg>
      </div>
      <div className="rounded-sm border border-line bg-bg p-2 relative">
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          after
        </div>
        <svg viewBox="0 0 240 140" className="block w-full">
          <rect x="0" y="0" width="240" height="140" fill="hsl(var(--bg-subtle))" />
          <rect x="20" y="20" width="200" height="60" rx="4" fill="hsl(var(--accent-soft))" />
          <rect x="20" y="92" width="140" height="10" rx="2" fill="hsl(var(--ink-3))" opacity="0.4" />
          <rect x="20" y="108" width="100" height="8" rx="2" fill="hsl(var(--ink-3))" opacity="0.3" />
          <circle cx={196 + (seed % 8)} cy="106" r="10" fill="hsl(var(--accent))" opacity="0.6" />
          {/* diff regions */}
          <rect
            x="18"
            y="88"
            width="148"
            height="32"
            fill="none"
            stroke="hsl(var(--err))"
            strokeDasharray="3 2"
          />
          <rect
            x="180"
            y="92"
            width="36"
            height="28"
            fill="none"
            stroke="hsl(var(--err))"
            strokeDasharray="3 2"
          />
        </svg>
        <span className="absolute right-2 top-2 inline-flex h-4 items-center rounded-sm bg-sev-err-soft px-1 text-[10px] text-sev-err">
          2 diff regions
        </span>
      </div>
    </div>
  );
}

export function SnapshotDiffOverlay() {
  const open = useUiStore((s) => s.overlays.snapshotDiff.open);
  const requestedId = useUiStore((s) => s.overlays.snapshotDiff.testId);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeId, setActiveId] = useState<string>(
    snapshots[0]?.id ?? '',
  );
  const effective = requestedId ?? activeId;
  const active = useMemo(
    () => snapshots.find((s) => s.id === effective) ?? snapshots[0],
    [effective],
  );

  const diff = useMemo(
    () => (active ? lineDiff(active.beforeText, active.afterText) : []),
    [active],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('snapshotDiff'))}
      title="Snapshot Diff"
      subtitle={active ? active.file : undefined}
      size="lg"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Rejected snapshot update')}
          >
            Reject
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Updated snapshot inline')}
          >
            Update inline
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast(`Accepted ${snapshots.length} snapshots`)}
          >
            Accept all
          </Button>
        </>
      }
    >
      <div className="flex">
        <aside
          className="hairline-r bg-bg-subtle/40 py-2"
          style={{ width: 260 }}
        >
          <div className="px-3 pb-1 text-[10px] uppercase tracking-caps text-ink-3">
            {snapshots.length} snapshots
          </div>
          <ul>
            {snapshots.map((s) => {
              const sel = active?.id === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      'block w-full px-3 py-1.5 text-left hover:bg-bg-hover',
                      sel && 'bg-bg-selected',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-ink-1">
                        {s.testName}
                      </span>
                      <Chip tone={KIND_TONE[s.kind]} size="xs">
                        {s.kind}
                      </Chip>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <MiniDiffBar s={s} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                      <span className="text-sem-static">+{s.addedLines}</span>
                      <span className="text-sev-err">-{s.removedLines}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-3">
          {active ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-md text-ink-1">{active.testName}</div>
                  <div className="font-mono text-[10px] text-ink-3">
                    {active.file}
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-[11px]">
                  <Chip tone="static" size="xs">
                    +{active.addedLines}
                  </Chip>
                  <Chip tone="err" size="xs">
                    -{active.removedLines}
                  </Chip>
                </div>
              </div>
              {active.kind === 'image' ? (
                <ImageDiff s={active} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <SideBySideDiff diff={diff} side="before" />
                  <SideBySideDiff diff={diff} side="after" />
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-ink-3">
              No snapshot selected.
            </div>
          )}
        </div>
      </div>
    </OverlayPanel>
  );
}
