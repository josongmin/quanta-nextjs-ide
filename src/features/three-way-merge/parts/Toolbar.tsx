import { Button, Chip } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';

interface ToolbarProps {
  fileName: string;
  onFileNameChange(name: string): void;
  fileOptions: ReadonlyArray<{ value: string; label: string }>;
  total: number;
  onAcceptAllLocal(): void;
  onAcceptAllIncoming(): void;
  onAutoMerge(): void;
}

export function Toolbar({
  fileName,
  onFileNameChange,
  fileOptions,
  total,
  onAcceptAllLocal,
  onAcceptAllIncoming,
  onAutoMerge,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
      <span className="text-caps text-ink-3">File</span>
      <SelectControl
        value={fileName}
        options={fileOptions}
        onChange={(v) => onFileNameChange(v)}
      />
      <Chip tone="warn" size="xs" className="ml-1">
        {total} conflict{total === 1 ? '' : 's'}
      </Chip>
      <div className="ml-auto flex items-center gap-1">
        <Button size="xs" tone="ghost" onClick={onAcceptAllLocal}>
          Accept all local
        </Button>
        <Button size="xs" tone="ghost" onClick={onAcceptAllIncoming}>
          Accept all incoming
        </Button>
        <Button size="xs" tone="ghost" onClick={onAutoMerge}>
          Auto-merge non-overlapping
        </Button>
      </div>
    </div>
  );
}
