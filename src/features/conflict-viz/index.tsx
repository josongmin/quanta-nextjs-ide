import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import { FILES, type Conflict, type ConflictFile, type SideEdit } from './helpers';

export type { Conflict, ConflictFile, SideEdit } from './helpers';

const CODE_LINE = 'flex items-start gap-2 whitespace-pre px-2 py-0 font-mono text-[11px] leading-[16px]';

function CodeColumn({
  title,
  author,
  lines,
  tone,
}: {
  title: string;
  author?: string;
  lines: ReadonlyArray<{ text: string; mark: 'add' | 'remove' | 'none' }>;
  tone: 'yours' | 'base' | 'theirs';
}) {
  const headTone =
    tone === 'yours'
      ? 'bg-sev-err-soft/40 text-sev-err'
      : tone === 'theirs'
        ? 'bg-sev-info-soft text-sev-info'
        : 'bg-bg-subtle text-ink-2';
  return (
    <div className="min-w-0 rounded-sm border border-line bg-bg">
      <header className={cn('flex items-center gap-2 px-2 py-1 hairline-b', headTone)}>
        <span className="text-caps">{title}</span>
        {author ? <span className="ml-auto font-mono text-[10px]">{author}</span> : null}
      </header>
      <pre className="overflow-x-auto py-1">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              CODE_LINE,
              l.mark === 'add' && 'bg-bg-subtle text-sem-static',
              l.mark === 'remove' && 'bg-sev-err-soft/50 text-sev-err',
              l.mark === 'none' && 'text-ink-1',
            )}
          >
            <span aria-hidden className="w-3 select-none text-ink-3">
              {l.mark === 'add' ? '+' : l.mark === 'remove' ? '-' : ' '}
            </span>
            <span className="flex-1">{l.text || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

function Connector({ count }: { count: number }) {
  // Hand-rolled SVG: draw `count` curves connecting LHS edge to RHS edge.
  const w = 64;
  const h = Math.max(120, count * 80);
  const stops = Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="mx-auto" aria-hidden>
      {stops.map((s, i) => {
        const y = s * h;
        return (
          <path
            key={i}
            d={`M0 ${y} C ${w * 0.4} ${y - 14}, ${w * 0.6} ${y + 14}, ${w} ${y}`}
            stroke="currentColor"
            strokeWidth={1}
            fill="none"
            className="text-line"
          />
        );
      })}
      {stops.map((s, i) => {
        const y = s * h;
        return (
          <g key={`d-${i}`}>
            <circle cx={0} cy={y} r={2.5} className="fill-sev-err" />
            <circle cx={w} cy={y} r={2.5} className="fill-sem-static" />
          </g>
        );
      })}
    </svg>
  );
}

function diffLines(side: SideEdit): ReadonlyArray<{ text: string; mark: 'add' | 'remove' | 'none' }> {
  const removeSet = new Set(side.removed);
  const addSet = new Set(side.added);
  const out: Array<{ text: string; mark: 'add' | 'remove' | 'none' }> = [];
  const shown = new Set<string>();
  side.removed.forEach((l) => {
    out.push({ text: l, mark: addSet.has(l) ? 'none' : 'remove' });
    shown.add(l);
  });
  side.added.forEach((l) => {
    if (!shown.has(l)) {
      out.push({ text: l, mark: removeSet.has(l) ? 'none' : 'add' });
      shown.add(l);
    }
  });
  return out;
}

