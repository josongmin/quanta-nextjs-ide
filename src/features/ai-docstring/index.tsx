import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  OverlayPanel,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  DOC_TARGETS,
  buildDocstring,
  chunkLines,
  targetById,
  type DocStyle,
  type IncludeFlags,
} from './helpers';

const STYLE_OPTIONS: ReadonlyArray<{ value: DocStyle; label: string }> = [
  { value: 'jsdoc', label: 'Standard JSDoc' },
  { value: 'tsdoc', label: 'TSDoc' },
  { value: 'markdown', label: 'Markdown summary' },
];

const INCLUDE_KEYS: ReadonlyArray<{ key: keyof IncludeFlags; label: string }> = [
  { key: 'examples', label: 'Examples' },
  { key: 'throws', label: 'Throws' },
  { key: 'since', label: 'Since' },
  { key: 'deprecated', label: 'Deprecated' },
  { key: 'see', label: 'See' },
];

export function AiDocstringOverlay() {
  const open = useUiStore((s) => s.overlays.aiDocstring.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeId, setActiveId] = useState<string>(DOC_TARGETS[0]!.id);
  const [style, setStyle] = useState<DocStyle>('jsdoc');
  const [include, setInclude] = useState<IncludeFlags>({
    examples: true,
    throws: false,
    since: false,
    deprecated: false,
    see: false,
  });
  const [streamed, setStreamed] = useState('');
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const target = useMemo(() => targetById(activeId), [activeId]);
  const fullDoc = useMemo(
    () => buildDocstring(target, style, include),
    [target, style, include],
  );
  const plan = useMemo(() => chunkLines(fullDoc), [fullDoc]);

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
    }, 35);
  };

  useEffect(() => {
    if (!open) return;
    startStream();
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId, style, include]);

  useEffect(() => {
    if (!open) {
      stopStream();
      setStreamed('');
    }
  }, [open]);

  useEffect(() => stopStream, []);

  const toggle = (k: keyof IncludeFlags): void => {
    setInclude((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const docLang = style === 'markdown' ? 'md' : 'jsdoc';

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('aiDocstring')}
      title="Generate docstring"
      subtitle={`${target.file} · ${target.name}`}
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Updated all in file (mock)')}
          >
            Update all in file
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Copied docstring')}
          >
            Copy
          </Button>
          <Button
            size="xs"
            onClick={() => {
              toast('Inserted above function (mock)');
              close('aiDocstring');
            }}
          >
            Insert above function
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-3 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Function</span>
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {DOC_TARGETS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="ml-3 text-caps text-ink-3">Style</span>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as DocStyle)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {STYLE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_1fr_240px] gap-0">
        {/* Source */}
        <div className="hairline-r p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Code className="h-3.5 w-3.5 text-ink-3" />
            <span className="text-caps text-ink-3">Function</span>
          </div>
          <div className="mb-2 rounded-sm border border-line bg-bg-subtle/40 p-2 font-mono text-[11px] text-ink-1">
            {target.signature}
          </div>
          <CodeBlock
            code={target.body}
            language={target.language}
            maxHeight={300}
          />
        </div>

        {/* Generated docstring */}
        <div className="hairline-r p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Doc className="h-3.5 w-3.5 text-accent" />
            <span className="text-caps text-ink-3">Docstring</span>
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
              ) : (
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast('Showing diff (mock)')}
                >
                  Diff
                </Button>
              )}
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
            <Chip tone="muted" size="xs" className="mt-2">
              {docLang}
            </Chip>
          </div>
        </div>

        {/* Include rail */}
        <div className="p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon.Settings className="h-3.5 w-3.5 text-ink-3" />
            <span className="text-caps text-ink-3">Include</span>
          </div>
          <ul className="space-y-1">
            {INCLUDE_KEYS.map(({ key, label }) => {
              const active = include[key];
              return (
                <li key={key}>
                  <button
                    onClick={() => toggle(key)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm border px-2 py-1 text-xs',
                      active
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                    )}
                  >
                    <span>{label}</span>
                    <span className="font-mono text-[10px]">
                      {active ? 'on' : 'off'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 rounded-sm border border-dashed border-line bg-bg-subtle/40 p-2 text-[11px] leading-4 text-ink-3">
            Toggling re-streams the docstring to reflect the new sections.
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
