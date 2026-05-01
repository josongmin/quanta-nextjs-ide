import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  INITIAL_CELLS,
  KERNELS,
  fmtMs,
  totalRuntime,
  type CodeLang,
  type NotebookCell,
} from './helpers';
import { CellRow } from './parts/cell-row';
import { NotebookToolbar } from './parts/notebook-toolbar';

type KernelOpt = (typeof KERNELS)[number]['id'];

let nextCellId = 100;

export function NotebookOverlay() {
  const open = useUiStore((s) => s.overlays.notebook.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [cells, setCells] = useState<ReadonlyArray<NotebookCell>>(INITIAL_CELLS);
  const [kernel, setKernel] = useState<KernelOpt>('k-mixed');

  const total = useMemo(() => totalRuntime(cells), [cells]);
  const counts = useMemo(() => {
    let md = 0;
    let code = 0;
    cells.forEach((c) => {
      if (c.kind === 'markdown') md++;
      else code++;
    });
    return { md, code };
  }, [cells]);

  const move = (idx: number, dir: -1 | 1) => {
    setCells((prev) => {
      const next = prev.slice();
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const a = next[idx];
      const b = next[target];
      if (!a || !b) return prev;
      next[idx] = b;
      next[target] = a;
      return next;
    });
  };

  const remove = (idx: number) => {
    setCells((prev) => prev.filter((_, i) => i !== idx));
    toast('Deleted cell');
  };

  const addCell = (kind: 'markdown' | 'code', lang: CodeLang = 'typescript') => {
    const id = `c-new-${++nextCellId}`;
    setCells((prev) => [
      ...prev,
      kind === 'markdown'
        ? {
            id,
            kind: 'markdown',
            source: '## New section\n\nWrite something here.',
          }
        : {
            id,
            kind: 'code',
            language: lang,
            source: '// new cell',
          },
    ]);
    toast(`Added ${kind} cell`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('notebook'))}
      title="funnel-q3.ipynb"
      subtitle="Notebook · 10 cells · auto-saved 2m ago"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-3">
            <Chip tone="muted" size="xs">
              {counts.md} md
            </Chip>
            <Chip tone="accent" size="xs">
              {counts.code} code
            </Chip>
            <span className="font-mono text-ink-2">
              total runtime {fmtMs(total)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="soft"
              onClick={() => toast('Exported funnel-q3.ipynb (mock)')}
            >
              Export .ipynb
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('notebook')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <NotebookToolbar
        kernel={kernel}
        onKernelChange={setKernel}
        onAddCell={addCell}
      />

      <div className={cn('max-h-[68vh] overflow-y-auto bg-bg')}>
        {cells.map((cell, idx) => (
          <CellRow
            key={cell.id}
            cell={cell}
            index={idx}
            canMoveUp={idx > 0}
            canMoveDown={idx < cells.length - 1}
            onMoveUp={() => move(idx, -1)}
            onMoveDown={() => move(idx, 1)}
            onDelete={() => remove(idx)}
          />
        ))}
      </div>
    </OverlayPanel>
  );
}
