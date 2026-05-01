/**
 * Gap card — "Intent stated X, Implementation did Y, Gap: Z".
 */

import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { CONSTRAINT_LABEL, type IntentConstraint } from './schema';
import type { IntentGap } from './gap';

interface Props {
  gap: IntentGap;
  intentGoal: string;
}

export function GapCard({ gap, intentGoal }: Props) {
  const violationCount = gap.constraintChecks.filter((c) => !c.satisfied).length;
  const tone = violationCount > 0 || gap.scope.unexpected.length > 0 ? 'warn' : 'info';
  return (
    <div
      className={cn(
        'rounded-md border p-3',
        tone === 'warn'
          ? 'border-sev-warn/30 bg-sev-warn-soft/30'
          : 'border-line/60 bg-bg-subtle',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-caps text-ink-3">Intent ↔ Implementation</span>
        <Chip size="xs" tone={tone}>{gap.overallSummary}</Chip>
      </div>

      <p className="mt-2 text-[12px] text-ink-1">
        <span className="text-ink-3">Intent stated:</span> {intentGoal}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-3 text-[12px]">
        <ConstraintsList checks={gap.constraintChecks} />
        <ScopeList scope={gap.scope} />
      </div>
    </div>
  );
}

function ConstraintsList({ checks }: { checks: IntentGap['constraintChecks'] }) {
  if (!checks.length) {
    return <span className="text-[11px] text-ink-3">No constraints stated.</span>;
  }
  return (
    <div>
      <header className="text-caps mb-1 text-ink-3">Constraints</header>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.constraint} className="flex items-start gap-2">
            <Chip size="xs" tone={c.satisfied ? 'info' : 'err'}>
              {c.satisfied ? 'ok' : 'gap'}
            </Chip>
            <span className="flex-1">
              <span className="text-ink-1">{CONSTRAINT_LABEL[c.constraint as IntentConstraint]}</span>
              <span className="block text-[11px] text-ink-3">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScopeList({ scope }: { scope: IntentGap['scope'] }) {
  return (
    <div>
      <header className="text-caps mb-1 text-ink-3">Scope match</header>
      <ul className="space-y-1 font-mono text-[11px]">
        {scope.matched.map((f) => (
          <li key={`m-${f}`} className="flex items-center gap-2">
            <Chip size="xs" tone="info">match</Chip>
            <span className="truncate text-ink-2">{f}</span>
          </li>
        ))}
        {scope.unexpected.map((f) => (
          <li key={`u-${f}`} className="flex items-center gap-2">
            <Chip size="xs" tone="warn">extra</Chip>
            <span className="truncate text-ink-2">{f}</span>
          </li>
        ))}
        {scope.missing.map((f) => (
          <li key={`miss-${f}`} className="flex items-center gap-2">
            <Chip size="xs" tone="err">miss</Chip>
            <span className="truncate text-ink-3">{f}</span>
          </li>
        ))}
        {scope.matched.length + scope.unexpected.length + scope.missing.length === 0 && (
          <li className="text-[11px] text-ink-3">No scope info yet.</li>
        )}
      </ul>
    </div>
  );
}
