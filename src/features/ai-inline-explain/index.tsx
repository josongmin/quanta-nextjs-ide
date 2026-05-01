import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  MOCK_SYMBOLS,
  MODEL_OPTIONS,
  buildStreamPlan,
  symbolById,
  type ExplainModel,
} from './helpers';

export function AiInlineExplainOverlay() {
  const open = useUiStore((s) => s.overlays.aiInlineExplain.open);
  const symbolId = useUiStore((s) => s.overlays.aiInlineExplain.symbolId);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeId, setActiveId] = useState<string>(
    () => symbolId ?? MOCK_SYMBOLS[0]!.id,
  );
  const [model, setModel] = useState<ExplainModel>('opus-4.7');
  const [streamed, setStreamed] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const intervalRef = useRef<number | null>(null);

  const symbol = useMemo(() => symbolById(activeId), [activeId]);
  const plan = useMemo(() => buildStreamPlan(symbol.explanation), [symbol]);
  const modelInfo =
    MODEL_OPTIONS.find((m) => m.id === model) ?? MODEL_OPTIONS[0]!;

  const stopStream = (): void => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreaming(false);
  };

  const startStream = (): void => {
    stopStream();
    setStreamed('');
    setStreaming(true);
    let i = 0;
    intervalRef.current = window.setInterval(() => {
      const chunk = plan[i];
      if (chunk === undefined) {
        stopStream();
        return;
      }
      setStreamed((prev) => prev + chunk);
      i += 1;
    }, 45);
  };

  // Restart stream when active symbol/model changes (and panel is open).
  useEffect(() => {
    if (!open) return;
    startStream();
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId, model]);

  // Reset on close.
  useEffect(() => {
    if (!open) {
      stopStream();
      setStreamed('');
      setFollowups([]);
      setQuestion('');
    }
  }, [open]);

  // Cleanup on unmount.
  useEffect(() => stopStream, []);

  const sendFollowup = (): void => {
    const q = question.trim();
    if (q.length === 0) return;
    setFollowups((prev) => [
      ...prev,
      `Follow-up: ${q} — In short, the implementation handles this case implicitly via the surrounding closure and the React scheduler ordering. Use a stable ref if you need to opt out.`,
    ]);
    setQuestion('');
    toast(`Sent follow-up to ${modelInfo.label}`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('aiInlineExplain')}
      title="Explain symbol"
      subtitle={`${symbol.file} · ${symbol.name}`}
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Saved explanation as comment (mock)')}
          >
            Save as comment
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Copied to clipboard')}
          >
            Copy
          </Button>
          <Button size="xs" onClick={() => toast('Opening quick docs (mock)')}>
            Open quick docs
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Symbol</span>
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {MOCK_SYMBOLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="ml-3 text-caps text-ink-3">Model</span>
        <div className="flex items-center gap-1">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={cn(
                'rounded-sm border px-1.5 py-0.5 font-mono text-[11px]',
                model === m.id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Chip tone="muted" size="xs" className="ml-auto">
          ~{modelInfo.cost} tok·credits
        </Chip>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_1fr] gap-0 hairline-b">
        <div className="hairline-r p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Code className="h-3.5 w-3.5 text-ink-3" />
            <span className="text-caps text-ink-3">Source</span>
            <Chip tone="muted" size="xs" className="ml-auto">
              L{symbol.highlightStart}–{symbol.highlightEnd}
            </Chip>
          </div>
          <CodeBlock
            code={symbol.source}
            language={symbol.language}
            maxHeight={360}
          />
        </div>

        <div className="p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Bulb className="h-3.5 w-3.5 text-accent" />
            <span className="text-caps text-ink-3">Explanation</span>
            <div className="ml-auto flex items-center gap-1">
              {streaming ? (
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => {
                    stopStream();
                    toast('Stream stopped');
                  }}
                >
                  Stop
                </Button>
              ) : null}
              <Button
                size="xs"
                tone="soft"
                onClick={() => {
                  startStream();
                  toast('Regenerating');
                }}
              >
                <Icon.Refresh className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[360px] rounded-sm border border-line bg-bg-subtle/40 p-3">
            <div className="whitespace-pre-wrap text-xs leading-5 text-ink-1">
              {streamed}
              {streaming ? (
                <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-accent align-middle" />
              ) : null}
            </div>
            {followups.length > 0 ? (
              <div className="mt-3 space-y-2">
                {followups.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-line bg-bg p-2 text-xs leading-5 text-ink-1"
                  >
                    {f}
                  </div>
                ))}
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </div>

      {/* Q&A */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon.Hash className="h-3.5 w-3.5 text-ink-3" />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendFollowup();
          }}
          placeholder="Ask a follow-up question…"
          className="h-7 flex-1 rounded-sm border border-line bg-bg px-2 text-xs text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
        />
        <Button size="sm" onClick={sendFollowup}>
          Send
        </Button>
      </div>
    </OverlayPanel>
  );
}
