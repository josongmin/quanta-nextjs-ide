import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { cn } from '@shared/lib/cn';
import {
  CHUNKS,
  DEFAULT_QUERY,
  SYSTEM_PROMPT,
  VERDICT_TONE,
  pickIncluded,
} from './helpers';

const HIST_W = 740;
const HIST_H = 100;

export function RagContextViewerOverlay() {
  const open = useUiStore((s) => s.overlays.ragContextViewer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [topK, setTopK] = useState<number>(8);
  const [budget, setBudget] = useState<number>(2000);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const autoIncluded = useMemo(
    () => new Set(pickIncluded(CHUNKS, topK, budget)),
    [topK, budget],
  );

  const isIncluded = (id: string) => {
    if (overrides[id] !== undefined) return overrides[id]!;
    return autoIncluded.has(id);
  };

  const includedChunks = CHUNKS.filter((c) => isIncluded(c.id));
  const includedTokens = includedChunks.reduce((a, b) => a + b.tokens, 0);

  const finalPrompt = useMemo(() => {
    const ctx = includedChunks
      .map(
        (c) =>
          `[source: ${c.sourceFile}]\n${c.snippet}`,
      )
      .join('\n\n---\n\n');
    return `### system\n${SYSTEM_PROMPT}\n\n### context\n${ctx}\n\n### user\n${query}`;
  }, [includedChunks, query]);

  const tokenPct = Math.min(100, (includedTokens / budget) * 100);

  // histogram bins
  const bins = useMemo(() => {
    const arr = new Array(10).fill(0) as number[];
    for (const c of CHUNKS) {
      const idx = Math.min(9, Math.floor(c.score * 10));
      arr[idx] = (arr[idx] ?? 0) + 1;
    }
    return arr;
  }, []);
  const maxBin = Math.max(1, ...bins);
  const threshold = 0.7;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('ragContextViewer')}
      title="RAG Context Viewer"
      subtitle={`${CHUNKS.length} chunks · top-K ${topK} · budget ${budget} tok`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            included: {includedChunks.length} chunks · {includedTokens} tokens
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Context copied (mock)')}
            >
              Copy context
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Re-embedding query (mock)')}
            >
              Re-embed
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">query:</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-5 w-72 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-1 focus:outline-none focus:border-accent"
            />
            <span className="mx-1 h-3 w-px bg-line" />
            <span className="text-ink-3">top-K:</span>
            <input
              type="range"
              min={3}
              max={15}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="h-1 w-20"
            />
            <span className="font-mono text-[10px] text-ink-2">{topK}</span>
            <span className="mx-1 h-3 w-px bg-line" />
            <span className="text-ink-3">budget:</span>
            <input
              type="range"
              min={500}
              max={4000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="h-1 w-24"
            />
            <span className="font-mono text-[10px] text-ink-2">{budget}</span>
          </PanelHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <ul className="space-y-1">
                {CHUNKS.map((c) => {
                  const included = isIncluded(c.id);
                  return (
                    <li
                      key={c.id}
                      className={cn(
                        'rounded-sm border bg-bg p-2',
                        included ? 'border-accent' : 'border-line',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-right font-mono text-[10px] text-ink-3">
                          #{c.rank}
                        </span>
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() =>
                            setOverrides((p) => ({ ...p, [c.id]: !included }))
                          }
                        />
                        <Chip tone={VERDICT_TONE[c.verdict]} size="xs">
                          {c.verdict}
                        </Chip>
                        <div className="h-1 w-24 overflow-hidden rounded-full bg-bg-subtle">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${c.score * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-ink-2">
                          {c.score.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-ink-3">
                          d={c.distance.toFixed(2)}
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-ink-3">
                          {c.tokens} tok
                        </span>
                      </div>
                      <div className="mt-1 truncate font-mono text-[10px] text-ink-3">
                        {c.sourceFile}
                      </div>
                      <div className="mt-1 text-[11px] text-ink-1">
                        {c.snippet}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <h3 className="text-caps mt-4 text-ink-3">Similarity histogram</h3>
              <div className="mt-2 rounded-sm border border-line bg-bg p-2">
                <svg
                  viewBox={`0 0 ${HIST_W} ${HIST_H}`}
                  className="w-full"
                  role="img"
                  aria-label="similarity histogram"
                >
                  {bins.map((count, i) => {
                    const barW = (HIST_W - 20) / bins.length - 2;
                    const x = 10 + i * (barW + 2);
                    const h = ((HIST_H - 20) * count) / maxBin;
                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={HIST_H - 14 - h}
                          width={barW}
                          height={h}
                          className="fill-accent"
                          fillOpacity={0.7}
                        />
                        <text
                          x={x + barW / 2}
                          y={HIST_H - 4}
                          textAnchor="middle"
                          className="fill-ink-3 text-[8px]"
                        >
                          {(i / 10).toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  <line
                    x1={10 + threshold * (HIST_W - 20)}
                    x2={10 + threshold * (HIST_W - 20)}
                    y1={4}
                    y2={HIST_H - 14}
                    className="stroke-sev-warn"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <text
                    x={10 + threshold * (HIST_W - 20) + 4}
                    y={12}
                    className="fill-sev-warn text-[9px]"
                  >
                    threshold {threshold}
                  </text>
                </svg>
              </div>
            </div>
          </ScrollArea>
        </div>

        <aside className="w-[320px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Assembled prompt</div>
            <div className="mt-1 text-[11px] text-ink-2">
              tokens {includedTokens} / {budget}
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
              <div
                className={cn(
                  'h-full',
                  tokenPct > 90 ? 'bg-sev-err' : tokenPct > 70 ? 'bg-sev-warn' : 'bg-accent',
                )}
                style={{ width: `${tokenPct}%` }}
              />
            </div>
            <div className="mt-2">
              <CodeBlock
                code={finalPrompt}
                language="text"
                showLineNumbers={false}
                maxHeight={400}
              />
            </div>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