export function ConflictVizOverlay() {
  const open = useUiStore((s) => s.overlays.conflictViz.open);
  const initialFile = useUiStore((s) => s.overlays.conflictViz.file);
  const close = useUiStore((s) => s.closeOverlay);

  const [fileName, setFileName] = useState<string>(initialFile ?? FILES[0]?.file ?? '');

  const fileOptions = useMemo(
    () => FILES.map((f) => ({ value: f.file, label: `${f.file} · ${f.conflictCount}` })),
    [],
  );

  const file = useMemo<ConflictFile | undefined>(
    () => FILES.find((f) => f.file === fileName) ?? FILES[0],
    [fileName],
  );

  const totalConflicts = useMemo(
    () => FILES.reduce((sum, f) => sum + f.conflictCount, 0),
    [],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('conflictViz')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Branch className="h-4 w-4 text-ink-3" />
          <span>Conflict Visualizer</span>
        </span>
      }
      subtitle="co-edit diff · yours vs base vs theirs"
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {totalConflicts} conflict{totalConflicts === 1 ? '' : 's'} across {FILES.length} files
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() =>
              toast('Auto-merged clean files (mock)', {
                description: 'Skipped files with active conflicts.',
              })
            }
          >
            <Icon.Refresh className="h-3.5 w-3.5" /> Auto-merge clean files
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <span className="text-caps text-ink-3">File</span>
        <SelectControl
          value={fileName}
          options={fileOptions}
          onChange={(v) => setFileName(v)}
        />
        {file ? (
          <Chip tone="warn" size="xs" className="ml-2">
            {file.conflictCount} conflict{file.conflictCount === 1 ? '' : 's'}
          </Chip>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_260px] divide-x divide-line">
        <div className="min-w-0 max-h-[64vh] overflow-y-auto p-3">
          {file ? (
            <ul className="space-y-4">
              {file.conflicts.map((c) => (
                <li key={c.id} className="rounded-sm border border-line bg-bg">
                  <header className="flex items-center gap-2 px-2 py-1.5 hairline-b bg-bg-subtle">
                    <Icon.Branch className="h-3 w-3 text-ink-3" />
                    <span className="font-mono text-[11px] text-ink-1">
                      L{c.startLine}–{c.endLine}
                    </span>
                    <Chip tone="warn" size="xs" className="ml-2">
                      {c.yours.author} ↔ {c.theirs.author}
                    </Chip>
                  </header>

                  <div className="grid grid-cols-[1fr_64px_1fr_64px_1fr] items-stretch gap-0 p-2">
                    <CodeColumn
                      title="Yours"
                      author={c.yours.author}
                      tone="yours"
                      lines={diffLines(c.yours)}
                    />
                    <Connector count={Math.max(1, Math.ceil(c.yours.added.length / 2))} />
                    <CodeColumn
                      title="Base"
                      tone="base"
                      lines={c.base.map((l) => ({ text: l, mark: 'none' as const }))}
                    />
                    <Connector count={Math.max(1, Math.ceil(c.theirs.added.length / 2))} />
                    <CodeColumn
                      title="Theirs"
                      author={c.theirs.author}
                      tone="theirs"
                      lines={diffLines(c.theirs)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center text-xs text-ink-3">No file selected.</div>
          )}
        </div>

        {/* Right rail */}
        <aside className="min-w-0 max-h-[64vh] overflow-y-auto p-3">
          <header className="mb-2 text-caps text-ink-3">Suggested resolutions</header>
          <ul className="space-y-3">
            {(file?.conflicts ?? []).map((c) => (
              <ConflictHint key={c.id} conflict={c} />
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function ConflictHint({ conflict }: { conflict: Conflict }) {
  const apply = (kind: 'mine' | 'theirs' | 'merge') => {
    toast.success(`Applied "${kind}" resolution (mock)`, {
      description: `L${conflict.startLine}–${conflict.endLine}`,
    });
  };
  return (
    <li className="rounded-sm border border-line bg-bg-subtle/40 p-2">
      <div className="flex items-center gap-2">
        <Icon.Bulb className="h-3 w-3 text-accent" />
        <span className="font-mono text-[11px] text-ink-1">
          L{conflict.startLine}–{conflict.endLine}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-ink-2">{conflict.resolutionHint}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="xs" tone="ghost" onClick={() => apply('mine')}>
          Apply mine
        </Button>
        <Button size="xs" tone="ghost" onClick={() => apply('theirs')}>
          Apply theirs
        </Button>
        <Button size="xs" tone="accent" onClick={() => apply('merge')}>
          Merge both
        </Button>
      </div>
    </li>
  );
}
