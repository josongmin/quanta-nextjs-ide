import { useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel, ScrollArea, SeverityLabel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  mockException,
  RUNTIME_LABEL,
  RUNTIME_TONE,
} from './helpers';

export function ExceptionPauseOverlay() {
  const open = useUiStore((s) => s.overlays.exceptionPause.open);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const [activeFrame, setActiveFrame] = useState<number>(0);

  const ex = mockException;
  const startLine = ex.whereLine - ex.errorLineIndex;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('exceptionPause')}
      title="Paused on exception"
      subtitle={`${ex.className} · ${ex.whereFile}:${ex.whereLine}`}
      size="lg"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <Button size="xs" tone="accent" onClick={() => toast('Continue')}>
            Continue
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Step into recovery')}
          >
            Step into recovery
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => {
              openOverlay('variablesScope');
              toast('Open Variables');
            }}
          >
            Open Variables
          </Button>
          <span className="ml-auto flex gap-1.5">
            <Button size="xs" tone="ghost" onClick={() => toast('Added to ignore list')}>
              Add to ignore
            </Button>
            <Button size="xs" tone="ghost" onClick={() => toast(`Skip ${ex.className}`)}>
              Skip {ex.className}
            </Button>
          </span>
        </span>
      }
    >
      {/* Severity card */}
      <div className="hairline-b bg-sev-err-soft px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-sev-err/30 bg-bg text-sev-err">
            <Icon.XCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SeverityLabel severity="err" />
              <span className="font-mono text-[12px] font-semibold text-sev-err">
                {ex.className}
              </span>
              <Chip tone={RUNTIME_TONE[ex.runtime]} size="xs">
                {RUNTIME_LABEL[ex.runtime]}
              </Chip>
            </div>
            <div className="mt-1 text-sm text-ink-1">{ex.message}</div>
            <div className="mt-1 font-mono text-[11px] text-ink-3">
              where: {ex.whereFile}
              <span className="text-ink-3">:</span>
              <span className="text-sev-err">{ex.whereLine}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr_300px]">
        {/* Stack */}
        <div className="hairline-r">
          <div className="flex h-7 items-center px-3 text-caps text-ink-3 hairline-b">
            Stack
          </div>
          <ScrollArea className="h-[440px]">
            <div>
              {ex.frames.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFrame(idx)}
                  className={cn(
                    'block w-full hairline-b px-3 py-1.5 text-left hover:bg-bg-hover',
                    activeFrame === idx && 'bg-accent-soft',
                    !f.isUserCode && 'opacity-60',
                  )}
                >
                  <div
                    className={cn(
                      'font-mono text-[11px]',
                      f.isUserCode ? 'font-semibold text-ink-1' : 'text-ink-2',
                    )}
                  >
                    {f.fn}
                  </div>
                  <div className="truncate font-mono text-[10px] text-ink-3">
                    {f.file}:{f.line}:{f.col}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Source preview + cause chain */}
        <div className="hairline-r">
          <div className="flex h-7 items-center justify-between px-3 hairline-b">
            <span className="font-mono text-[11px] text-ink-2">
              {ex.whereFile}
              <span className="text-ink-3">:</span>
              <span className="text-sev-err">{ex.whereLine}</span>
            </span>
            <Chip tone="err" size="xs">
              error here
            </Chip>
          </div>
          <div className="p-2">
            <pre className="overflow-auto rounded-sm border border-line bg-bg font-mono text-[11px] leading-[18px]">
              <code className="block">
                {ex.source.map((line, i) => {
                  const isErrorLine = i === ex.errorLineIndex;
                  const lineNo = startLine + i;
                  const beforeSquiggle = isErrorLine
                    ? line.slice(0, ex.squiggleCol.start)
                    : line;
                  const squiggle = isErrorLine
                    ? line.slice(ex.squiggleCol.start, ex.squiggleCol.end)
                    : '';
                  const afterSquiggle = isErrorLine
                    ? line.slice(ex.squiggleCol.end)
                    : '';
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start whitespace-pre',
                        isErrorLine && 'bg-sev-err-soft',
                      )}
                    >
                      <span
                        aria-hidden
                        className="inline-block w-9 select-none border-r border-line bg-bg-subtle px-1.5 text-right text-ink-3"
                      >
                        {lineNo}
                      </span>
                      <span
                        className={cn(
                          'px-2',
                          isErrorLine ? 'text-ink-1' : 'text-ink-2',
                        )}
                      >
                        {isErrorLine ? (
                          <>
                            {beforeSquiggle || ''}
                            <span className="bg-sev-err-soft underline decoration-sev-err decoration-wavy underline-offset-2">
                              {squiggle}
                            </span>
                            {afterSquiggle}
                          </>
                        ) : (
                          line || ' '
                        )}
                      </span>
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>

          {/* Cause chain */}
          <div className="px-3 pb-3">
            <div className="mb-1 text-caps text-ink-3">cause chain</div>
            <div className="flex flex-wrap items-center gap-1">
              {ex.causes.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <Chip tone={i === 0 ? 'err' : i === ex.causes.length - 1 ? 'static' : 'warn'} size="sm">
                    <span className="font-semibold">{c.className}</span>
                    <span className="text-ink-3"> · </span>
                    <span className="font-mono text-[10px]">
                      {c.message.length > 40 ? c.message.slice(0, 40) + '…' : c.message}
                    </span>
                  </Chip>
                  {i < ex.causes.length - 1 ? (
                    <Icon.Right className="h-3 w-3 text-ink-3" />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested fixes */}
        <div>
          <div className="flex h-7 items-center px-3 text-caps text-ink-3 hairline-b">
            Suggested fixes
          </div>
          <ScrollArea className="h-[440px]">
            <div className="space-y-2 p-3">
              {ex.fixes.map((f) => (
                <div
                  key={f.id}
                  className="rounded-sm border border-line bg-bg p-2"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon.Bulb className="h-3 w-3 text-sev-warn" />
                    <span className="text-[12px] font-medium text-ink-1">
                      {f.title}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-3">
                    {f.rationale}
                  </div>
                  <div className="mt-2 space-y-1">
                    <CodeBlock
                      code={f.before}
                      language="tsx"
                      diff="before"
                      showLineNumbers={false}
                      maxHeight={80}
                    />
                    <CodeBlock
                      code={f.after}
                      language="tsx"
                      diff="after"
                      showLineNumbers={false}
                      maxHeight={120}
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="xs"
                      tone="accent"
                      onClick={() => toast(`Applied: ${f.title} (mock)`)}
                    >
                      Apply (mock)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </OverlayPanel>
  );
}
