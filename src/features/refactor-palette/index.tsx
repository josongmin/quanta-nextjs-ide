import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Chip, Icon, Kbd, OverlayPanel, ScrollArea, Tooltip } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { KIND_TONE, KINDS, REFACTORS, type RefactorKind } from './helpers';

export function RefactorPaletteOverlay() {
  const open = useUiStore((s) => s.overlays.refactorPalette.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<ReadonlySet<RefactorKind>>(
    new Set(),
  );
  const [activeIdx, setActiveIdx] = useState(0);

  const toggleKind = (k: RefactorKind) => {
    setKindFilter((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const recents = useMemo(
    () =>
      [...REFACTORS]
        .filter((r) => r.recentCount > 0)
        .sort((a, b) => b.recentCount - a.recentCount)
        .slice(0, 4),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REFACTORS.filter((r) => {
      if (kindFilter.size > 0 && !kindFilter.has(r.kind)) return false;
      if (q.length === 0) return true;
      return r.name.toLowerCase().includes(q) || r.kind.includes(q);
    });
  }, [query, kindFilter]);

  const select = (id: string, name: string) => {
    toast(`Open ${name} overlay`, { description: id });
    close('refactorPalette');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = filtered[activeIdx];
      if (r) select(r.id, r.name);
    }
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('refactorPalette')}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Icon.Bulb className="h-4 w-4 text-ink-3" />
          <span>Refactor palette</span>
        </span>
      }
      footer={
        <div className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> select
          </span>
          <span className="ml-auto">{filtered.length} refactors</span>
        </div>
      }
    >
      <div onKeyDown={onKeyDown} tabIndex={-1} className="outline-none">
        <div className="flex flex-col gap-2 px-3 py-2 hairline-b">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setActiveIdx(0);
            }}
            placeholder="Search refactors…"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {KINDS.map((k) => (
              <ToggleChip
                key={k}
                active={kindFilter.has(k)}
                onClick={() => toggleKind(k)}
              >
                {k}
              </ToggleChip>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[420px]">
          {recents.length > 0 && query.length === 0 && kindFilter.size === 0 ? (
            <div className="hairline-b">
              <header className="flex items-center gap-2 bg-bg-subtle px-3 py-1.5">
                <Icon.Pin className="h-3 w-3 text-ink-3" />
                <span className="text-caps text-ink-3">Recently used</span>
              </header>
              <ul>
                {recents.map((r) => (
                  <PaletteRow
                    key={`recent-${r.id}`}
                    name={r.name}
                    kind={r.kind}
                    shortcut={r.shortcut}
                    when={r.when}
                    recentCount={r.recentCount}
                    active={false}
                    onSelect={() => select(r.id, r.name)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          <ul>
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-[11px] text-ink-3">
                No refactors match.
              </li>
            ) : (
              filtered.map((r, idx) => (
                <PaletteRow
                  key={r.id}
                  name={r.name}
                  kind={r.kind}
                  shortcut={r.shortcut}
                  when={r.when}
                  recentCount={r.recentCount}
                  active={idx === activeIdx}
                  onSelect={() => select(r.id, r.name)}
                />
              ))
            )}
          </ul>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

interface RowProps {
  name: string;
  kind: RefactorKind;
  shortcut: ReadonlyArray<string>;
  when: string;
  recentCount: number;
  active: boolean;
  onSelect(): void;
}

function PaletteRow({
  name,
  kind,
  shortcut,
  when,
  recentCount,
  active,
  onSelect,
}: RowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-bg-hover',
          active && 'bg-bg-hover',
        )}
      >
        <Tooltip content={when} side="right">
          <span className="flex items-center gap-1.5">
            <Icon.Info className="h-3 w-3 text-ink-3" />
            <span className="text-xs text-ink-1">{name}</span>
          </span>
        </Tooltip>
        <Chip tone={KIND_TONE[kind]} size="xs">
          {kind}
        </Chip>
        {recentCount > 0 ? (
          <Chip tone="muted" size="xs">
            ×{recentCount}
          </Chip>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {shortcut.length > 0 ? (
            shortcut.map((k, i) => <Kbd key={i}>{k}</Kbd>)
          ) : (
            <span className="text-[10px] text-ink-3">—</span>
          )}
        </span>
      </button>
    </li>
  );
}
