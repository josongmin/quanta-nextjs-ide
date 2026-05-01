import { match } from 'ts-pattern';
import { toast } from 'sonner';
import type { Diagnostic } from '@shared/types';
import {
  Button,
  Chip,
  ConfidenceDot,
  Icon,
  Section,
  SeverityDot,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';

export type QualityCategory = 'typescript' | 'react' | 'css' | 'a11y';

interface Props {
  category: QualityCategory;
  label: string;
  diagnostics: Diagnostic[];
  defaultOpen?: boolean;
}

const labels: Record<QualityCategory, string> = {
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

export function computeQualityScore(diagnostics: Diagnostic[]): number {
  const err = diagnostics.filter((d) => d.severity === 'err').length;
  const warn = diagnostics.filter((d) => d.severity === 'warn').length;
  const hint = diagnostics.filter(
    (d) => d.severity === 'hint' || d.severity === 'info',
  ).length;
  const raw = 100 - (err * 10 + warn * 5 + hint * 2);
  return Math.max(0, Math.min(100, raw));
}

export function scoreTone(
  score: number,
): 'static' | 'warn' | 'err' {
  if (score >= 80) return 'static';
  if (score >= 60) return 'warn';
  return 'err';
}

export function scoreBarBg(score: number): string {
  if (score >= 80) return 'bg-sem-static';
  if (score >= 60) return 'bg-sev-warn';
  return 'bg-sev-err';
}

export function QualitySection({
  category,
  label,
  diagnostics,
  defaultOpen = true,
}: Props) {
  const IconComp = categoryIcon(category);
  const score = computeQualityScore(diagnostics);
  const errs = diagnostics.filter((d) => d.severity === 'err').length;
  const warns = diagnostics.filter((d) => d.severity === 'warn').length;
  const hints = diagnostics.filter(
    (d) => d.severity === 'hint' || d.severity === 'info',
  ).length;
  const top = diagnostics
    .slice()
    .sort((a, b) => severityRank(b) - severityRank(a))
    .slice(0, 5);

  return (
    <Section
      title={
        <span className="inline-flex items-center gap-1.5">
          <IconComp className="h-3.5 w-3.5 text-ink-3" />
          <span>{label || labels[category]}</span>
          <Chip size="xs" tone="muted">
            {diagnostics.length}
          </Chip>
        </span>
      }
      defaultOpen={defaultOpen}
      trailing={
        <Chip size="xs" tone={scoreTone(score)} className="font-semibold">
          {score}
        </Chip>
      }
    >
      <div className="space-y-2">
        {/* Score bar */}
        <div className="flex h-1.5 w-full overflow-hidden rounded-sm border border-line bg-bg-subtle">
          <div
            className={cn('h-full', scoreBarBg(score))}
            style={{ width: `${score}%` }}
            title={`score ${score}/100`}
          />
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="font-mono text-sev-err">{errs} err</span>
          <span className="font-mono text-sev-warn">{warns} warn</span>
          <span className="font-mono text-sev-hint">{hints} hint/info</span>
        </div>

        {/* Top issues */}
        {top.length === 0 ? (
          <div className="px-1 py-2 text-xs text-ink-3">
            No issues in this category.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {top.map((d) => (
              <li
                key={d.id}
                className="grid grid-cols-[14px_1fr_auto_auto] items-center gap-2 py-0.5 text-xs"
              >
                <SeverityDot severity={d.severity} />
                <span className="min-w-0 truncate text-ink-1" title={d.title}>
                  {d.title}
                </span>
                <ConfidenceDot confidence={d.confidence} />
                <Button
                  size="xs"
                  tone="ghost"
                  className="h-4 px-1 text-[10px]"
                  onClick={() =>
                    toast.message('Trace evidence', {
                      description: `${d.location.file}:${d.location.line}`,
                    })
                  }
                >
                  trace
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

function severityRank(d: Diagnostic): number {
  return match(d.severity)
    .with('err', () => 4)
    .with('warn', () => 3)
    .with('info', () => 2)
    .with('hint', () => 1)
    .exhaustive();
}
