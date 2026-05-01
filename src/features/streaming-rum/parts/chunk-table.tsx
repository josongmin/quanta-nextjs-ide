import { Chip, EmptyState } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { vitalChipTone, type RouteStream } from '../helpers';

interface ChunkTableProps {
  route: RouteStream;
  selectedChunk: string;
  onSelect: (id: string) => void;
}

export function ChunkTable({
  route,
  selectedChunk,
  onSelect,
}: ChunkTableProps): JSX.Element {
  return (
    <div className="mt-3">
      <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
        Per-chunk attribution
      </div>
      {route.chunks.length === 0 ? (
        <EmptyState title="No chunks captured" />
      ) : (
        <div className="overflow-hidden rounded-sm border border-line">
          <table className="w-full text-[11px]">
            <thead className="bg-bg-subtle text-ink-3">
              <tr>
                <th className="px-2 py-1 text-left">chunk</th>
                <th className="px-2 py-1 text-right">arrival</th>
                <th className="px-2 py-1 text-right">bytes</th>
                <th className="px-2 py-1 text-left">rendered</th>
                <th className="px-2 py-1 text-left">vital</th>
              </tr>
            </thead>
            <tbody>
              {route.chunks.map((c) => {
                const isSel = c.id === selectedChunk;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      'cursor-pointer hairline-b last:border-b-0 hover:bg-bg-hover',
                      isSel && 'bg-accent-soft/40',
                    )}
                  >
                    <td className="px-2 py-1 font-mono text-ink-1">{c.id}</td>
                    <td className="px-2 py-1 text-right font-mono text-ink-2">
                      {c.arrivalMs}ms
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-ink-2">
                      {c.bytes.toLocaleString()}
                    </td>
                    <td className="px-2 py-1 text-ink-2">{c.rendered}</td>
                    <td className="px-2 py-1">
                      {c.impactedVital ? (
                        <Chip tone={vitalChipTone(c.impactedVital)} size="xs">
                          {c.impactedVital}
                        </Chip>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
