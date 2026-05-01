import { useMemo } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDiagnosticStore } from '@entities/diagnostic';
import type { Diagnostic } from '@shared/types';
import {
  Button,
  Chip,
  Icon,
  Inspector,
  Section,
  SeverityDot,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  QualitySection,
  computeQualityScore,
  scoreBarBg,
  scoreTone,
  type QualityCategory,
} from '../parts/quality-section';

const CATEGORIES: ReadonlyArray<QualityCategory> = [
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

const SHORT_LABELS: Record<QualityCategory, string> = {
  typescript: 'TS',
  react: 'React',
  css: 'CSS',
  a11y: 'A11y',
};

interface SuggestedCleanup {
  id: string;
  title: string;
  detail: string;
  count: number;
}

export function CodeQualityInspector() {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);

  const byCategory: Record<QualityCategory, Diagnostic[]> = useMemo(() => {
    const acc: Record<QualityCategory, Diagnostic[]> = {
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
        acc[d.category].push(d);
      }
    }
    return acc;
  }, [diagnostics]);

  const total =
    byCategory.typescript.length +
    byCategory.react.length +
    byCategory.css.length +
    byCategory.a11y.length;

  // Hot files (top 5 by total count across categories)
  const hotFiles = useMemo(() => {
    const fileMap = new Map<
      string,
      { total: number; err: number; warn: number; hint: number }
    >();
    const qualityDiagnostics = CATEGORIES.flatMap((c) => byCategory[c]);
    for (const d of qualityDiagnostics) {
      const key = d.location.file;
      const cur = fileMap.get(key) ?? { total: 0, err: 0, warn: 0, hint: 0 };
      cur.total += 1;
      match(d.severity)
        .with('err', () => {
          cur.err += 1;
        })
        .with('warn', () => {
          cur.warn += 1;
        })
        .with('hint', () => {
          cur.hint += 1;
        })
        .with('info', () => {
          cur.hint += 1;
        })
        .exhaustive();
      fileMap.set(key, cur);
    }
    return Array.from(fileMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
  }, [byCategory]);

  // Suggested cleanups (group by ruleId, pick top groups)
  const cleanups: SuggestedCleanup[] = useMemo(() => {
    const tsIgnore = byCategory.typescript.filter(
      (d) => d.ruleId === 'ts-ignore-comment',
    ).length;
    const darkGap = byCategory.css.filter(
      (d) => d.ruleId === 'css-dark-mode-gap',
    ).length;
    const ariaButton = byCategory.a11y.filter(
      (d) => d.ruleId === 'a11y-button-name',
    ).length;
    const tailwindDrift = byCategory.css.filter(
      (d) => d.ruleId === 'css-tailwind-drift',
    ).length;
    const candidates: SuggestedCleanup[] = [
      tsIgnore > 0
        ? {
            id: 'cleanup-ts-ignore',
            title: `Remove ${tsIgnore} \`@ts-ignore\` comment${tsIgnore === 1 ? '' : 's'}`,
            detail: 'Audit & replace with `@ts-expect-error <reason>`',
            count: tsIgnore,
          }
        : null,
      darkGap > 0
        ? {
            id: 'cleanup-dark-mode',
            title: `Add ${darkGap} \`dark:\` variant${darkGap === 1 ? '' : 's'}`,
            detail: 'Restores theme parity for affected components',
            count: darkGap,
          }
        : null,
      ariaButton > 0
        ? {
            id: 'cleanup-aria-button',
            title: `Add aria-label to ${ariaButton} icon-only button${ariaButton === 1 ? '' : 's'}`,
            detail: 'Restores accessible name for screen readers',
            count: ariaButton,
          }
        : null,
      tailwindDrift > 0
        ? {
            id: 'cleanup-tailwind-drift',
            title: `Extract ${tailwindDrift} repeated Tailwind recipe${tailwindDrift === 1 ? '' : 's'}`,
            detail: 'Codemod into shared `cva` primitives',
            count: tailwindDrift,
          }
        : null,
    ].filter((c): c is SuggestedCleanup => c !== null);
    return candidates.slice(0, 3);
  }, [byCategory]);

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <Chip size="xs" tone="accent">
            CODE QUALITY
          </Chip>
          <span className="font-mono text-sm text-ink-1">project audit</span>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          TS · React · CSS · A11y · {total} issues
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Project score */}
      <Section title="Project score" defaultOpen>
        <div className="space-y-3">
          <div className="flex h-2 w-full overflow-hidden rounded-sm border border-line bg-bg-subtle">
            {CATEGORIES.map((c) => {
              const count = byCategory[c].length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              const score = computeQualityScore(byCategory[c]);
              return (
                <div
                  key={c}
                  className={cn('h-full', scoreBarBg(score))}
                  style={{ width: `${pct}%` }}
                  title={`${LABELS[c]}: ${count} (score ${score})`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {CATEGORIES.map((c) => {
              const count = byCategory[c].length;
              const score = computeQualityScore(byCategory[c]);
              return (
                <div
                  key={c}
                  className="flex items-center justify-between gap-2 font-mono"
                >
                  <span className="text-ink-2">{SHORT_LABELS[c]}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-ink-3">{count}</span>
                    <Chip
                      size="xs"
                      tone={scoreTone(score)}
                      className="font-semibold"
                    >
                      {score}
                    </Chip>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Per-category sections */}
      {CATEGORIES.map((c) => (
        <QualitySection
          key={c}
          category={c}
          label={LABELS[c]}
          diagnostics={byCategory[c]}
          defaultOpen={c === 'typescript' || c === 'react'}
        />
      ))}

      {/* Hot files */}
      <Section title="Hot files" defaultOpen={false}>
        {hotFiles.length === 0 ? (
          <div className="px-1 py-2 text-xs text-ink-3">No hotspots.</div>
        ) : (
          <ol className="space-y-0.5 text-xs">
            {hotFiles.map(([file, counts], i) => (
              <li
                key={file}
                className="grid grid-cols-[16px_1fr_auto] items-center gap-2 py-0.5"
              >
                <span className="font-mono text-ink-3">{i + 1}.</span>
                <span
                  className="min-w-0 truncate font-mono text-ink-2"
                  title={file}
                >
                  {file.split('/').slice(-2).join('/')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px]">
                  {counts.err > 0 && (
                    <Chip size="xs" tone="err">
                      <SeverityDot severity="err" />
                      {counts.err}
                    </Chip>
                  )}
                  {counts.warn > 0 && (
                    <Chip size="xs" tone="warn">
                      <SeverityDot severity="warn" />
                      {counts.warn}
                    </Chip>
                  )}
                  {counts.hint > 0 && (
                    <Chip size="xs" tone="hint">
                      <SeverityDot severity="hint" />
                      {counts.hint}
                    </Chip>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Suggested cleanups */}
      <Section title="Suggested cleanups" defaultOpen>
        {cleanups.length === 0 ? (
          <div className="px-1 py-2 text-xs text-ink-3">
            No cleanup batches available.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {cleanups.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-2 py-1 text-xs"
              >
                <Icon.Bulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sev-warn" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-ink-1">{c.title}</div>
                  <div className="truncate text-[11px] text-ink-3">
                    {c.detail}
                  </div>
                </div>
                <Button
                  size="xs"
                  tone="soft"
                  onClick={() =>
                    toast.message('Apply all queued', {
                      description: `${c.count} fix${c.count === 1 ? '' : 'es'} would be applied`,
                    })
                  }
                >
                  Apply all
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Inspector>
  );
}
