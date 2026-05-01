import { Chip, EmptyState, ScrollArea } from '@shared/ui';
import { vitalChipTone, type ChunkInfo } from '../helpers';

interface ChunkDetailProps {
  chunk: ChunkInfo | undefined;
}

export function ChunkDetail({ chunk }: ChunkDetailProps): JSX.Element {
  if (!chunk) return <EmptyState title="No chunk selected" />;
  return (
    <div className="space-y-2 text-[11px]">
      <div className="flex items-center gap-1.5">
        <Chip tone="accent" size="xs">
          {chunk.id}
        </Chip>
        <span className="font-mono text-ink-3">{chunk.arrivalMs}ms</span>
        <span className="ml-auto font-mono text-ink-3">
          {chunk.bytes.toLocaleString()} B
        </span>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">
          Rendered
        </div>
        <div className="text-ink-2">{chunk.rendered}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">
          Attribution
        </div>
        <div className="text-ink-2">{chunk.attribution}</div>
      </div>
      {chunk.impactedVital ? (
        <div>
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Vital impact
          </div>
          <Chip tone={vitalChipTone(chunk.impactedVital)} size="xs">
            blocked {chunk.impactedVital}
          </Chip>
        </div>
      ) : null}
      {chunk.fix ? (
        <div className="rounded-sm bg-sem-static-soft px-2 py-1.5 text-sem-static">
          <ScrollArea className="max-h-24">{chunk.fix}</ScrollArea>
        </div>
      ) : (
        <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1.5 text-ink-3">
          No fix suggestion for this chunk.
        </div>
      )}
    </div>
  );
}
