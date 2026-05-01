import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel, ScrollArea, Tooltip } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  mockScopes,
  previewVar,
  stringifyVar,
  type ScopeKind,
  type VarEntry,
} from './helpers';

const SCOPES: ReadonlyArray<ScopeKind> = ['Local', 'Closure', 'Module', 'Global'];

const MAX_DEPTH = 4;

interface RowProps {
  entry: VarEntry;
  depth: number;
  expanded: Set<string>;
  toggle(id: string): void;
  selected: string;
  setSelected(id: string): void;
  filter: string;
}

function VarRow({ entry, depth, expanded, toggle, selected, setSelected, filter }: RowProps) {
  const isExpandable =
    (entry.value.kind === 'object' || entry.value.kind === 'array') &&
    depth < MAX_DEPTH;
  const isOpen = expanded.has(entry.id) && isExpandable;
  const hidden = filter && !entry.name.toLowerCase().includes(filter.toLowerCase());

  if (hidden && !isExpandable) return null;

  const valuePreview = previewVar(entry.value);
  const truncated = valuePreview.length > 80 ? valuePreview.slice(0, 80) + '…' : valuePreview;

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-1 hairline-b px-2 py-1 hover:bg-bg-hover',
          selected === entry.id && 'bg-accent-soft',
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => (isExpandable ? toggle(entry.id) : setSelected(entry.id))}
          className="inline-flex h-3.5 w-3.5 items-center justify-center text-ink-3 hover:text-ink-1"
          aria-label={isExpandable ? (isOpen ? 'Collapse' : 'Expand') : 'Select'}
        >
          {isExpandable ? (
            isOpen ? (
              <Icon.ChevDown className="h-3 w-3" />
            ) : (
              <Icon.ChevRight className="h-3 w-3" />
            )
          ) : (
            <span className="inline-block h-1 w-1 rounded-full bg-line" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setSelected(entry.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <span className="font-mono text-[11px] text-ink-1">{entry.name}</span>
          <Chip tone="muted" size="xs">
            {entry.type}
          </Chip>
          {entry.isFrozen ? (
            <Chip tone="info" size="xs">
              frozen
            </Chip>
          ) : null}
          {entry.isProxy ? (
            <Chip tone="warn" size="xs">
              proxy
            </Chip>
          ) : null}
          <span className="ml-2 truncate font-mono text-[11px] text-ink-3">
            {truncated}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <Tooltip content="Copy value">
            <button
              type="button"
              onClick={() => toast(`Copied ${entry.name}`)}
              className="rounded-sm p-0.5 text-ink-3 hover:bg-bg hover:text-ink-1"
            >
              <Icon.Doc className="h-3 w-3" />
            </button>
          </Tooltip>
          <Tooltip content="Add to watch">
            <button
              type="button"
              onClick={() => toast(`Added ${entry.name} to watch`)}
              className="rounded-sm p-0.5 text-ink-3 hover:bg-bg hover:text-ink-1"
            >
              <Icon.Plus className="h-3 w-3" />
            </button>
          </Tooltip>
        </div>
      </div>
      {isOpen && (entry.value.kind === 'object' || entry.value.kind === 'array')
        ? entry.value.entries.map((c) => (
            <VarRow
              key={c.id}
              entry={c}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              selected={selected}
              setSelected={setSelected}
              filter={filter}
            />
          ))
        : null}
    </>
  );
}

export function VariablesScopeOverlay() {
  const open = useUiStore((s) => s.overlays.variablesScope.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeScopes, setActiveScopes] = useState<Set<ScopeKind>>(
    () => new Set(SCOPES),
  );
  const [search, setSearch] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['scope_Local', 'lc_product', 'lc_session']),
  );
  const [selected, setSelected] = useState<string>('lc_product');

  const flatIndex = useMemo(() => {
    const idx = new Map<string, VarEntry>();
    const walk = (entries: ReadonlyArray<VarEntry>) => {
      for (const e of entries) {
        idx.set(e.id, e);
        if (e.value.kind === 'object' || e.value.kind === 'array') {
          walk(e.value.entries);
        }
      }
    };
    for (const g of mockScopes) walk(g.entries);
    return idx;
  }, []);

  const selectedEntry = flatIndex.get(selected) ?? null;

  const counts = useMemo(
    () => mockScopes.map((g) => ({ kind: g.kind, count: g.entries.length })),
    [],
  );

  const toggleId = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleScope = (k: ScopeKind) => {
    setActiveScopes((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('variablesScope')}
      title="Variables"
      subtitle="Frame · ProductPage @ src/app/(commerce)/products/[id]/page.tsx:42"
      size="lg"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          {counts.map((c) => (
            <span key={c.kind}>
              {c.kind}: <span className="font-mono text-ink-1">{c.count}</span>
            </span>
          ))}
          <span className="ml-auto flex gap-1.5">
            <Button size="xs" tone="ghost" onClick={() => toast('Snapshot variables')}>
              Snapshot
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Compare with last snapshot')}
            >
              Compare with last
            </Button>
          </span>
        </span>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-caps text-ink-3">scopes</span>
        <div className="flex items-center gap-1">
          {SCOPES.map((sc) => (
            <ToggleChip
              key={sc}
              active={activeScopes.has(sc)}
              onClick={() => toggleScope(sc)}
            >
              {sc}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto w-56">
          <SearchInput value={search} onChange={setSearch} placeholder="search variable" />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px]">
        {/* Tree */}
        <ScrollArea className="h-[480px] hairline-r">
          <div>
            {mockScopes
              .filter((g) => activeScopes.has(g.kind))
              .map((g) => {
                const rootId = `scope_${g.kind}`;
                const isOpen = expanded.has(rootId);
                return (
                  <div key={g.kind}>
                    <button
                      type="button"
                      onClick={() => toggleId(rootId)}
                      className="flex w-full items-center gap-1 bg-bg-subtle px-2 py-1 text-left hover:bg-bg-hover"
                    >
                      {isOpen ? (
                        <Icon.ChevDown className="h-3 w-3 text-ink-3" />
                      ) : (
                        <Icon.ChevRight className="h-3 w-3 text-ink-3" />
                      )}
                      <span className="text-caps text-ink-2">{g.kind}</span>
                      <span className="ml-1 font-mono text-[10px] text-ink-3">
                        {g.entries.length}
                      </span>
                    </button>
                    {isOpen
                      ? g.entries.map((e) => (
                          <VarRow
                            key={e.id}
                            entry={e}
                            depth={1}
                            expanded={expanded}
                            toggle={toggleId}
                            selected={selected}
                            setSelected={setSelected}
                            filter={search}
                          />
                        ))
                      : null}
                  </div>
                );
              })}
          </div>
        </ScrollArea>

        {/* Right rail: detail */}
        <div className="flex h-[480px] flex-col">
          <div className="flex h-7 items-center px-3 hairline-b text-caps text-ink-3">
            Detail
          </div>
          <div className="flex-1 space-y-3 overflow-auto p-3">
            {selectedEntry ? (
              <>
                <div className="space-y-1">
                  <div className="font-mono text-[12px] text-ink-1">
                    {selectedEntry.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Chip tone="muted" size="xs">
                      {selectedEntry.type}
                    </Chip>
                    {selectedEntry.isFrozen ? (
                      <Chip tone="info" size="xs">
                        frozen
                      </Chip>
                    ) : null}
                    {selectedEntry.isProxy ? (
                      <Chip tone="warn" size="xs">
                        proxy
                      </Chip>
                    ) : null}
                    <Chip tone="neutral" size="xs">
                      ref #{selectedEntry.id}
                    </Chip>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-caps text-ink-3">value</div>
                  <CodeBlock
                    code={stringifyVar(selectedEntry.value)}
                    language="json"
                    showLineNumbers={false}
                    maxHeight={220}
                  />
                </div>
                <div>
                  <div className="mb-1 text-caps text-ink-3">set value (mock)</div>
                  <div className="flex gap-1">
                    <input
                      placeholder="new value"
                      className="h-7 flex-1 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
                    />
                    <Button
                      size="xs"
                      tone="accent"
                      onClick={() => toast(`Set ${selectedEntry.name} (mock)`)}
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-ink-3">No selection</div>
            )}
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
