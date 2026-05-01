import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  OverlayPanel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  KIND_LABEL,
  KIND_TONE,
  REFACTORS,
  RISK_TONE,
  refactorById,
  type RefactorSuggestion,
} from './helpers';

type Scope = 'this file' | 'project';

export function AiRefactorSuggestOverlay() {
  const open = useUiStore((s) => s.overlays.aiRefactorSuggest.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [scope, setScope] = useState<Scope>('this file');
  const [threshold, setThreshold] = useState(60);
  const [activeId, setActiveId] = useState<string>(REFACTORS[0]!.id);
  const [accepted, setAccepted] = useState<ReadonlySet<string>>(new Set());
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());

  const visible = useMemo(
    () => REFACTORS.filter((r) => r.confidence >= threshold),
    [threshold],
  );
  const active = useMemo(() => refactorById(activeId), [activeId]);

  const accept = (r: RefactorSuggestion): void => {
    setAccepted((prev) => {
      const next = new Set(prev);
      next.add(r.id);
      return next;
    });
    setSkipped((prev) => {
      const next = new Set(prev);
      next.delete(r.id);
      return next;
    });
    toast(`Accepted: ${r.title}`);
  };
  const skip = (r: RefactorSuggestion): void => {
    setSkipped((prev) => {
      const next = new Set(prev);
      next.add(r.id);
      return next;
    });
    setAccepted((prev) => {
      const next = new Set(prev);
      next.delete(r.id);
      return next;
    });
    toast(`Skipped: ${r.title}`);
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('aiRefactorSuggest')}
      title="AI refactor suggestions"
      subtitle={`${visible.length} candidates above ${threshold}% · scope: ${scope}`}
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {accepted.size} accepted · {skipped.size} skipped
          </span>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => {
              setAccepted(new Set());
              setSkipped(new Set());
              toast('Cleared decisions');
            }}
          >
            Clear
          </Button>
          <Button
            size="xs"
            onClick={() =>
              toast(
                `Running ${visible.filter((r) => r.risk === 'safe').length} safe refactors (mock)`,
              )
            }
          >
            Run all safe
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-3 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Scope</span>
        <div className="flex items-center gap-1">
          {(['this file', 'project'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                'rounded-sm border px-1.5 py-0.5 font-mono text-[11px] capitalize',
                scope === s
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-3 text-caps text-ink-3">Confidence ≥</span>
        <input
          type="range"
          min={0}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-32 accent-accent"
        />
        <span className="font-mono text-[11px] tabular-nums text-ink-2">
          {threshold}%
        </span>
        <Chip tone="muted" size="xs" className="ml-auto">
          {REFACTORS.length} total found
        </Chip>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[320px_1fr] gap-0">
        <ScrollArea className="hairline-r" style={{ height: 460 }}>
          <ul>
            {visible.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-ink-3">
                No suggestions above threshold.
              </li>
            ) : null}
            {visible.map((r) => {
              const isActive = r.id === activeId;
              const isAccepted = accepted.has(r.id);
              const isSkipped = skipped.has(r.id);
              return (
                <li
                  key={r.id}
                  className={cn(
                    'cursor-pointer hairline-b px-3 py-2',
                    isActive ? 'bg-bg-selected' : 'hover:bg-bg-hover',
                  )}
                  onClick={() => setActiveId(r.id)}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <Chip tone={KIND_TONE[r.kind]} size="xs">
                      {KIND_LABEL[r.kind]}
                    </Chip>
                    {isAccepted ? (
                      <Chip tone="static" size="xs">
                        accepted
                      </Chip>
                    ) : null}
                    {isSkipped ? (
                      <Chip tone="muted" size="xs">
                        skipped
                      </Chip>
                    ) : null}
                  </div>
                  <div className="text-xs text-ink-1">{r.title}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-bg-subtle">
                      <div
                        className="h-1 rounded-full bg-accent"
                        style={{ width: `${r.confidence}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] tabular-nums text-ink-3">
                      {r.confidence}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Button
                      size="xs"
                      tone="soft"
                      onClick={(e) => {
                        e.stopPropagation();
                        accept(r);
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="xs"
                      tone="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        skip(r);
                      }}
                    >
                      Skip
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>

        <div className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <Icon.File className="h-3.5 w-3.5 text-ink-3" />
            <span className="font-mono text-[11px] text-ink-2">
              {active.file}
            </span>
            <Chip tone={RISK_TONE[active.risk]} size="xs" className="ml-auto">
              {active.risk === 'safe'
                ? 'Safe'
                : active.risk === 'review'
                  ? 'Review'
                  : 'Risky'}
            </Chip>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="xs">
                  Apply
                  <Icon.ChevDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1">
                {(['line', 'file', 'project'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => toast(`Applied to ${s} (mock)`)}
                    className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs text-ink-1 hover:bg-bg-hover"
                  >
                    <span className="capitalize">Apply to {s}</span>
                    <Icon.Right className="h-3 w-3 text-ink-3" />
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-3 rounded-sm border border-line bg-sev-info-soft/40 p-2 text-xs leading-5 text-ink-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <Icon.Bulb className="h-3 w-3 text-sev-info" />
              <span className="text-caps text-ink-3">Reason</span>
            </div>
            {active.reason}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-caps text-ink-3">Before</div>
              <CodeBlock
                code={active.beforeSnippet}
                language={active.language}
                diff="before"
                maxHeight={300}
              />
            </div>
            <div>
              <div className="mb-1 text-caps text-ink-3">After</div>
              <CodeBlock
                code={active.afterSnippet}
                language={active.language}
                diff="after"
                maxHeight={300}
              />
            </div>
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
