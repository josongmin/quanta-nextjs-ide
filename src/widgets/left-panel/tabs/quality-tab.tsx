import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import type { Diagnostic } from '@shared/types';
import {
  Button,
  Chip,
  ConfidenceDot,
  Icon,
  SeverityDot,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { RscTraceSection } from '../parts/rsc-trace-section';
import {
  computeQualityScore,
  scoreTone,
  scoreBarBg,
  type QualityCategory,
} from '@widgets/right-panel/parts/quality-section';

type Filter = 'all' | QualityCategory;

const FILTERS: ReadonlyArray<FilterChipOption<Filter>> = [
  { value: 'all', label: 'All' },
  { value: 'typescript', label: 'TS' },
  { value: 'react', label: 'React' },
  { value: 'css', label: 'CSS' },
  { value: 'a11y', label: 'A11y' },
];

const CATEGORY_ORDER: ReadonlyArray<QualityCategory> = [
  'typescript',
  'react',
  'css',
  'a11y',
];

const LABELS: Record<QualityCategory, string> = {
  typescript: 'TypeScript',
  react: 'React',
  css: 'CSS / Tailwind',
  a11y: 'Accessibility',
};

function categoryIcon(c: QualityCategory) {
  return match(c)
    .with('typescript', () => Icon.Shield)
    .with('react', () => Icon.Hex)
    .with('css', () => Icon.Tag)
    .with('a11y', () => Icon.Layers)
    .exhaustive();
}

function severityRank(d: Diagnostic): number {
  return match(d.severity)
    .with('err', () => 4)
    .with('warn', () => 3)
    .with('info', () => 2)
    .with('hint', () => 1)
    .exhaustive();
}

export function QualityTab() {
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openTab = useEditorStore((s) => s.openTab);

  const [filter, setFilter] = useState<Filter>('all');
  const [expandedAll, setExpandedAll] = useState<Set<QualityCategory>>(
    new Set(),
  );

  const byCategory: Record<QualityCategory, Diagnostic[]> = useMemo(() => {
    const empty: Record<QualityCategory, Diagnostic[]> = {
      typescript: [],
      react: [],
      css: [],
      a11y: [],
    };
    for (const d of diagnostics) {
      if (
        d.category === 'typescript' ||
        d.category === 'react' ||
        d.category === 'css' ||
        d.category === 'a11y'
      ) {
        empty[d.category].push(d);
      }
    }
    return empty;
  }, [diagnostics]);

  const totalCount =
    byCategory.typescript.length +
    byCategory.react.length +
    byCategory.css.length +
    byCategory.a11y.length;

  const visibleCategories =
    filter === 'all' ? CATEGORY_ORDER : ([filter] as QualityCategory[]);

  const handleRowClick = (file: string) => {
    const label = file.split('/').pop() ?? file;
    openTab({ id: 'tab-' + file, file, label });
  };

  const toggleExpanded = (cat: QualityCategory) => {
    setExpandedAll((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={FILTERS}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
        <span className="ml-auto text-[10px] text-ink-3">
          {totalCount} issues
        </span>
        <Button
          size="xs"
          tone="soft"
          onClick={() => setInspectorContext({ kind: 'code-quality' })}
          aria-label="Open Code Quality inspector"
          title="Open Code Quality inspector"
        >
          <Icon.Right className="h-3 w-3" />
          inspect
        </Button>
      </TabHeader>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {visibleCategories.map((cat) => {
          const list = byCategory[cat];
          const isFiltered = filter !== 'all' && filter === cat;
          const score = computeQualityScore(list);
          const errs = list.filter((d) => d.severity === 'err').length;
          const warns = list.filter((d) => d.severity === 'warn').length;
          const hints = list.filter(
            (d) => d.severity === 'hint' || d.severity === 'info',
          ).length;
          const expanded = isFiltered || expandedAll.has(cat);
          const sorted = list
            .slice()
            .sort((a, b) => severityRank(b) - severityRank(a));
          const top = expanded ? sorted : sorted.slice(0, 5);
          const IconComp = categoryIcon(cat);

          return (
            <div key={cat} className="hairline-b last:border-b-0">
              <button
                type="button"
                onClick={() => toggleExpanded(cat)}
                className="flex h-8 w-full items-center gap-1.5 bg-bg-subtle px-2 text-xs hover:bg-bg-hover"
              >
                {expanded ? (
                  <Icon.ChevDown className="h-3 w-3 text-ink-3" />
                ) : (
                  <Icon.ChevRight className="h-3 w-3 text-ink-3" />
                )}
                <IconComp className="h-3.5 w-3.5 text-ink-3" />
                <span className="font-medium text-ink-1">{LABELS[cat]}</span>
                <Chip size="xs" tone="muted">
                  {list.length}
                </Chip>
                <span className="ml-auto inline-flex items-center gap-1.5">
                  <span className="hidden sm:inline-flex h-1 w-12 overflow-hidden rounded-sm border border-line bg-bg-subtle">
                    <span
                      className={cn('h-full', scoreBarBg(score))}
                      style={{ width: `${score}%` }}
                    />
                  </span>
                  <Chip size="xs" tone={scoreTone(score)} className="font-semibold">
                    {score}
                  </Chip>
                </span>
              </button>
              {expanded && (
                <div className="flex items-center gap-3 px-3 py-1 text-[10px] text-ink-3">
                  <span className="font-mono text-sev-err">{errs} err</span>
                  <span className="font-mono text-sev-warn">{warns} warn</span>
                  <span className="font-mono text-sev-hint">{hints} hint/info</span>
                </div>
              )}
              {expanded && (
                <div className="divide-y divide-line/70">
                  {top.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-ink-3">
                      No issues in this category.
                    </div>
                  ) : (
                    top.map((d) => (
                      <div
                        key={d.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(d.location.file)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRowClick(d.location.file);
                          }
                        }}
                        className="grid h-8 grid-cols-[14px_1fr_auto_14px] items-center gap-2 px-3 text-xs hover:bg-bg-hover"
                      >
                        <SeverityDot severity={d.severity} />
                        <span
                          className="min-w-0 truncate text-ink-1"
                          title={d.title}
                        >
                          {d.title}
                        </span>
                        <span className="truncate font-mono text-[10px] text-ink-3">
                          {d.location.file.split('/').slice(-2).join('/')}:
                          {d.location.line}
                        </span>
                        <ConfidenceDot confidence={d.confidence} />
                      </div>
                    ))
                  )}
                  {!isFiltered && sorted.length > 5 && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(cat)}
                      className="flex h-7 w-full items-center justify-center text-[11px] text-ink-3 hover:text-accent"
                    >
                      collapse
                    </button>
                  )}
                </div>
              )}
              {!expanded && sorted.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-1 text-[10px] text-ink-3">
                  <span className="font-mono text-sev-err">{errs} err</span>
                  <span className="font-mono text-sev-warn">{warns} warn</span>
                  <span className="font-mono text-sev-hint">{hints} hint/info</span>
                </div>
              )}
            </div>
          );
        })}
        <RscTraceSection mode="leak" />
      </div>
    </div>
  );
}
