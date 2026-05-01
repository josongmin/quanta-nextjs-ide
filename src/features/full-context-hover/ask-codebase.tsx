/**
 * Phase 6 — Question-Answerable Codebase (31-2).
 *
 * `AskCodebaseButton` — top-bar button (Cmd+Shift+A) that opens a Dialog with
 * an input and streamed AI answers. Tools available: read_file, grep,
 * route_lookup, cache_graph_query, boundary_check, server_actions_in_route
 * (already registered in Phase 4 agent-tools).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useEditorStore } from '@entities/editor';
import {
  hasApiKey,
  runAgent,
  type ChatMessage,
  type UiToolEvent,
} from '@shared/ai';
import { Button, Chip, Icon, Kbd } from '@shared/ui';
import { cn } from '@shared/lib/cn';

const SAMPLE_QUESTIONS: ReadonlyArray<{ q: string; tag: string }> = [
  { q: '어떤 route가 payment 영향을 받나?', tag: 'routes' },
  { q: 'stale data 위험 있는 곳?', tag: 'cache' },
  { q: 'Where do client components use server-only env vars?', tag: 'security' },
  { q: 'Which mutations are missing revalidateTag?', tag: 'cache' },
  { q: 'Show all server actions touching the orders table.', tag: 'data' },
  { q: 'Untested routes ranked by blast radius?', tag: 'tests' },
];

export function AskCodebaseButton() {
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl+Shift+A → open. We use a window-level listener so this always
  // works regardless of focus, and bail when an existing modal owns input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Button
        tone="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Ask the codebase"
        className="gap-1.5"
      >
        <Icon.Search className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-ink-3">Ask</span>
        <span className="flex items-center gap-0.5 text-ink-3">
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>A</Kbd>
        </span>
      </Button>
      <AskCodebaseDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AskCodebaseDialog({ open, onOpenChange }: DialogProps) {
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [tools, setTools] = useState<UiToolEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openTab = useEditorStore((s) => s.openTab);

  useEffect(() => {
    if (open) {
      // Auto-focus the textarea when the dialog opens.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const onSubmit = async () => {
    const q = input.trim();
    if (!q || busy) return;
    if (!hasApiKey()) {
      setAnswer('Configure an Anthropic API key in Settings → AI to ask the codebase.');
      return;
    }
    setBusy(true);
    setAnswer('');
    setTools([]);
    const conversation: ChatMessage[] = [];
    try {
      await runAgent({
        userMessage: SYSTEM_HINT + '\n\nQuestion: ' + q,
        conversation,
        maxIterations: 8,
        hooks: {
          onChunk: (delta) => setAnswer((prev) => prev + delta),
          onToolUse: (rec) =>
            setTools((prev) => [
              ...prev,
              { id: rec.id, name: rec.name, input: rec.input, startedAt: Date.now() },
            ]),
          onToolResult: (rec) =>
            setTools((prev) =>
              prev.map((t) =>
                t.id === rec.id
                  ? {
                      ...t,
                      endedAt: rec.endedAt,
                      ...(rec.is_error !== undefined ? { is_error: rec.is_error } : {}),
                      result: typeof rec.result === 'string' ? rec.result : JSON.stringify(rec.result).slice(0, 240),
                    }
                  : t,
              ),
            ),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAnswer((prev) => prev + `\n\n[error] ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void onSubmit();
    }
  };

  const renderedAnswer = useMemo(() => answer || (busy ? '' : ''), [answer, busy]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-150" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
          <Dialog.Content
            className={cn(
              'pointer-events-auto w-[720px] max-w-[90vw] overflow-hidden rounded-md border border-line/80',
              'bg-bg/85 shadow-pop backdrop-blur-md',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'duration-200 ease-out',
            )}
          >
            <header className="px-4 pt-3 pb-2 hairline-b">
              <Dialog.Title asChild>
                <h2 className="text-md font-semibold text-ink-1">Ask the codebase</h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="mt-0.5 text-xs text-ink-3">
                  Routes, cache, boundaries, mutations, tests — the agent has tools for all of it.
                </p>
              </Dialog.Description>
            </header>

            {/* Input */}
            <div className="px-4 py-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="e.g. Which routes are affected if I rename `getOrders`?"
                className={cn(
                  'w-full resize-none rounded-sm border border-line bg-bg px-2 py-1.5 text-sm text-ink-1',
                  'focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/30',
                )}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {SAMPLE_QUESTIONS.map((s) => (
                  <button
                    key={s.q}
                    type="button"
                    onClick={() => setInput(s.q)}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-subtle px-2 py-0.5 text-[11px] text-ink-2 hover:bg-bg-hover"
                  >
                    <Chip tone="muted" size="xs">
                      {s.tag}
                    </Chip>
                    <span className="truncate max-w-[260px]">{s.q}</span>
                  </button>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-3">
                  <Kbd>⌘</Kbd>
                  <Kbd>↵</Kbd>
                  to send · <Kbd>Esc</Kbd> to close
                </span>
              </div>
            </div>

            {/* Answer */}
            <div className="max-h-[50vh] overflow-y-auto px-4 pb-3">
              {!busy && !answer ? (
                <div className="rounded-sm bg-bg-subtle/60 px-3 py-6 text-center text-xs italic text-ink-3">
                  Answers stream here. Tool calls will be listed below the answer.
                </div>
              ) : null}
              {answer || busy ? (
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-1">
                  {renderedAnswer}
                  {busy ? <Cursor /> : null}
                </pre>
              ) : null}
              {tools.length > 0 ? (
                <div className="mt-3 hairline-t pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTools((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] text-ink-3 hover:text-ink-1"
                  >
                    {showTools ? <Icon.ChevDown className="h-3 w-3" /> : <Icon.ChevRight className="h-3 w-3" />}
                    {tools.length} tool call{tools.length === 1 ? '' : 's'}
                  </button>
                  {showTools ? (
                    <ul className="mt-1 flex flex-col gap-0.5 font-mono text-[11px]">
                      {tools.map((t) => (
                        <li key={t.id} className="flex items-start gap-2">
                          <span className="rounded-sm border border-line bg-bg-subtle px-1 py-0 text-[10px] uppercase tracking-caps text-ink-3">
                            {t.name}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-ink-2">
                            {Object.values(t.input).slice(0, 2).map(String).join(' · ') || '—'}
                          </span>
                          {t.result ? (
                            <button
                              type="button"
                              onClick={() => {
                                // If the tool returned a file:line ref, jump there.
                                const m = /([\w/.-]+\.[a-z]+):(\d+)/.exec(t.result ?? '');
                                if (m) {
                                  openTab({
                                    id: `tab-${(m[1] ?? '').replace(/[^a-zA-Z0-9]/g, '-')}`,
                                    file: m[1] ?? '',
                                    label: (m[1] ?? '').split('/').pop() ?? (m[1] ?? ''),
                                  });
                                }
                              }}
                              className="shrink-0 truncate text-[10px] text-ink-3 hover:text-ink-1"
                              title={t.result}
                            >
                              {t.is_error ? '✕' : '✓'} result
                            </button>
                          ) : (
                            <span className="text-[10px] text-ink-3">…</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-end gap-2 px-4 py-2 hairline-t bg-bg-subtle/60">
              <Button tone="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button tone="default" size="sm" onClick={onSubmit} disabled={busy || !input.trim()}>
                {busy ? (
                  <Icon.Refresh className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon.Search className="h-3 w-3" />
                )}
                Ask
              </Button>
            </footer>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cursor() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-3 w-1.5 translate-y-[1px] animate-pulse bg-accent"
    />
  );
}

const SYSTEM_HINT = `You are answering a question about a Next.js codebase. Use the available tools liberally:
read_file, grep, route_lookup, cache_graph_query, boundary_check, server_actions_in_route.
Cite files in the form path/to/file.ts:LINE so the UI can render jump-to-line links.
Keep the answer to 6-12 lines. If the question is ambiguous, answer the most likely interpretation and note alternatives in one trailing line.`;
