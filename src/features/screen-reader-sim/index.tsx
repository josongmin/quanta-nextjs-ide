import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  modes,
  pages,
  readerPrefix,
  readers,
  type PageId,
  type ReaderId,
  type ReaderMode,
} from './helpers';

export function ScreenReaderSimOverlay() {
  const open = useUiStore((s) => s.overlays.screenReaderSim.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [reader, setReader] = useState<ReaderId>('nvda');
  const [pageId, setPageId] = useState<PageId>('/');
  const [mode, setMode] = useState<ReaderMode>('browse');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const page = useMemo(
    () => pages.find((p) => p.id === pageId) ?? pages[0]!,
    [pageId],
  );
  const script = page.scripts[mode];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('screenReaderSim'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Globe className="h-4 w-4 text-ink-3" />
          <span>Screen Reader Simulator</span>
        </span>
      }
      subtitle="NVDA · VoiceOver · TalkBack announcement scripts"
      size="xl"
      footer={
        <Button size="sm" tone="ghost" onClick={() => close('screenReaderSim')}>
          Close
        </Button>
      }
    >
      <div className="px-3 py-2 hairline-b">
        <div className="flex flex-wrap items-center gap-2">
          <SelectControl<ReaderId>
            label="reader"
            value={reader}
            onChange={(v) => setReader(v)}
            options={readers.map((r) => ({ value: r.id, label: r.label }))}
          />
          <SelectControl<PageId>
            label="page"
            value={pageId}
            onChange={(v) => setPageId(v)}
            options={pages.map((p) => ({ value: p.id, label: p.label }))}
          />
          <span className="ml-2 flex items-center gap-1">
            <span className="text-caps text-ink-3">mode</span>
            {modes.map((m) => (
              <ToggleChip
                key={m.id}
                active={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </ToggleChip>
            ))}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[400px_1fr_280px] divide-x divide-line">
        <div className="min-w-0 px-3 py-3">
          <h3 className="mb-2 text-caps text-ink-3">Page mock</h3>
          <PageMockSvg
            elements={page.elements}
            highlightedId={highlightedId}
          />
        </div>

        <div className="min-w-0 px-3 py-3">
          <h3 className="mb-2 text-caps text-ink-3">
            Announcement script · {readerPrefix(reader)} · {mode}
          </h3>
          {script.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-3 py-4 text-center text-xs text-ink-3">
              No announcements in this mode for the selected page.
            </div>
          ) : (
            <ol className="space-y-1">
              {script.map((s, idx) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightedId(s.elementId)}
                    onMouseLeave={() => setHighlightedId(null)}
                    onClick={() => {
                      setHighlightedId(s.elementId);
                      toast(`${readerPrefix(reader)} announces`, {
                        description: s.announce,
                      });
                    }}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-sm border border-line bg-bg px-2 py-1.5 text-left hover:bg-bg-hover',
                      highlightedId === s.elementId &&
                        'border-line-strong bg-bg-selected',
                    )}
                  >
                    <span className="mt-0.5 inline-flex h-4 w-5 shrink-0 items-center justify-center rounded-sm border border-line bg-bg-subtle font-mono text-[10px] text-ink-3">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Chip tone="muted" size="xs">
                          {s.role}
                        </Chip>
                        <span className="truncate text-xs text-ink-1">
                          {s.name || <em className="text-sev-err">unlabeled</em>}
                        </span>
                        {s.state ? (
                          <Chip tone="info" size="xs">
                            {s.state}
                          </Chip>
                        ) : null}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-ink-2">
                        “{s.announce}”
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="min-w-0 px-3 py-3">
          <h3 className="mb-2 text-caps text-ink-3">Issues</h3>
          {page.issues.length === 0 ? (
            <div className="text-[11px] text-ink-3">No issues detected.</div>
          ) : (
            <ul className="space-y-1.5">
              {page.issues.map((i) => (
                <li
                  key={i.id}
                  className="rounded-sm border border-line bg-bg px-2 py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Chip
                      tone={
                        i.severity === 'err'
                          ? 'err'
                          : i.severity === 'warn'
                            ? 'warn'
                            : 'info'
                      }
                      size="xs"
                    >
                      {i.severity}
                    </Chip>
                    <span className="font-mono text-[10px] text-ink-3">
                      {i.rule}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-1">{i.message}</div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="truncate font-mono text-[10px] text-ink-3">
                      {i.fix}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        toast('Fix suggestion', { description: i.fix })
                      }
                      className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[10px] tracking-caps text-ink-2 hover:bg-bg-hover hover:text-ink-1"
                    >
                      Fix
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}

function PageMockSvg({
  elements,
  highlightedId,
}: {
  elements: readonly {
    id: string;
    role: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isLandmark?: boolean;
  }[];
  highlightedId: string | null;
}) {
  const W = 400;
  const H = 400;
  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Page mock"
      className="rounded-sm border border-line bg-bg"
    >
      {elements.map((el) => {
        const highlighted = highlightedId === el.id;
        return (
          <g key={el.id}>
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              rx={3}
              className={
                el.isLandmark ? 'fill-accent-soft/40' : 'fill-bg-subtle'
              }
              stroke={
                highlighted
                  ? '#0ea5e9'
                  : el.isLandmark
                    ? 'currentColor'
                    : '#e5e7eb'
              }
              strokeWidth={highlighted ? 2 : 1}
            />
            <text
              x={el.x + 6}
              y={el.y + Math.min(14, el.height / 2 + 4)}
              fontSize={10}
              fontFamily="ui-sans-serif"
              className={highlighted ? 'fill-ink-1' : 'fill-ink-2'}
            >
              {el.role} · {el.label.length > 30 ? `${el.label.slice(0, 30)}…` : el.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
