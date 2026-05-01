import { KIND_LABEL, KIND_TONE, prettyPayload, type RscChunk, type TreeNode } from '@entities/rsc-payload';
import { Button, Chip, CodeBlock, Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { toast } from 'sonner';
import { TreeNodeRow } from './TreeNodeRow';

interface LiveViewProps {
  chunks: ReadonlyArray<RscChunk>;
  visibleChunks: ReadonlyArray<RscChunk>;
  streamMaxMs: number;
  time: number;
  onTimeChange: (n: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  status: 'idle' | 'streaming' | 'done' | 'error';
  occurrences: ReadonlyMap<string, number>;
  selectedId: string;
  onSelectId: (id: string) => void;
  selectedChunk: RscChunk | null;
  tree: ReadonlyArray<TreeNode>;
}

export function LiveView({
  chunks,
  visibleChunks,
  streamMaxMs,
  time,
  onTimeChange,
  onScrubStart,
  onScrubEnd,
  status,
  occurrences,
  selectedId,
  onSelectId,
  selectedChunk,
  tree,
}: LiveViewProps) {
  return (
    <>
      <div className="flex items-center gap-3 hairline-b bg-bg-subtle px-3 py-2">
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.round(streamMaxMs))}
          step={1}
          value={Math.round(time)}
          onChange={(e) => {
            onTimeChange(Number(e.target.value));
            onScrubStart();
          }}
          onMouseUp={onScrubEnd}
          onTouchEnd={onScrubEnd}
          disabled={chunks.length === 0}
          className="flex-1 accent-accent disabled:opacity-50"
        />
        <span className="font-mono text-[11px] text-ink-2">
          {Math.round(time)}/{Math.round(streamMaxMs)}ms
        </span>
        <Chip tone="accent" size="xs">
          chunk {visibleChunks.length}/{chunks.length}
        </Chip>
      </div>

      <div className="grid grid-cols-[480px_1fr_260px]">
        <ScrollArea className="h-[460px] hairline-r">
          <div>
            {chunks.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-ink-3">
                {status === 'streaming'
                  ? 'Waiting for first chunk…'
                  : status === 'error'
                    ? 'No chunks (see error above)'
                    : 'No chunks yet'}
              </div>
            ) : (
              chunks.map((c, i) => {
                const arrived = c.arrivedAtMs <= time + 0.5;
                const occCount = occurrences.get(c.id) ?? 1;
                const isFirstOccurrence =
                  chunks.findIndex((x) => x.id === c.id) === i;
                return (
                  <button
                    key={`${c.id}_${i}`}
                    type="button"
                    onClick={() => onSelectId(c.id)}
                    className={cn(
                      'flex w-full items-center gap-2 hairline-b px-3 py-1.5 text-left hover:bg-bg-hover',
                      selectedId === c.id && 'bg-accent-soft',
                      !arrived && 'opacity-40',
                    )}
                  >
                    <span className="w-8 font-mono text-[11px] text-ink-3">
                      {c.id}
                    </span>
                    <Chip tone={KIND_TONE[c.kind]} size="xs">
                      {KIND_LABEL[c.kind]}
                    </Chip>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-1">
                      {c.label ?? c.payload}
                    </span>
                    {c.environment === 'client' ? (
                      <Chip tone="edge" size="xs">
                        client
                      </Chip>
                    ) : null}
                    {isFirstOccurrence && occCount > 1 ? (
                      <Chip tone="info" size="xs" title={`Emitted ${occCount} times (Flight follow-ups)`}>
                        ×{occCount}
                      </Chip>
                    ) : null}
                    <span className="font-mono text-[10px] text-ink-3">
                      {c.sizeBytes}B
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[10px]',
                        arrived ? 'text-accent' : 'text-ink-3',
                      )}
                    >
                      {Math.round(c.arrivedAtMs)}ms
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex h-[460px] flex-col hairline-r">
          <div className="flex h-7 items-center justify-between px-3 hairline-b">
            <span className="text-caps text-ink-3">Reconstructed tree</span>
            <Chip tone="muted" size="xs">
              @ {Math.round(time)}ms
            </Chip>
          </div>
          <ScrollArea className="flex-1">
            <div className="py-1">
              {tree.length === 0 ? (
                <div className="px-3 py-4 text-xs text-ink-3">
                  No chunks resolved yet
                </div>
              ) : (
                tree.map((n) => <TreeNodeRow key={n.id} node={n} depth={0} />)
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex h-[460px] flex-col">
          <div className="flex h-7 items-center px-3 hairline-b text-caps text-ink-3">
            Chunk detail
          </div>
          <div className="space-y-2 overflow-auto p-3">
            {selectedChunk ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[12px] text-ink-1">
                    {selectedChunk.id}
                  </span>
                  <Chip tone={KIND_TONE[selectedChunk.kind]} size="xs">
                    {KIND_LABEL[selectedChunk.kind]}
                  </Chip>
                  {selectedChunk.environment === 'client' ? (
                    <Chip tone="edge" size="xs">
                      client
                    </Chip>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Chip tone="muted" size="xs">
                    {selectedChunk.sizeBytes}B
                  </Chip>
                  <Chip tone="muted" size="xs">
                    @ {Math.round(selectedChunk.arrivedAtMs)}ms
                  </Chip>
                  {selectedChunk.parent ? (
                    <Chip tone="info" size="xs">
                      parent {selectedChunk.parent}
                    </Chip>
                  ) : null}
                  {(occurrences.get(selectedChunk.id) ?? 1) > 1 ? (
                    <Chip
                      tone="info"
                      size="xs"
                      title="React Flight emits the same chunk id once per Suspense follow-up"
                    >
                      ×{occurrences.get(selectedChunk.id)}
                    </Chip>
                  ) : null}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-caps text-ink-3">
                    <span>flight payload</span>
                    {prettyPayload(selectedChunk) !== selectedChunk.payload ? (
                      <Chip tone="muted" size="xs">JSON</Chip>
                    ) : null}
                  </div>
                  <CodeBlock
                    code={prettyPayload(selectedChunk)}
                    language={
                      prettyPayload(selectedChunk) !== selectedChunk.payload
                        ? 'json'
                        : 'text'
                    }
                    showLineNumbers={false}
                    maxHeight={220}
                  />
                </div>
                {selectedChunk.resolvesRefs?.length ? (
                  <div>
                    <div className="mb-1 text-caps text-ink-3">resolves</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedChunk.resolvesRefs.map((r) => (
                        <Chip key={r} tone="accent" size="xs">
                          {r}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast(`Open ${selectedChunk.id} in editor`)}
                >
                  <Icon.UpRight className="h-3 w-3" /> Open in editor
                </Button>
              </>
            ) : (
              <div className="text-xs text-ink-3">No chunk selected</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
