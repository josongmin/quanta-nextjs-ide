import { Fragment, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { useSemanticDiffStore } from '@entities/semantic-diff';
import type { SemanticDiff, SemanticDiffEntry } from '@shared/types';
import {
  Button,
  Chip,
  CostChip,
  Icon,
  ScrollArea,
  SeverityLabel,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';

type Category = SemanticDiffEntry['category'];

const CATEGORY_LABELS: Record<Category, string> = {
  rendering: 'Rendering',
  cache: 'Cache',
  boundary: 'Client Boundary',
  auth: 'Auth',
  contract: 'Contract',
  cost: 'Cost',
  metadata: 'Metadata',
};

const CATEGORY_ORDER: ReadonlyArray<Category> = [
  'rendering',
  'cache',
  'boundary',
  'auth',
  'contract',
  'cost',
  'metadata',
];

function tabIdFor(file: string): string {
  return `tab-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

function tabLabelFor(file: string): string {
  return file.split('/').pop() ?? file;
}

function generatePrComment(diff: SemanticDiff): string {
  const lines: string[] = [];
  lines.push(`### Semantic Diff — ${diff.head} vs ${diff.base}`);
  lines.push('');
  for (const cat of CATEGORY_ORDER) {
    const entries = diff.entries.filter((e) => e.category === cat);
    if (!entries.length) continue;
    lines.push(`**${CATEGORY_LABELS[cat]} (${entries.length})**`);
    for (const e of entries) {
      lines.push(
        `- \`${e.scope}\`: ${e.before} → ${e.after}${e.cause ? ` _(${e.cause})_` : ''}`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function costClassFromString(s: string): 'A' | 'B' | 'C' | 'D' | 'E' | null {
  const m = s.match(/cost\s+([A-E])/i);
  const letter = m?.[1];
  if (!letter) return null;
  return letter.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
}

export function SemanticDiffTab() {
  const diff = useSemanticDiffStore((s) => s.diff);
  const selectedEntryId = useSemanticDiffStore((s) => s.selectedEntryId);
  const setSelected = useSemanticDiffStore((s) => s.setSelected);

  const routes = useRouteStore((s) => s.routes);
  const routeById = useMemo(
    () => new Map(routes.map((r) => [r.id, r] as const)),
    [routes],
  );

  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openTab = useEditorStore((s) => s.openTab);

  const [collapsedCats, setCollapsedCats] = useState<Set<Category>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<Category, SemanticDiffEntry[]>();
    for (const e of diff.entries) {
      const arr = map.get(e.category);
      if (arr) arr.push(e);
      else map.set(e.category, [e]);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      entries: map.get(c)!,
    }));
  }, [diff.entries]);

  const toggleCat = (c: Category) =>
    setCollapsedCats((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  const onRowClick = (e: SemanticDiffEntry) => {
    setSelected(selectedEntryId === e.id ? null : e.id);
  };

  const handleGenerateComment = async () => {
    const text = generatePrComment(diff);
    try {
      await navigator.clipboard.writeText(text);
      toast('PR comment copied to clipboard', {
        description: `${diff.entries.length} semantic changes summarized`,
      });
    } catch {
      toast('PR comment generated', {
        description: 'Clipboard unavailable — preview only',
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <PanelHeader>
        <Icon.Branch className="h-3.5 w-3.5 text-ink-3" />
        <span className="font-mono text-[11px] text-ink-2">{diff.base}</span>
        <Icon.Right className="h-3 w-3 text-ink-3" />
        <span className="font-mono text-[11px] text-ink-1">{diff.head}</span>
        <span className="text-ink-3">·</span>
        <span className="text-[11px] text-ink-3">
          {diff.entries.length} semantic changes
        </span>

        <div className="ml-auto">
          <Button size="xs" tone="default" onClick={handleGenerateComment}>
            <Icon.Doc className="h-3 w-3" />
            Generate PR comment
          </Button>
        </div>
      </PanelHeader>

      <ScrollArea className="flex-1">
        {grouped.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            No semantic changes between branches.
          </div>
        ) : (
          <div className="text-sm">
            {grouped.map(({ category, entries }) => {
              const collapsed = collapsedCats.has(category);
              return (
                <Fragment key={category}>
                  <button
                    type="button"
                    onClick={() => toggleCat(category)}
                    className="flex h-7 w-full items-center gap-1.5 hairline-b bg-bg-subtle px-3 text-left text-xs font-medium text-ink-1 hover:bg-bg-hover"
                  >
                    {collapsed ? (
                      <Icon.ChevRight className="h-3.5 w-3.5 text-ink-3" />
                    ) : (
                      <Icon.ChevDown className="h-3.5 w-3.5 text-ink-3" />
                    )}
                    <span className="uppercase tracking-caps">
                      {CATEGORY_LABELS[category]}
                    </span>
                    <span className="ml-auto rounded-sm border border-line bg-bg px-1 text-[10px] font-semibold text-ink-2">
                      {entries.length}
                    </span>
                  </button>

                  {!collapsed &&
                    entries.map((e) => (
                      <Fragment key={e.id}>
                        <DiffRow
                          entry={e}
                          selected={selectedEntryId === e.id}
                          onClick={() => onRowClick(e)}
                        />
                        {selectedEntryId === e.id ? (
                          <DiffExpansion
                            entry={e}
                            routeName={
                              e.routeId
                                ? (routeById.get(e.routeId)?.path ?? e.routeId)
                                : null
                            }
                            affectedRouteIds={e.routeId ? [e.routeId] : []}
                            onAffectedRouteClick={(routeId) => {
                              setInspectorContext({ kind: 'route', routeId });
                              const r = routeById.get(routeId);
                              const file = r?.files.page;
                              if (file) {
                                openTab({
                                  id: tabIdFor(file),
                                  file,
                                  label: tabLabelFor(file),
                                });
                              }
                            }}
                            onLeftMiniClick={() => {
                              if (e.routeId) {
                                setInspectorContext({
                                  kind: 'route',
                                  routeId: e.routeId,
                                });
                              }
                            }}
                          />
                        ) : null}
                      </Fragment>
                    ))}
                </Fragment>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface DiffRowProps {
  entry: SemanticDiffEntry;
  selected: boolean;
  onClick(): void;
}

function DiffRow({ entry, selected, onClick }: DiffRowProps) {
  const beforeCost =
    entry.category === 'cost' ? costClassFromString(entry.before) : null;
  const afterCost =
    entry.category === 'cost' ? costClassFromString(entry.after) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'grid h-7 cursor-pointer grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,2fr)_64px] items-center gap-2 hairline-b px-3 text-xs hover:bg-bg-hover',
        selected && 'bg-bg-subtle',
      )}
    >
      <span className="truncate font-mono text-ink-1">{entry.scope}</span>

      <span className="flex min-w-0 items-center gap-1.5 text-ink-2">
        {beforeCost ? (
          <CostChip cost={beforeCost} />
        ) : (
          <Chip tone="muted" size="xs">
            {entry.before}
          </Chip>
        )}
        <Icon.Right className="h-3 w-3 shrink-0 text-ink-3" />
        {afterCost ? (
          <CostChip cost={afterCost} />
        ) : (
          <Chip
            tone={
              entry.severity === 'err'
                ? 'err'
                : entry.severity === 'warn'
                  ? 'warn'
                  : 'info'
            }
            size="xs"
          >
            {entry.after}
          </Chip>
        )}
      </span>

      <span className="truncate text-[11px] italic text-ink-3">
        {entry.cause ?? '—'}
      </span>

      <span className="flex justify-end">
        <SeverityLabel severity={entry.severity} />
      </span>
    </div>
  );
}

interface DiffExpansionProps {
  entry: SemanticDiffEntry;
  routeName: string | null;
  affectedRouteIds: string[];
  onAffectedRouteClick(routeId: string): void;
  onLeftMiniClick(): void;
}

function DiffExpansion({
  entry,
  routeName,
  affectedRouteIds,
  onAffectedRouteClick,
  onLeftMiniClick,
}: DiffExpansionProps) {
  const before = match(entry.category)
    .with(
      'rendering',
      () =>
        `// ${entry.scope}\n// rendering: ${entry.before}\nexport default async function Page() {\n  return <Shell>{children}</Shell>;\n}`,
    )
    .with(
      'cache',
      () => `// ${entry.scope}\nfetch(url, {\n  // ${entry.before}\n});`,
    )
    .with(
      'boundary',
      () =>
        `// ${entry.before}\n'use client';\nexport function AppShell() { /* ... */ }`,
    )
    .with(
      'auth',
      () =>
        `// ${entry.scope}\nexport async function action() {\n  // ${entry.before}\n  await mutate();\n}`,
    )
    .with('contract', () => `// ${entry.scope}\n// ${entry.before}`)
    .with('cost', () => `// ${entry.scope}\n// ${entry.before}`)
    .with(
      'metadata',
      () =>
        `// ${entry.scope}\nexport const metadata = {\n  // ${entry.before}\n};`,
    )
    .exhaustive();

  const after = match(entry.category)
    .with(
      'rendering',
      () =>
        `// ${entry.scope}\n// rendering: ${entry.after}\nexport default async function Page() {\n  const session = await getSession();\n  return <Shell>{children}</Shell>;\n}`,
    )
    .with(
      'cache',
      () =>
        `// ${entry.scope}\nfetch(url, {\n  // ${entry.after}\n  cache: 'no-store',\n});`,
    )
    .with(
      'boundary',
      () =>
        `// ${entry.after}\n'use client';\nexport function AppShell() { /* hoisted */ }`,
    )
    .with(
      'auth',
      () =>
        `// ${entry.scope}\nexport async function action() {\n  // ${entry.after}\n  await mutate();\n}`,
    )
    .with('contract', () => `// ${entry.scope}\n// ${entry.after}`)
    .with('cost', () => `// ${entry.scope}\n// ${entry.after}`)
    .with(
      'metadata',
      () =>
        `// ${entry.scope}\nexport const metadata = {\n  // ${entry.after}\n};`,
    )
    .exhaustive();

  return (
    <div className="hairline-b bg-bg-subtle px-3 py-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div
          role="button"
          tabIndex={0}
          onClick={onLeftMiniClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onLeftMiniClick();
            }
          }}
          className="cursor-pointer rounded-sm border border-line bg-bg hover:border-line-strong"
        >
          <div className="grid grid-cols-2 divide-x divide-line">
            <CodeMini label="before" code={before} tone="warn" />
            <CodeMini label="after" code={after} tone="accent" />
          </div>
        </div>

        <section>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            Affected routes
          </div>
          {affectedRouteIds.length === 0 ? (
            <div className="text-xs text-ink-3">
              {routeName ?? 'No routes directly affected'}
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {affectedRouteIds.map((rid) => (
                <li key={rid}>
                  <button
                    type="button"
                    onClick={() => onAffectedRouteClick(rid)}
                    className="flex w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-xs text-ink-1 hover:bg-bg-hover"
                  >
                    <Icon.Link className="h-3 w-3 text-ink-3" />
                    <span className="truncate font-mono">{rid}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {entry.cause ? (
            <>
              <div className="mb-1 mt-2 text-[10px] uppercase tracking-caps text-ink-3">
                Cause
              </div>
              <p className="text-xs italic text-ink-2">{entry.cause}</p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

interface CodeMiniProps {
  label: string;
  code: string;
  tone: 'warn' | 'accent';
}

function CodeMini({ label, code, tone }: CodeMiniProps) {
  return (
    <div className="flex flex-col">
      <div
        className={cn(
          'flex h-5 items-center gap-1 px-2 text-[10px] uppercase tracking-caps',
          tone === 'warn' && 'bg-sev-warn-soft text-sev-warn',
          tone === 'accent' && 'bg-accent-soft text-accent',
        )}
      >
        {label}
      </div>
      <pre className="overflow-x-auto p-2 font-mono text-[11px] leading-snug text-ink-1">
        {code}
      </pre>
    </div>
  );
}
