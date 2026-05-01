import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useActionStore } from '@entities/server-action';
import { Button, Chip, Inspector, Section } from '@shared/ui';
import type { ActionChecklistItem } from '@shared/types';
import { cn } from '@shared/lib/cn';
import { EmptyState, StateIcon, type IconState } from '../parts';

interface Props {
  actionId: string;
}

const checklistStateIcon = (s: ActionChecklistItem['state']): IconState =>
  match(s)
    .with('ok', () => 'ok' as const)
    .with('missing', () => 'missing' as const)
    .with('partial', () => 'partial' as const)
    .with('unknown', () => 'unknown' as const)
    .exhaustive();

const checklistStateText = (s: ActionChecklistItem['state']): string =>
  match(s)
    .with('ok', () => 'present')
    .with('missing', () => 'missing')
    .with('partial', () => 'partial')
    .with('unknown', () => 'unknown')
    .exhaustive();

const stateColor = (s: ActionChecklistItem['state']): string =>
  match(s)
    .with('ok', () => 'text-sem-static')
    .with('missing', () => 'text-sev-err')
    .with('partial', () => 'text-sev-warn')
    .with('unknown', () => 'text-ink-3')
    .exhaustive();

const scoreTone = (
  score: number,
): { chip: 'static' | 'isr' | 'warn' | 'err'; word: string } => {
  if (score >= 80) return { chip: 'static', word: 'Healthy' };
  if (score >= 60) return { chip: 'isr', word: 'Acceptable' };
  if (score >= 40) return { chip: 'warn', word: 'Needs work' };
  return { chip: 'err', word: 'Critical' };
};

export function ActionSafetyInspector({ actionId }: Props) {
  const action = useActionStore((s) => s.byActionId(actionId));
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);

  if (!action) {
    return (
      <Inspector
        title="ACTION"
        meta={actionId}
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>Server action not found.</EmptyState>
      </Inspector>
    );
  }

  const score = scoreTone(action.score);

  const insertAll = (): void => {
    const missing = action.checklist.filter(
      (c) => c.state === 'missing' || c.state === 'partial',
    );
    toast(`Insert ${missing.length} missing piece(s) into ${action.name} (preview)`);
  };

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">ACTION</span>
          <span className="font-mono text-sm text-ink-1">{action.name}</span>
          <Chip tone={score.chip} size="xs">
            <span className="font-mono">Score {action.score} / 100</span>
          </Chip>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          <span className="text-ink-3">{score.word}</span>
          <span className="mx-1 text-ink-3">·</span>
          <span className="text-ink-2">{action.file}</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Checklist ----------------------------------------------------- */}
      <Section title="Checklist" defaultOpen>
        <div className="space-y-0">
          {action.checklist.map((c) => {
            const showInsert = c.state === 'missing' || c.state === 'partial';
            const insertLabel =
              c.key === 'revalidate' && c.state === 'missing'
                ? 'Insert "products"'
                : c.state === 'partial'
                  ? 'Improve'
                  : 'Insert';
            return (
              <div
                key={c.key}
                className="grid min-h-[28px] grid-cols-[20px_1fr_auto] items-start gap-2 py-1 text-xs"
              >
                <StateIcon state={checklistStateIcon(c.state)} />
                <div className="min-w-0">
                  <div
                    className={cn(
                      'flex items-center gap-1.5 truncate text-ink-2',
                      stateColor(c.state),
                    )}
                  >
                    <span className="font-medium">{c.label}</span>
                    <span className="text-ink-3">·</span>
                    <span className="text-ink-3">{checklistStateText(c.state)}</span>
                  </div>
                  {c.hint ? (
                    <div className="truncate text-[11px] text-ink-3">{c.hint}</div>
                  ) : null}
                </div>
                {showInsert ? (
                  <Button
                    size="xs"
                    tone="soft"
                    onClick={() =>
                      toast(`${insertLabel}: ${c.label} → ${action.name} (preview)`)
                    }
                  >
                    {insertLabel}
                  </Button>
                ) : c.state === 'unknown' ? (
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() =>
                      toast(`Investigate: ${c.label} on ${action.name}`)
                    }
                  >
                    ?
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Closure capture ---------------------------------------------- */}
      <Section title="Closure capture" defaultOpen>
        {action.closureCapture ? (
          <div className="flex items-start gap-2 text-xs">
            <StateIcon state="warn" />
            <div className="min-w-0">
              <div className="text-sev-warn">captured</div>
              <div className="text-[11px] text-ink-3">
                Action ID may not be stable across builds. Avoid closing over
                outer-scope variables in `'use server'` actions.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <StateIcon state="ok" />
            <span className="text-sem-static">None.</span>
            <span className="text-ink-3">action ID stable across builds</span>
          </div>
        )}
      </Section>

      {/* Surface ------------------------------------------------------ */}
      <Section title="Surface" defaultOpen>
        {action.exposedSurface.length === 0 ? (
          <EmptyState>Not imported anywhere.</EmptyState>
        ) : (
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-caps text-ink-3">
              imported by
            </div>
            {action.exposedSurface.map((file) => (
              <div
                key={file}
                className="flex items-center gap-1.5 py-0.5 text-xs"
              >
                <Chip tone="client" size="xs">
                  RPC
                </Chip>
                <span className="truncate font-mono text-ink-2">{file}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Quick scaffold ----------------------------------------------- */}
      <Section title="Quick scaffold" defaultOpen={false}>
        <Button tone="accent" size="sm" onClick={insertAll} className="w-full">
          Insert all missing pieces
        </Button>
      </Section>
    </Inspector>
  );
}
