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
  STAGED_FILES,
  SCOPE_OPTIONS,
  buildCommitMessage,
  splitMessageIntoChunks,
  totals,
  type CommitScope,
  type CommitStyle,
} from './helpers';

const STYLE_OPTIONS: ReadonlyArray<{ id: CommitStyle; label: string }> = [
  { id: 'concise', label: 'Concise' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'verbose', label: 'Verbose' },
];

export function AiCommitMessageOverlay() {
  const open = useUiStore((s) => s.overlays.aiCommitMessage.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [style, setStyle] = useState<CommitStyle>('detailed');
  const [scope, setScope] = useState<CommitScope>('feat');
  const [activeFile, setActiveFile] = useState<string>(STAGED_FILES[0]!.path);
  const [streamed, setStreamed] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [refine, setRefine] = useState('');
  const intervalRef = useRef<number | null>(null);

  const t = totals();
  const message = useMemo(
    () => buildCommitMessage(style, scope),
    [style, scope],
  );
  const plan = useMemo(() => splitMessageIntoChunks(message), [message]);
  const fileObj =
    STAGED_FILES.find((f) => f.path === activeFile) ?? STAGED_FILES[0]!;

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
    }, 40);
  };

  useEffect(() => {
    if (!open) return;
    startStream();
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, style, scope]);

  useEffect(() => {
    if (!open) {
      stopStream();
      setStreamed('');
      setRefine('');
    }
  }, [open]);

  useEffect(() => stopStream, []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('aiCommitMessage')}
      title="Generate commit message"
      subtitle={`${t.files} files · +${t.added} / −${t.removed}`}
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Saved as preset')}
          >
            Save preset
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Copied commit message')}
          >
            Copy
          </Button>
          <Button
            size="xs"
            onClick={() => {
              toast('Used as commit message (mock)');
              close('aiCommitMessage');
            }}
          >
            Use as commit message
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-3 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Style</span>
        <div className="flex items-center gap-1">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStyle(opt.id)}
              className={cn(
                'rounded-sm border px-1.5 py-0.5 font-mono text-[11px]',
                style === opt.id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-3 text-caps text-ink-3">Scope</span>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as CommitScope)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {SCOPE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_1.1fr] gap-0">
        {/* Diff summary */}
        <div className="hairline-r p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Branch className="h-3.5 w-3.5 text-ink-3" />
            <span className="text-caps text-ink-3">Staged diff</span>
          </div>
          <ScrollArea style={{ height: 130 }} className="rounded-sm border border-line">
            <ul>
              {STAGED_FILES.map((f) => (
                <li
                  key={f.path}
                  onClick={() => setActiveFile(f.path)}
                  className={cn(
                    'cursor-pointer px-2 py-1 hairline-b text-xs',
                    f.path === activeFile
                      ? 'bg-bg-selected'
                      : 'hover:bg-bg-hover',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon.File className="h-3 w-3 shrink-0 text-ink-3" />
                    <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                      {f.path}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-sem-static">
                      +{f.added}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-sev-err">
                      −{f.removed}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <div className="mt-2 text-caps text-ink-3">{fileObj.path}</div>
          <CodeBlock code={fileObj.excerpt} language="diff" maxHeight={200} />
        </div>

        {/* Generated message */}
        <div className="p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Doc className="h-3.5 w-3.5 text-accent" />
            <span className="text-caps text-ink-3">Generated message</span>
            <div className="ml-auto flex items-center gap-1">
              {streaming ? (
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => {
                    stopStream();
                    toast('Stopped');
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

          <div className="rounded-sm border border-line bg-bg-subtle/40 p-3">
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[16px] text-ink-1">
              {streamed}
              {streaming ? (
                <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-accent align-middle" />
              ) : null}
            </pre>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-caps text-ink-3">Refine prompt</div>
            <textarea
              value={refine}
              onChange={(e) => setRefine(e.target.value)}
              placeholder="e.g., emphasize testing changes, mention issue #482…"
              className="h-16 w-full resize-none rounded-sm border border-line bg-bg p-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-end">
              <Chip tone="muted" size="xs" className="mr-auto">
                {refine.length} chars
              </Chip>
              <Button
                size="xs"
                onClick={() => {
                  startStream();
                  toast(refine.length > 0 ? 'Refined and regenerated' : 'Regenerated');
                }}
              >
                Regenerate with refine
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
