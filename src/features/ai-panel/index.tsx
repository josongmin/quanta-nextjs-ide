import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useAiSettingsStore } from '@entities/ai';
import { buildCodeGraph, useCodeGraphStore } from '@entities/code-graph';
import {
  computeStreamMetrics,
  useLastTraceStore,
} from '@entities/rsc-payload';
import {
  createAiProvider,
  hasApiKey,
  runAgent,
  useAgentStore,
  type AiMessage,
  type ChatMessage,
  type PatchCandidate,
  type UiToolEvent,
} from '@shared/ai';
import { AiSettingsPanel } from '@features/ai-settings';
import { GovernedFlowButton } from '@features/ai-governed-mode/integration';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';

/**
 * Quanta AI panel — agent-driven (Anthropic SDK) when an API key is set,
 * legacy stub provider otherwise.
 *
 * Every prompt is sent with the live Probe trace + AST graph as context, and
 * the agent has tools to read files, query routes, and propose patches that
 * route through the admission gate.
 */
export function AiPanelOverlay() {
  const open = useUiStore((s) => s.overlays.aiPanel?.open);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const provider = useAiSettingsStore((s) => s.provider);
  const apiKey = useAiSettingsStore((s) => s.apiKey);
  const setProvider = useAiSettingsStore((s) => s.setProvider);

  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const totalMs = useLastTraceStore((s) => s.totalMs);
  const totalBytes = useLastTraceStore((s) => s.totalBytes);

  const files = useCodeGraphStore((s) => s.files);
  const codeGraph = useMemo(() => buildCodeGraph(files, chunks), [files, chunks]);

  // Phase 4 agent state (used when running through the SDK).
  const conversation = useAgentStore((s) => s.conversation);
  const isStreaming = useAgentStore((s) => s.isStreaming);
  const streamingText = useAgentStore((s) => s.streamingText);
  const toolEvents = useAgentStore((s) => s.toolEvents);
  const patches = useAgentStore((s) => s.patches);
  const startTurn = useAgentStore((s) => s.startTurn);
  const appendStreamChunk = useAgentStore((s) => s.appendStreamChunk);
  const recordToolStart = useAgentStore((s) => s.recordToolStart);
  const recordToolEnd = useAgentStore((s) => s.recordToolEnd);
  const recordPatch = useAgentStore((s) => s.recordPatch);
  const finishTurn = useAgentStore((s) => s.finishTurn);
  const clearConversation = useAgentStore((s) => s.clearConversation);
  const removePatch = useAgentStore((s) => s.removePatch);

  // Legacy fallback history (used when stub provider is selected)
  const [legacyHistory, setLegacyHistory] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const useAgent = provider === 'anthropic' && hasApiKey();

  const probeSummary = useMemo(() => {
    if (!url) return undefined;
    const m = computeStreamMetrics(chunks);
    return [
      `URL: ${url}`,
      `Total: ${Math.round(totalMs)}ms, ${totalBytes}B, ${m.chunkCount} chunks (${m.uniqueChunkIds} unique, ${m.followUpCount} follow-ups)`,
      `Client bundle bytes: ${m.clientBundleBytes} (server ${m.serverBytes})`,
      `Kinds: ${Object.entries(m.byKind).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(', ')}`,
    ].join('\n');
  }, [url, chunks, totalMs, totalBytes]);

  const astSummary = useMemo(() => {
    const useClient = codeGraph.directives.filter((d) => d.kind === 'use-client');
    const useServer = codeGraph.directives.filter((d) => d.kind === 'use-server');
    const lines: string[] = [];
    lines.push(`Files scanned: ${codeGraph.directives.length === 0 ? files.length : '...'}`);
    lines.push(`'use client' files: ${useClient.length}`);
    for (const d of useClient.slice(0, 8)) {
      lines.push(`  - ${d.file} (importedBy: ${d.importedBy.length})`);
    }
    lines.push(`'use server' files: ${useServer.length}`);
    for (const d of useServer.slice(0, 8)) {
      lines.push(`  - ${d.file}`);
    }
    if (codeGraph.declaredButNotShipped.length > 0) {
      lines.push('');
      lines.push(`AST has 'use client' but Probe didn't see it ship: ${codeGraph.declaredButNotShipped.length}`);
      for (const d of codeGraph.declaredButNotShipped.slice(0, 5)) {
        lines.push(`  - ${d.file}`);
      }
    }
    return lines.join('\n');
  }, [codeGraph, files.length]);

  const handleAsk = async () => {
    if (!input.trim() || isStreaming) return;
    const userText = input.trim();
    setInput('');

    if (useAgent) {
      // Agent (SDK) path
      const conversationCopy: ChatMessage[] = conversation.map((m) => ({ ...m }));
      startTurn(userText);
      try {
        // Inject IDE context as a system-style augmentation in the user message.
        const contextLine = [
          probeSummary ? `[probe]\n${probeSummary}` : '',
          astSummary ? `[ast]\n${astSummary}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
        const augmented = contextLine ? `${userText}\n\n--- IDE context ---\n${contextLine}` : userText;
        const result = await runAgent({
          userMessage: augmented,
          conversation: conversationCopy,
          hooks: {
            onChunk: (delta) => appendStreamChunk(delta),
            onToolUse: (rec) => recordToolStart(rec),
            onToolResult: (rec) => recordToolEnd(rec),
            onPatch: (p) => recordPatch(p),
          },
        });
        finishTurn(result.text);
        if (result.patches.length > 0) {
          toast(`AI proposed ${result.patches.length} patch candidate(s)`);
        }
      } catch (e) {
        const msg = (e as Error).message;
        toast.error(`AI request failed: ${msg}`);
        finishTurn('', msg);
      }
      return;
    }

    // Legacy / stub path
    const userMsg: AiMessage = { role: 'user', content: userText };
    setLegacyHistory((h) => [...h, userMsg]);
    try {
      const ai = createAiProvider({ kind: provider, apiKey });
      const res = await ai.complete({
        messages: [
          {
            role: 'system',
            content:
              'You are Quanta, an IDE assistant for Next.js apps. Be concise and reference specific files/chunks.',
          },
          ...legacyHistory,
          userMsg,
        ],
        context: { probeSummary, astSummary },
      });
      setLegacyHistory((h) => [...h, { role: 'assistant', content: res.text }]);
    } catch (e) {
      toast.error(`AI request failed: ${(e as Error).message}`);
      setLegacyHistory((h) => [
        ...h,
        { role: 'assistant', content: `**Error**: ${(e as Error).message}` },
      ]);
    }
  };

  const handleClear = () => {
    if (useAgent) clearConversation();
    else setLegacyHistory([]);
  };

  return (
    <OverlayPanel
      open={!!open}
      onOpenChange={(o) => (o ? null : close('aiPanel'))}
      title="Quanta AI"
      subtitle="Probe + AST aware assistant"
      width={820}
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            mode: <Chip tone="muted" size="xs">{useAgent ? 'agent (claude-opus-4-7)' : provider}</Chip>
            {provider === 'anthropic' && !apiKey ? (
              <Chip tone="edge" size="xs">no key — falls back to stub</Chip>
            ) : null}
          </span>
          <GovernedFlowButton />
          <Button size="xs" tone="ghost" onClick={() => setShowSettings((v) => !v)}>
            {showSettings ? 'Hide settings' : 'Settings'}
          </Button>
          <Button size="xs" tone="ghost" onClick={handleClear}>
            Clear
          </Button>
        </>
      }
    >
      <div className="grid h-[560px] grid-cols-[1fr_300px]">
        <div className="flex min-h-0 flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-3 text-[12px]">
              {useAgent ? (
                <AgentTranscript
                  conversation={conversation}
                  streamingText={streamingText}
                  isStreaming={isStreaming}
                  toolEvents={toolEvents}
                  patches={patches}
                  onApplyPatch={(p) => {
                    openOverlay('aiPatchGate', { patchId: p.id });
                  }}
                  onDiscardPatch={(p) => {
                    removePatch(p.id);
                    toast(`Discarded ${p.id}`);
                  }}
                />
              ) : (
                <LegacyTranscript history={legacyHistory} pending={false} />
              )}
            </div>
          </ScrollArea>
          <div className="hairline-t flex gap-2 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleAsk();
                }
              }}
              placeholder={useAgent ? 'Ask the agent (it can read files, query routes, propose patches)…' : 'Ask anything (Probe + AST in context)…'}
              className="h-7 flex-1 rounded border border-line-1 bg-bg-1 px-2 font-mono text-[11px] outline-none focus:border-accent"
            />
            <Button size="xs" tone="accent" onClick={handleAsk} disabled={isStreaming || !input.trim()}>
              {isStreaming ? '…' : 'Ask'}
            </Button>
          </div>
        </div>

        <aside className="hairline-l flex flex-col bg-bg-subtle">
          <div className="hairline-b px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">
            Provider
          </div>
          <div className="space-y-3 p-3 text-[11px]">
            <div className="flex gap-1 rounded border border-line-1 p-0.5">
              <Button
                size="xs"
                tone={provider === 'stub' ? 'accent' : 'ghost'}
                onClick={() => setProvider('stub')}
              >
                Stub
              </Button>
              <Button
                size="xs"
                tone={provider === 'anthropic' ? 'accent' : 'ghost'}
                onClick={() => setProvider('anthropic')}
              >
                Anthropic
              </Button>
            </div>
          </div>

          {showSettings ? (
            <>
              <div className="hairline-t hairline-b px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">
                Settings
              </div>
              <AiSettingsPanel />
            </>
          ) : null}

          <div className="hairline-t hairline-b px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">
            Context preview
          </div>
          <ScrollArea className="flex-1">
            <pre className="whitespace-pre-wrap p-3 font-mono text-[10px] text-ink-2">
{probeSummary ?? '(no Probe trace)'}
{'\n\n'}
{astSummary}
            </pre>
          </ScrollArea>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function LegacyTranscript({ history, pending }: { history: AiMessage[]; pending: boolean }) {
  return (
    <>
      {history.length === 0 ? (
        <div className="text-ink-3">
          Ask: <span className="font-mono">why is /products heavy?</span> — every prompt
          is sent with your latest Probe trace and AST findings.
        </div>
      ) : null}
      {history.map((m, i) => (
        <div
          key={i}
          className={
            m.role === 'user'
              ? 'rounded border border-line-1 bg-bg-subtle p-2'
              : 'rounded border border-accent/30 bg-accent/5 p-2'
          }
        >
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">{m.role}</div>
          <pre className="whitespace-pre-wrap font-sans text-ink-1">{m.content}</pre>
        </div>
      ))}
      {pending ? <div className="text-[11px] text-ink-3">thinking…</div> : null}
    </>
  );
}

function AgentTranscript(props: {
  conversation: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  toolEvents: UiToolEvent[];
  patches: PatchCandidate[];
  onApplyPatch: (p: PatchCandidate) => void;
  onDiscardPatch: (p: PatchCandidate) => void;
}) {
  const { conversation, streamingText, isStreaming, toolEvents, patches, onApplyPatch, onDiscardPatch } = props;

  return (
    <>
      {conversation.length === 0 && !isStreaming ? (
        <div className="text-ink-3">
          Ask: <span className="font-mono">are there any cache pair bugs in /admin/products?</span> — the agent has tools to read files, query the route graph, and propose patches.
        </div>
      ) : null}
      {conversation.map((m, i) => (
        <div
          key={i}
          className={
            m.role === 'user'
              ? 'rounded border border-line-1 bg-bg-subtle p-2'
              : 'rounded border border-accent/30 bg-accent/5 p-2'
          }
        >
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">{m.role}</div>
          <pre className="whitespace-pre-wrap font-sans text-ink-1">
            {typeof m.content === 'string' ? m.content : extractText(m.content)}
          </pre>
        </div>
      ))}

      {toolEvents.length > 0 ? (
        <details className="rounded border border-line-1 bg-bg-1 p-2 text-[11px]">
          <summary className="cursor-pointer text-ink-2">
            Tool calls ({toolEvents.length})
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-[10px]">
            {toolEvents.map((e) => (
              <li key={e.id} className={e.is_error ? 'text-sev-err' : 'text-ink-2'}>
                <span className="text-accent">{e.name}</span>
                {' '}
                <span className="text-ink-3">{summarizeInput(e.input)}</span>
                {e.endedAt ? <span className="text-ink-3"> · {e.endedAt - e.startedAt}ms</span> : <span className="text-ink-3"> · running…</span>}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {isStreaming && streamingText ? (
        <div className="rounded border border-accent/30 bg-accent/5 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">assistant (streaming)</div>
          <pre className="whitespace-pre-wrap font-sans text-ink-1">{streamingText}</pre>
        </div>
      ) : null}

      {isStreaming && !streamingText ? (
        <div className="text-[11px] text-ink-3">thinking…</div>
      ) : null}

      {patches.map((p) => (
        <PatchCard key={p.id} patch={p} onApply={() => onApplyPatch(p)} onDiscard={() => onDiscardPatch(p)} />
      ))}
    </>
  );
}

function PatchCard({
  patch,
  onApply,
  onDiscard,
}: {
  patch: PatchCandidate;
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="rounded border border-sev-warn/40 bg-sev-warn-soft/20 p-2 text-[11px]">
      <div className="mb-1 flex items-center gap-2">
        <Chip size="xs" tone="warn">PATCH</Chip>
        <span className="font-mono text-[10px] text-ink-2">{patch.filePath}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-3">{patch.id}</span>
      </div>
      <div className="mb-2 text-ink-1">{patch.rationale}</div>
      <details className="mb-2">
        <summary className="cursor-pointer text-[10px] text-ink-3">Show diff preview</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <pre className="max-h-48 overflow-auto rounded border border-line-1 bg-bg-1 p-1 font-mono text-[9px] text-ink-2">
            {patch.oldContent || '(new file)'}
          </pre>
          <pre className="max-h-48 overflow-auto rounded border border-line-1 bg-bg-1 p-1 font-mono text-[9px] text-ink-1">
            {patch.newContent}
          </pre>
        </div>
      </details>
      <div className="flex gap-2">
        <Button size="xs" tone="accent" onClick={onApply}>
          Review &amp; apply
        </Button>
        <Button size="xs" tone="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}

function extractText(blocks: ChatMessage['content']): string {
  if (typeof blocks === 'string') return blocks;
  return blocks
    .map((b) => {
      if (b.type === 'text') return b.text;
      if (b.type === 'tool_use') return `[tool ${b.name}]`;
      if (b.type === 'tool_result') return `[tool result]`;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function summarizeInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input).slice(0, 2);
  return entries
    .map(([k, v]) => {
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return `${k}=${s.length > 40 ? s.slice(0, 40) + '…' : s}`;
    })
    .join(' ');
}
