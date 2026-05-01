import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { EmptyState, Icon, Kbd, OverlayPanel, Section } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { KEYMAP_SECTIONS, type KeymapRow, type KeymapSection } from './keymap';

function rowMatchesQuery(row: KeymapRow, q: string): boolean {
  if (!q) return true;
  const hay = [
    row.label,
    row.description ?? '',
    row.keys.join(' '),
    row.keys.join(''),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function filterSections(sections: KeymapSection[], q: string): KeymapSection[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return sections;
  return sections
    .map((s) => ({ ...s, rows: s.rows.filter((r) => rowMatchesQuery(r, needle)) }))
    .filter((s) => s.rows.length > 0);
}

export function ShortcutHelpOverlay() {
  const open = useUiStore((s) => s.overlays.shortcutHelp.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [query, setQuery] = useState('');

  const sections = useMemo(() => filterSections(KEYMAP_SECTIONS, query), [query]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('shortcutHelp'))}
      title="Keyboard"
      subtitle="search · navigate · inspect · refactor · view"
      width={620}
    >
      <div className="hairline-b bg-bg-subtle px-3 py-2">
        <label className="flex h-7 items-center gap-2 rounded-sm border border-line bg-bg px-2 text-sm">
          <Icon.Search className="h-3.5 w-3.5 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter shortcuts…"
            className="flex-1 bg-transparent text-sm text-ink-1 placeholder:text-ink-3 focus:outline-none"
            autoFocus
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1"
              aria-label="Clear filter"
            >
              <Icon.X className="h-3 w-3" />
            </button>
          ) : null}
        </label>
      </div>

      <div className="divide-y divide-line">
        {sections.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No matching shortcuts"
              description={`Nothing matches “${query}”. Try a different keyword or clear the filter.`}
            />
          </div>
        ) : (
          sections.map((s) => (
            <Section key={s.id} title={s.title} defaultOpen>
              <ul className="flex flex-col">
                {s.rows.map((row, i) => (
                  <li
                    key={`${s.id}-${i}`}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-sm px-1.5 py-1.5 text-sm',
                      'hover:bg-bg-hover',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-ink-1">{row.label}</div>
                      {row.description ? (
                        <div className="truncate text-xs text-ink-3">{row.description}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {row.keys.map((k, ki) => (
                        <Kbd key={`${ki}-${k}`}>{k}</Kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ))
        )}
      </div>
    </OverlayPanel>
  );
}
