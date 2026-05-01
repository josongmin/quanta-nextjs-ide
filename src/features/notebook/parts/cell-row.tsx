import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Chip, CodeBlock } from '@shared/ui';
import { langTone, type NotebookCell } from '../helpers';
import { MarkdownView } from './markdown-view';
import { OutputView } from './output-view';

interface CellRowProps {
  cell: NotebookCell;
  index: number;
  onMoveUp(): void;
  onMoveDown(): void;
  onDelete(): void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function CellRow({
  cell,
  index,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
}: CellRowProps) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="group hairline-b">
      <div className="flex items-stretch">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-line bg-bg-subtle py-2">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="rounded-sm px-1 text-[10px] text-ink-3 hover:bg-bg-hover hover:text-ink-1 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <span className="font-mono text-[10px] text-ink-3">
            [{cell.executionCount ?? ' '}]
          </span>
          <span className="font-mono text-[10px] text-ink-3">#{index + 1}</span>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="rounded-sm px-1 text-[10px] text-ink-3 hover:bg-bg-hover hover:text-ink-1 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
        </div>
        <div className="min-w-0 flex-1 px-3 py-2">
          {cell.kind === 'markdown' ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Chip tone="muted" size="xs">
                  markdown
                </Chip>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => {
                      setEditing((v) => !v);
                      toast(editing ? 'Preview' : 'Editing markdown (mock)');
                    }}
                  >
                    {editing ? 'Preview' : 'Edit'}
                  </Button>
                  <Button size="xs" tone="ghost" onClick={onDelete}>
                    Delete
                  </Button>
                </div>
              </div>
              {editing ? (
                <CodeBlock
                  code={cell.source}
                  language="md"
                  showLineNumbers={false}
                  maxHeight={200}
                />
              ) : (
                <MarkdownView source={cell.source} />
              )}
            </div>
          ) : (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip tone={langTone(cell.language ?? 'typescript')} size="xs">
                    {cell.language}
                  </Chip>
                  <span className="font-mono text-[10px] text-ink-3">
                    cell {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    tone="default"
                    onClick={() =>
                      toast(`Run cell ${index + 1} (${cell.language})`)
                    }
                  >
                    ▶ Run
                  </Button>
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => toast('Copy cell source (mock)')}
                  >
                    Copy
                  </Button>
                  <Button size="xs" tone="ghost" onClick={onDelete}>
                    Delete
                  </Button>
                </div>
              </div>
              <CodeBlock
                code={cell.source}
                language={cell.language ?? 'ts'}
                maxHeight={220}
              />
              {cell.output ? (
                <div className="mt-1.5">
                  <OutputView output={cell.output} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
