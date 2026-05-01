import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { getSourceForFile, mockSources } from '@shared/mocks';

const FILES = Object.keys(mockSources);

interface PaneProps {
  file: string;
  source: string;
  onPick(file: string): void;
  diffLines: Set<number>;
  diffMode: boolean;
  scrollRef: React.MutableRefObject<HTMLPreElement | null>;
  onScroll(top: number): void;
}

function Pane({ file, source, onPick, diffLines, diffMode, scrollRef, onScroll }: PaneProps) {
  const lines = source.split('\n');
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex h-7 shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-2">
        <Icon.File className="h-3 w-3 text-ink-3" />
        <select
          value={file}
          onChange={(e) => onPick(e.target.value)}
          className="min-w-0 truncate rounded-sm border border-line bg-bg px-1 py-0.5 font-mono text-[10px] text-ink-1 outline-none focus:border-accent"
        >
          {FILES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {lines.length} lines
        </span>
      </div>
      <pre
        ref={(node) => {
          scrollRef.current = node;
        }}
        onScroll={(e) => onScroll((e.target as HTMLPreElement).scrollTop)}
        className="flex-1 min-h-0 overflow-auto bg-bg font-mono text-[11px] leading-[16px]"
      >
        <code className="block">
          {lines.map((line, i) => {
            const ln = i + 1;
            const isDiff = diffMode && diffLines.has(ln);
            return (
              <div
                key={i}
                className={cn(
                  'flex min-h-[16px] items-start whitespace-pre',
                  isDiff && 'bg-sev-warn-soft/40',
                )}
              >
                <span
                  aria-hidden
                  className="sticky left-0 inline-block w-9 select-none border-r border-line bg-bg-subtle px-1.5 text-right text-ink-3"
                >
                  {ln}
                </span>
                <span className={cn('px-2', isDiff ? 'text-ink-1' : 'text-ink-1')}>
                  {line || ' '}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export function SplitEditorOverlay() {
  const open = useUiStore((s) => s.overlays.splitEditor.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [leftFile, setLeftFile] = useState<string>(FILES[0] ?? '');
  const [rightFile, setRightFile] = useState<string>(FILES[1] ?? FILES[0] ?? '');
  const [syncScroll, setSyncScroll] = useState(true);
  const [diffMode, setDiffMode] = useState(true);

  const leftRef = useRef<HTMLPreElement | null>(null);
  const rightRef = useRef<HTMLPreElement | null>(null);
  const ignoreNext = useRef<'left' | 'right' | null>(null);

  const leftSource = useMemo(() => getSourceForFile(leftFile), [leftFile]);
  const rightSource = useMemo(() => getSourceForFile(rightFile), [rightFile]);

  const { leftDiff, rightDiff } = useMemo(() => {
    const l = leftSource.split('\n');
    const r = rightSource.split('\n');
    const max = Math.max(l.length, r.length);
    const leftSet = new Set<number>();
    const rightSet = new Set<number>();
    for (let i = 0; i < max; i++) {
      const lv = l[i];
      const rv = r[i];
      if (lv === undefined && rv !== undefined) {
        rightSet.add(i + 1);
      } else if (rv === undefined && lv !== undefined) {
        leftSet.add(i + 1);
      } else if (lv !== rv) {
        leftSet.add(i + 1);
        rightSet.add(i + 1);
      }
    }
    return { leftDiff: leftSet, rightDiff: rightSet };
  }, [leftSource, rightSource]);

  useEffect(() => {
    if (!open) return;
    // reset scroll positions when re-opened so panes start aligned
    if (leftRef.current) leftRef.current.scrollTop = 0;
    if (rightRef.current) rightRef.current.scrollTop = 0;
  }, [open]);

  const onLeftScroll = (top: number) => {
    if (!syncScroll || !rightRef.current) return;
    if (ignoreNext.current === 'left') {
      ignoreNext.current = null;
      return;
    }
    ignoreNext.current = 'right';
    rightRef.current.scrollTop = top;
  };
  const onRightScroll = (top: number) => {
    if (!syncScroll || !leftRef.current) return;
    if (ignoreNext.current === 'right') {
      ignoreNext.current = null;
      return;
    }
    ignoreNext.current = 'left';
    leftRef.current.scrollTop = top;
  };

  const diffCount = leftDiff.size + rightDiff.size;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('splitEditor'))}
      title="Split Editor"
      subtitle="side-by-side compare"
      size="xl"
      footer={
        <Button
          size="xs"
          tone="accent"
          onClick={() => toast(`Open ${leftFile} and ${rightFile} in editor`)}
        >
          <Icon.UpRight className="h-3 w-3" />
          Open in editor
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <button
          type="button"
          onClick={() => setSyncScroll((v) => !v)}
          aria-pressed={syncScroll}
          className={cn(
            'inline-flex h-6 items-center gap-1.5 rounded-sm border px-2 text-[11px]',
            syncScroll
              ? 'border-accent/60 bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
          )}
        >
          <Icon.Link className="h-3 w-3" />
          Sync scroll
        </button>
        <button
          type="button"
          onClick={() => setDiffMode((v) => !v)}
          aria-pressed={diffMode}
          className={cn(
            'inline-flex h-6 items-center gap-1.5 rounded-sm border px-2 text-[11px]',
            diffMode
              ? 'border-accent/60 bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
          )}
        >
          <Icon.Branch className="h-3 w-3" />
          Diff highlight
        </button>
        {diffMode ? (
          <Chip tone="warn" size="xs">
            {diffCount} differing lines
          </Chip>
        ) : null}
        <span className="ml-auto text-[10px] text-ink-3">
          synced via wheel + scrollbar
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 divide-x divide-line" style={{ height: '60vh' }}>
        <Pane
          file={leftFile}
          source={leftSource}
          onPick={setLeftFile}
          diffLines={leftDiff}
          diffMode={diffMode}
          scrollRef={leftRef}
          onScroll={onLeftScroll}
        />
        <Pane
          file={rightFile}
          source={rightSource}
          onPick={setRightFile}
          diffLines={rightDiff}
          diffMode={diffMode}
          scrollRef={rightRef}
          onScroll={onRightScroll}
        />
      </div>
    </OverlayPanel>
  );
}
