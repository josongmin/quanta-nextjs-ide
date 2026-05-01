import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Chip,
  EmptyState,
  Icon,
  Kbd,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ALL_KINDS,
  KIND_ICON,
  KIND_LABEL,
  KIND_TONE,
  SYMBOLS,
  buildOutline,
  groupByFile,
  shortFile,
  type KindIconName,
  type OutlineNode,
  type SymbolEntry,
  type SymbolKind,
} from './helpers';

const KIND_ICON_COMP: Record<KindIconName, (typeof Icon)[keyof typeof Icon]> = {
  Code: Icon.Code,
  Box: Icon.Box,
  Zap: Icon.Zap,
  Hash: Icon.Hash,
  Layers: Icon.Layers,
  Tag: Icon.Tag,
  Hex: Icon.Hex,
};

function KindIcon({ name }: { name: KindIconName }) {
  const Comp = KIND_ICON_COMP[name];
  return <Comp className="h-3 w-3 shrink-0 text-ink-3" />;
}

export function GoToSymbolOverlay() {
  const open = useUiStore((s) => s.overlays.goToSymbol.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState('');
  const [activeKind, setActiveKind] = useState<SymbolKind | null>(null);
  const [outline, setOutline] = useState(false);

  const filtered = useMemo<ReadonlyArray<SymbolEntry>>(() => {
    const q = query.trim().toLowerCase();
    return SYMBOLS.filter((s) => {
      if (activeKind && s.kind !== activeKind) return false;
      if (q.length === 0) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.signature.toLowerCase().includes(q) ||
        s.file.toLowerCase().includes(q)
      );
    });
  }, [query, activeKind]);

  const groups = useMemo(() => groupByFile(filtered), [filtered]);
  const outlineGroups = useMemo(() => buildOutline(filtered), [filtered]);

  const handleOpen = (entry: SymbolEntry) => {
    toast('Open symbol', {
      description: `${entry.name} · ${shortFile(entry.file)}:${entry.line}`,
    });
    close('goToSymbol');
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('goToSymbol')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Search className="h-4 w-4 text-ink-3" />
          <span>Go to Symbol</span>
          <Chip tone="muted" size="xs">
            file-scoped
          </Chip>
        </span>
      }
      size="sm"
      footer={
        <>
          <ToggleChip
            active={outline}
            onClick={() => setOutline((v) => !v)}
            title="Group as nested tree (class -> methods)"
          >
            <Icon.Layers className="h-3 w-3" /> Outline mode
          </ToggleChip>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-3">
            <Kbd>esc</Kbd> close
            <span className="px-1">·</span>
            <Kbd>{'↵'}</Kbd> open
          </span>
        </>
      }
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 hairline-b">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search symbols by name, signature, or file"
            className="h-7 flex-1"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 hairline-b bg-bg-subtle">
          <ToggleChip
            active={activeKind === null}
            onClick={() => setActiveKind(null)}
          >
            All ({SYMBOLS.length})
          </ToggleChip>
          {ALL_KINDS.map((k) => {
            const count = SYMBOLS.filter((s) => s.kind === k).length;
            return (
              <ToggleChip
                key={k}
                active={activeKind === k}
                onClick={() => setActiveKind(activeKind === k ? null : k)}
              >
                <KindIcon name={KIND_ICON[k]} /> {KIND_LABEL[k]} ({count})
              </ToggleChip>
            );
          })}
        </div>

        <ScrollArea className="max-h-[60vh]">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No matching symbols"
                description="Try a different query or clear the kind filter."
                icon={<Icon.Search className="h-4 w-4" />}
              />
            </div>
          ) : outline ? (
            <ul>
              {outlineGroups.map((g) => (
                <li key={g.file} className="hairline-b last:border-b-0">
                  <FileHeader file={g.file} count={countNodes(g.roots)} />
                  <ul className="px-2 pb-1">
                    {g.roots.map((n) => (
                      <OutlineRow key={n.entry.id} node={n} depth={0} onOpen={handleOpen} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <ul>
              {groups.map((g) => (
                <li key={g.file} className="hairline-b last:border-b-0">
                  <FileHeader file={g.file} count={g.items.length} />
                  <ul>
                    {g.items.map((entry) => (
                      <FlatRow
                        key={entry.id}
                        entry={entry}
                        onOpen={() => handleOpen(entry)}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function countNodes(nodes: ReadonlyArray<OutlineNode>): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

function FileHeader({ file, count }: { file: string; count: number }) {
  return (
    <header className="flex items-center justify-between gap-2 px-3 py-1.5 bg-bg-subtle">
      <span className="flex items-center gap-1.5 truncate font-mono text-[11px] text-ink-2">
        <Icon.File className="h-3 w-3 text-ink-3" />
        {file}
      </span>
      <Chip tone="muted" size="xs">
        {count}
      </Chip>
    </header>
  );
}

function FlatRow({
  entry,
  onOpen,
}: {
  entry: SymbolEntry;
  onOpen(): void;
}) {
  return (
    <li>
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-bg-hover"
      >
        <KindIcon name={entry.kindIcon} />
        <Chip tone={KIND_TONE[entry.kind]} size="xs">
          {KIND_LABEL[entry.kind]}
        </Chip>
        <span className="font-mono text-[12px] text-ink-1">{entry.name}</span>
        <span className="truncate font-mono text-[11px] text-ink-3">
          {entry.signature}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-3">
          {shortFile(entry.file)}:{entry.line}
        </span>
      </button>
    </li>
  );
}

function OutlineRow({
  node,
  depth,
  onOpen,
}: {
  node: OutlineNode;
  depth: number;
  onOpen(entry: SymbolEntry): void;
}) {
  const [openNode, setOpenNode] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div
        className={cn(
          'flex items-center gap-1 rounded-sm hover:bg-bg-hover',
          depth === 0 ? 'px-1' : '',
        )}
        style={{ paddingLeft: 4 + depth * 12 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpenNode((v) => !v)}
            className="flex h-5 w-4 items-center justify-center text-ink-3 hover:text-ink-1"
            aria-label={openNode ? 'Collapse' : 'Expand'}
          >
            {openNode ? (
              <Icon.ChevDown className="h-3 w-3" />
            ) : (
              <Icon.ChevRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="inline-block h-5 w-4" />
        )}
        <button
          onClick={() => onOpen(node.entry)}
          className="flex flex-1 items-center gap-2 py-1 text-left"
        >
          <KindIcon name={node.entry.kindIcon} />
          <Chip tone={KIND_TONE[node.entry.kind]} size="xs">
            {KIND_LABEL[node.entry.kind]}
          </Chip>
          <span className="font-mono text-[12px] text-ink-1">
            {node.entry.name}
          </span>
          <span className="truncate font-mono text-[11px] text-ink-3">
            {node.entry.signature}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-3">
            :{node.entry.line}
          </span>
        </button>
      </div>
      {hasChildren && openNode ? (
        <ul>
          {node.children.map((c) => (
            <OutlineRow
              key={c.entry.id}
              node={c}
              depth={depth + 1}
              onOpen={onOpen}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

