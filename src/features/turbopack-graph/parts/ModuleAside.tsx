import { toast } from 'sonner';
import { Button, Chip, ScrollArea } from '@shared/ui';
import {
  kindChipTone,
  moduleById,
  snapshotFor,
  type ModuleNode,
} from '../helpers';

interface ModuleAsideProps {
  selected: ModuleNode;
  selectedSize: number;
  selectedImporters: ReadonlyArray<string>;
  selectedImports: ReadonlyArray<string>;
}

export function ModuleAside({
  selected,
  selectedSize,
  selectedImporters,
  selectedImports,
}: ModuleAsideProps) {
  return (
    <aside className="min-w-0 px-3 py-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-caps text-ink-3">
          Selected module
        </h4>
        <Chip tone={kindChipTone(selected.kind)} size="xs">
          {selected.kind}
        </Chip>
      </div>
      <div className="mt-2 truncate font-mono text-[12px] text-ink-1">
        {selected.name}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <Chip tone="neutral" size="xs">
          {selectedSize}KB
        </Chip>
        {selected.entryPoint ? (
          <Chip tone="accent" size="xs">
            entry
          </Chip>
        ) : null}
        {selected.hmrBoundary ? (
          <Chip tone="warn" size="xs">
            HMR
          </Chip>
        ) : null}
        {selected.treeShakable ? (
          <Chip tone="info" size="xs">
            tree-shakable
          </Chip>
        ) : null}
      </div>

      <div className="mt-3 rounded-sm border border-line bg-bg-subtle px-2 py-1.5 text-[11px] text-ink-2">
        {selected.includedReason}
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          Importers ({selectedImporters.length})
        </div>
        <ScrollArea className="max-h-28">
          <ul className="space-y-0.5 text-[11px]">
            {selectedImporters.length === 0 ? (
              <li className="text-ink-3">No importers (entry / orphan).</li>
            ) : (
              selectedImporters.slice(0, 5).map((id) => (
                <li key={id} className="truncate font-mono text-ink-2">
                  {moduleById(id).name}
                </li>
              ))
            )}
          </ul>
        </ScrollArea>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          Imports ({selectedImports.length})
        </div>
        <ScrollArea className="max-h-28">
          <ul className="space-y-0.5 text-[11px]">
            {selectedImports.length === 0 ? (
              <li className="text-ink-3">No imports.</li>
            ) : (
              selectedImports.slice(0, 5).map((id) => (
                <li key={id} className="truncate font-mono text-ink-2">
                  {moduleById(id).name}
                </li>
              ))
            )}
          </ul>
        </ScrollArea>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          size="xs"
          tone="ghost"
          onClick={() => toast(`Open ${selected.name} in editor (mock)`)}
        >
          Open in editor
        </Button>
        <Button
          size="xs"
          tone="ghost"
          onClick={() => toast(`Why included: ${selected.includedReason}`)}
        >
          Why included
        </Button>
        <Button
          size="xs"
          tone="ghost"
          onClick={() =>
            toast(
              `Webpack: ${snapshotFor('webpack').sizes[selected.id]}KB · Turbopack: ${
                snapshotFor('turbopack').sizes[selected.id]
              }KB`,
            )
          }
        >
          Compare with Webpack
        </Button>
      </div>
    </aside>
  );
}
