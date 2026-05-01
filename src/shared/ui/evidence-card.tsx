import { cn } from '@shared/lib/cn';
import type { Diagnostic } from '@shared/types';
import { ConfidenceDot } from './confidence-dot';
import { SeverityLabel } from './severity-icon';
import { Chip } from './chip';
import { Button } from './button';
import { Icon } from './icons';

interface EvidenceCardProps {
  diagnostic: Diagnostic;
  onShowTrace?(): void;
  onApplyFix?(fixId: string): void;
  onMute?(scope: 'line' | 'file' | 'route' | 'project'): void;
  onJump?(file: string, line: number): void;
  className?: string;
  compact?: boolean;
}

export function EvidenceCard({
  diagnostic: d,
  onShowTrace,
  onApplyFix,
  onMute,
  onJump,
  className,
  compact = false,
}: EvidenceCardProps) {
  const showQuestion = d.confidence !== 'high';
  return (
    <div
      role="dialog"
      aria-label={d.title}
      className={cn(
        'w-[420px] overflow-hidden rounded-md border border-line bg-bg shadow-pop',
        'animate-in fade-in-0 zoom-in-[0.98] duration-150 ease-out',
        className,
      )}
    >
      <header className="flex items-start gap-2 px-3 py-2 hairline-b">
        <ConfidenceDot confidence={d.confidence} className="mt-1" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-ink-1">
            <span className="truncate">{d.title}</span>
            {showQuestion ? <span className="text-ink-3">?</span> : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-3">
            <span className="truncate">{d.scope}</span>
            <span>·</span>
            <span className="font-mono text-ink-3">{d.ruleId}</span>
          </div>
        </div>
        <SeverityLabel severity={d.severity} />
      </header>

      {d.evidence.length > 0 && (
        <Block title="Evidence">
          <ul className="space-y-1">
            {d.evidence.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-[11px] text-ink-3">·</span>
                <span className="flex-1 text-ink-1">{e.label}</span>
                <Chip
                  tone="muted"
                  size="xs"
                  className="font-normal normal-case tracking-normal"
                >
                  {e.kind}
                </Chip>
                {e.location && onJump && (
                  <button
                    onClick={() => onJump(e.location!.file, e.location!.line)}
                    className="text-ink-3 hover:text-accent"
                    aria-label="Jump to location"
                  >
                    <Icon.UpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {d.impact.length > 0 && (
        <Block title="Impact">
          <ul className="space-y-1 text-sm text-ink-2">
            {d.impact.map((i) => (
              <li key={i} className="before:mr-1.5 before:content-['•']">
                {i}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {!compact && (
        <Block title="Confidence">
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <ConfidenceDot confidence={d.confidence} />
            <span className="capitalize text-ink-1">{d.confidence}</span>
            {d.confidence !== 'high' && d.evidence.some((e) => e.kind !== 'direct') ? (
              <span className="text-ink-3">· indirect/heuristic evidence</span>
            ) : null}
          </div>
        </Block>
      )}

      <footer className="flex items-center justify-between gap-1.5 px-3 py-2 hairline-t bg-bg-subtle">
        <div className="flex items-center gap-1">
          <Button size="xs" tone="ghost" onClick={onShowTrace}>
            <Icon.Net className="h-3 w-3" /> Show trace
          </Button>
          {d.fixes.length > 0 && (
            <Button
              size="xs"
              tone="default"
              onClick={() => d.fixes[0] && onApplyFix?.(d.fixes[0].id)}
            >
              <Icon.Bulb className="h-3 w-3" /> Quick fix
            </Button>
          )}
        </div>
        <Button
          size="xs"
          tone="ghost"
          onClick={() => onMute?.('line')}
          className="text-ink-3"
        >
          Mute
        </Button>
      </footer>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-3 py-2 hairline-b">
      <h3 className="mb-1.5 text-caps text-ink-3">{title}</h3>
      {children}
    </section>
  );
}
