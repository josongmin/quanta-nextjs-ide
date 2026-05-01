import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CHANGED_TABS,
  RECENT_FILES,
  kindLetter,
  kindTone,
  relativeTime,
  type FileKind,
} from './helpers';

interface Row {
  kind: 'recent' | 'changed';
  id: string;
  name: string;
  path: string;
  fileKind: FileKind;
  meta: string; // either time string or +12 -3
  delta?: { adds: number; removes: number };
}

export function RecentFilesPopupOverlay() {
  const open = useUiStore((s) => s.overlays.recentFilesPopup.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus when opened.
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Reset highlight when search changes.
  useEffect(() => {
    setHighlight(0);
  }, [search, open]);

  const recents = RECENT_FILES.slice(0, 10);

  const recentRows: ReadonlyArray<Row> = recents.map((f) => ({
    kind: 'recent',
    id: f.id,
    name: f.name,
    path: f.path,
    fileKind: f.kind,
    meta: relativeTime(f.ts),
  }));
  const changedRows: ReadonlyArray<Row> = CHANGED_TABS.map((c) => ({
    kind: 'changed',
    id: c.id,
    name: c.name,
    path: c.path,
    fileKind: c.kind,
    meta: `+${c.adds} -${c.removes}`,
    delta: { adds: c.adds, removes: c.removes },
  }));

  const allRows: ReadonlyArray<Row> = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filterRow = (r: Row): boolean => {
      if (q.length === 0) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q)
      );
    };
    return [...recentRows.filter(filterRow), ...changedRows.filter(filterRow)];
  }, [search, recentRows, changedRows]);

  function open_(row: Row, mode: 'open' | 'split' | 'peek'): void {
    const verb =
      mode === 'open' ? 'Opened' : mode === 'split' ? 'Opened in split' : 'Peek';
    toast(`${verb} ${row.path}/${row.name}`);
    close('recentFilesPopup');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(allRows.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = allRows[highlight];
      if (!row) return;
      const mode: 'open' | 'split' | 'peek' = e.metaKey || e.ctrlKey
        ? 'split'
        : e.shiftKey
          ? 'peek'
          : 'open';
      open_(row, mode);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close('recentFilesPopup');
    }
  }

  // Section split index for headings
  const recentVisible = allRows.filter((r) => r.kind === 'recent');
  const changedVisible = allRows.filter((r) => r.kind === 'changed');

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('recentFilesPopup')}
      title="Recent Files"
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between text-[11px] text-ink-3">
          <span>{allRows.length} matches</span>
          <div className="flex items-center gap-1.5">
            <Chip tone="muted" size="xs">
              ↵ open
            </Chip>
            <Chip tone="muted" size="xs">
              ⌘↵ open in split
            </Chip>
            <Chip tone="muted" size="xs">
              ⇧↵ peek
            </Chip>
            <Chip tone="muted" size="xs">
              esc close
            </Chip>
          </div>
        </div>
      }
    >
      <div className="hairline-b px-3 py-2">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type to filter recent files…"
          className="h-7 w-full rounded-sm border border-line bg-bg px-2 text-sm text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        {recentVisible.length > 0 && (
          <>
            <div className="flex h-6 items-center px-3 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
              Recent files
            </div>
            <ul>
              {recentVisible.map((r) => {
                const idx = allRows.indexOf(r);
                const active = idx === highlight;
                return (
                  <li key={r.id}>
                    <button
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => open_(r, 'open')}
                      className={cn(
                        'grid w-full items-center gap-2 px-3 py-1 text-left',
                        'hover:bg-bg-hover',
                        active && 'bg-accent-soft',
                      )}
                      style={{ gridTemplateColumns: '20px 1fr auto' }}
                    >
                      <Chip tone={kindTone(r.fileKind)} size="xs">
                        {kindLetter(r.fileKind)}
                      </Chip>
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-sm text-ink-1">
                          {r.name}
                        </span>
                        <span className="truncate font-mono text-[10px] text-ink-3">
                          {r.path}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-ink-3">
                        {r.meta}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {changedVisible.length > 0 && (
          <>
            <div className="flex h-6 items-center px-3 text-[10px] uppercase tracking-caps text-ink-3 hairline-b hairline-t bg-bg-subtle">
              Recently changed
            </div>
            <ul>
              {changedVisible.map((r) => {
                const idx = allRows.indexOf(r);
                const active = idx === highlight;
                return (
                  <li key={r.id}>
                    <button
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => open_(r, 'open')}
                      className={cn(
                        'grid w-full items-center gap-2 px-3 py-1 text-left',
                        'hover:bg-bg-hover',
                        active && 'bg-accent-soft',
                      )}
                      style={{ gridTemplateColumns: '20px 1fr auto' }}
                    >
                      <Chip tone={kindTone(r.fileKind)} size="xs">
                        {kindLetter(r.fileKind)}
                      </Chip>
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-sm text-ink-1">
                          {r.name}
                        </span>
                        <span className="truncate font-mono text-[10px] text-ink-3">
                          {r.path}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="text-sem-static">
                          +{r.delta?.adds ?? 0}
                        </span>
                        <span className="text-sev-err">
                          -{r.delta?.removes ?? 0}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {allRows.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            No files match “{search}”.
          </div>
        )}
      </div>
    </OverlayPanel>
  );
}
