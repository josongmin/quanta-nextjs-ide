import { useMemo, type ReactElement } from 'react';
import { Chip, CodeBlock, Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useQuerySemanticsStore } from './store';
import { SMELL_LABEL, type QuerySmell, type QuerySmellKind } from './types';

const SEV_TONE: Record<QuerySmell['severity'], 'info' | 'warn' | 'err'> = {
  low: 'info',
  medium: 'warn',
  high: 'err',
};

const KIND_ICON: Record<QuerySmellKind, ReactElement> = {
  'n+1': <Icon.Refresh className="h-3 w-3 text-sev-err" />,
  'no-pagination': <Icon.Layers className="h-3 w-3 text-sev-warn" />,
  'no-transaction': <Icon.Shield className="h-3 w-3 text-sev-warn" />,
  'heavy-include': <Icon.Database className="h-3 w-3 text-sev-info" />,
  'select-star': <Icon.Hash className="h-3 w-3 text-ink-3" />,
};

const KINDS: QuerySmellKind[] = [
  'n+1',
  'no-pagination',
  'no-transaction',
  'heavy-include',
  'select-star',
];

function SmellRow({ smell }: { smell: QuerySmell }) {
  const expandedId = useQuerySemanticsStore((s) => s.expandedId);
  const setExpanded = useQuerySemanticsStore((s) => s.setExpanded);
  const expanded = expandedId === smell.id;
  return (
    <div
      className={cn(
        'rounded-sm border border-line bg-bg',
        smell.severity === 'high' && 'border-sev-err/40',
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
        onClick={() => setExpanded(expanded ? null : smell.id)}
      >
        {KIND_ICON[smell.kind]}
        <Chip tone={SEV_TONE[smell.severity]} size="xs">
          {smell.severity}
        </Chip>
        <span className="font-mono text-[11px] text-ink-3">
          {smell.file}:{smell.line}
        </span>
        <span className="flex-1 truncate text-ink-1">{smell.title}</span>
        <Icon.ChevRight
          className={cn(
            'h-3 w-3 text-ink-3 transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      {expanded ? (
        <div className="hairline-t bg-bg-subtle/40 px-3 py-2 text-[11px]">
          <p className="mb-2 text-ink-2">{smell.message}</p>
          <CodeBlock
            code={smell.snippet}
            language="ts"
            showLineNumbers={false}
            maxHeight={140}
          />
          <div className="mt-2 flex items-start gap-1.5 rounded-sm bg-accent-soft/40 px-2 py-1.5">
            <Icon.Bulb className="mt-0.5 h-3 w-3 text-accent" />
            <span className="text-ink-2">{smell.suggestion}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function QuerySemanticsPanel() {
  const smells = useQuerySemanticsStore((s) => s.smells);
  const filterKind = useQuerySemanticsStore((s) => s.filterKind);
  const setFilter = useQuerySemanticsStore((s) => s.setFilter);

  const counts = useMemo(() => {
    const acc: Record<QuerySmellKind, number> = {
      'n+1': 0,
      'no-pagination': 0,
      'no-transaction': 0,
      'heavy-include': 0,
      'select-star': 0,
    };
    for (const s of smells) acc[s.kind]++;
    return acc;
  }, [smells]);

  const grouped = useMemo(() => {
    const groups = new Map<QuerySmellKind, QuerySmell[]>();
    for (const k of KINDS) groups.set(k, []);
    for (const s of smells) {
      if (filterKind !== 'all' && s.kind !== filterKind) continue;
      groups.get(s.kind)!.push(s);
    }
    return groups;
  }, [smells, filterKind]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">filter</span>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'h-5 rounded-sm border border-line/60 px-1.5 text-[11px]',
            filterKind === 'all' && 'border-accent bg-accent-soft text-accent',
          )}
        >
          all ({smells.length})
        </button>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              'h-5 rounded-sm border border-line/60 px-1.5 text-[11px]',
              filterKind === k && 'border-accent bg-accent-soft text-accent',
            )}
          >
            {SMELL_LABEL[k]} ({counts[k]})
          </button>
        ))}
      </header>
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="flex flex-col gap-3">
          {KINDS.map((k) => {
            const items = grouped.get(k) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={k}>
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-caps text-ink-3">
                  {KIND_ICON[k]}
                  <span>{SMELL_LABEL[k]}</span>
                  <span className="font-mono">{items.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((s) => (
                    <SmellRow key={s.id} smell={s} />
                  ))}
                </div>
              </div>
            );
          })}
          {smells.length === 0 ? (
            <div className="rounded-sm bg-bg-subtle/40 p-6 text-center text-xs text-ink-3">
              No query smells detected.
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

export default QuerySemanticsPanel;
