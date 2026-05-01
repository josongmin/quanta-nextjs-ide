import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  ROOT_PEEK_ID,
  SYMBOLS,
  findSymbol,
  type Definition,
  type PeekKind,
  type PeekSymbol,
} from './helpers';

const KIND_TONE: Record<PeekKind, 'accent' | 'static' | 'isr' | 'dynamic' | 'edge' | 'client'> = {
  function: 'accent',
  class: 'static',
  interface: 'isr',
  type: 'dynamic',
  const: 'edge',
  component: 'client',
  hook: 'isr',
};

export function PeekDefinitionOverlay() {
  const open = useUiStore((s) => s.overlays.peekDefinition.open);
  const symbolId = useUiStore((s) => s.overlays.peekDefinition.symbolId);
  const close = useUiStore((s) => s.closeOverlay);

  const symbol = useMemo<PeekSymbol>(() => {
    return (
      (symbolId ? findSymbol(symbolId) : undefined) ??
      findSymbol(ROOT_PEEK_ID) ??
      (SYMBOLS[0] as PeekSymbol)
    );
  }, [symbolId]);

  const [defIdx, setDefIdx] = useState(0);
  const total = symbol.definitions.length;
  const safeIdx = Math.min(defIdx, total - 1);
  const def = symbol.definitions[safeIdx];

  const goPrev = () => setDefIdx((i) => (i - 1 + total) % total);
  const goNext = () => setDefIdx((i) => (i + 1) % total);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('peekDefinition')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Code className="h-4 w-4 text-ink-3" />
          <span>Peek definition</span>
          <span className="font-mono text-xs text-ink-2">{symbol.name}</span>
          <Chip tone={KIND_TONE[symbol.kind]} size="xs">
            {symbol.kind}
          </Chip>
        </span>
      }
      size="md"
      footer={
        <>
          <button
            onClick={() =>
              def &&
              toast('Open in editor', {
                description: `${def.file}:${def.line}`,
              })
            }
            className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-2 hover:bg-bg-hover"
          >
            <Icon.UpRight className="h-3 w-3" /> Open in editor
          </button>
          {total > 1 ? (
            <button
              onClick={() =>
                toast('Compare definitions', {
                  description: `${total} definitions of ${symbol.name}`,
                })
              }
              className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-2 hover:bg-bg-hover"
            >
              <Icon.Layers className="h-3 w-3" /> Compare definitions
            </button>
          ) : null}
          <span className="ml-auto text-[11px] text-ink-3">
            {symbol.usedCount} usages
          </span>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_240px] divide-x divide-line">
        <div className="min-w-0">
          <Toolbar
            total={total}
            current={safeIdx + 1}
            file={def ? def.file : ''}
            line={def ? def.line : 0}
            onPrev={goPrev}
            onNext={goNext}
          />
          {def ? <PeekCode def={def} /> : null}
        </div>
        <SideRail symbol={symbol} />
      </div>
    </OverlayPanel>
  );
}

function Toolbar({
  total,
  current,
  file,
  line,
  onPrev,
  onNext,
}: {
  total: number;
  current: number;
  file: string;
  line: number;
  onPrev(): void;
  onNext(): void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
      <button
        onClick={onPrev}
        disabled={total <= 1}
        aria-label="Previous definition"
        className="flex h-6 w-6 items-center justify-center rounded-sm border border-line bg-bg text-ink-2 hover:bg-bg-hover disabled:opacity-40"
      >
        <Icon.ChevRight className="h-3 w-3 rotate-180" />
      </button>
      <span className="font-mono text-[11px] text-ink-2">
        {current} of {total}
      </span>
      <button
        onClick={onNext}
        disabled={total <= 1}
        aria-label="Next definition"
        className="flex h-6 w-6 items-center justify-center rounded-sm border border-line bg-bg text-ink-2 hover:bg-bg-hover disabled:opacity-40"
      >
        <Icon.ChevRight className="h-3 w-3" />
      </button>
      <span className="ml-auto truncate font-mono text-[11px] text-ink-3">
        {file}:{line}
      </span>
    </div>
  );
}

function PeekCode({ def }: { def: Definition }) {
  const lines: ReadonlyArray<{
    text: string;
    lineNo: number;
    role: 'before' | 'def' | 'after';
    isHighlight: boolean;
  }> = useMemo(() => {
    const out: Array<{
      text: string;
      lineNo: number;
      role: 'before' | 'def' | 'after';
      isHighlight: boolean;
    }> = [];
    const startBefore = def.line - def.contextBefore.length;
    def.contextBefore.forEach((t, i) => {
      out.push({
        text: t,
        lineNo: startBefore + i,
        role: 'before',
        isHighlight: false,
      });
    });
    def.body.forEach((t, i) => {
      const lineNo = def.line + i;
      out.push({
        text: t,
        lineNo,
        role: 'def',
        isHighlight: i + 1 === def.highlightOffset,
      });
    });
    const afterStart = def.line + def.body.length;
    def.contextAfter.forEach((t, i) => {
      out.push({
        text: t,
        lineNo: afterStart + i,
        role: 'after',
        isHighlight: false,
      });
    });
    return out;
  }, [def]);

  return (
    <div className="bg-bg">
      <pre className="overflow-auto font-mono text-[11px] leading-[16px]">
        <code className="block">
          {lines.map((ln, i) => (
            <div
              key={`${ln.lineNo}-${i}`}
              className={cn(
                'flex min-h-[16px] items-start whitespace-pre',
                ln.isHighlight
                  ? 'bg-accent-soft'
                  : ln.role !== 'def'
                    ? 'opacity-70'
                    : '',
              )}
            >
              <span
                aria-hidden
                className="sticky left-0 inline-block w-10 select-none border-r border-line bg-bg-subtle px-1.5 text-right text-ink-3"
              >
                {ln.lineNo}
              </span>
              <span
                className={cn(
                  'px-2',
                  ln.role === 'def' ? 'text-ink-1' : 'text-ink-3',
                )}
              >
                {ln.text.length === 0 ? ' ' : ln.text}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function SideRail({ symbol }: { symbol: PeekSymbol }) {
  return (
    <aside className="min-w-0">
      <header className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <Icon.Info className="h-3 w-3 text-ink-3" />
        <span className="text-caps text-ink-3">Symbol</span>
      </header>
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center gap-1">
          <Chip tone={KIND_TONE[symbol.kind]} size="xs">
            {symbol.kind}
          </Chip>
          {symbol.deprecated ? (
            <Chip tone="warn" size="xs">
              <Icon.Alert className="h-3 w-3" /> deprecated
            </Chip>
          ) : null}
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-ink-3">Declared in</span>
            <span className="truncate font-mono text-ink-1">
              {symbol.declaredIn}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-ink-3">Since</span>
            <span className="font-mono text-ink-1">{symbol.since}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-ink-3">Usages</span>
            <span className="font-mono text-ink-1">{symbol.usedCount}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-ink-3">Definitions</span>
            <span className="font-mono text-ink-1">
              {symbol.definitions.length}
            </span>
          </div>
        </div>
        {symbol.deprecated ? (
          <div className="rounded-sm border border-sev-warn/30 bg-sev-warn-soft p-2 text-[11px] text-sev-warn">
            Use <span className="font-mono">{symbol.deprecated.replacement}</span>{' '}
            instead.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
