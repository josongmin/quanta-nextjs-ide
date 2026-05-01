/**
 * Phase 6 — "Fix safely" (23-3 / 36-3).
 *
 * A small inline button (used in the hover footer) and a floating-action
 * counterpart (used wherever a diagnostic is selected). Both invoke the
 * Phase-4 AI agent with a structured prompt that bakes in the boundary +
 * cache invariants and the admission gate. Patches the agent emits are
 * routed through `runFullAdmission`; only `verdict.decision === 'admit'`
 * candidates are surfaced to the user as applicable.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useAgentStore } from '@shared/ai';
import {
  hasApiKey,
  runAgent,
  type ChatMessage,
  type PatchCandidate,
} from '@shared/ai';
import { runFullAdmission } from '@shared/admission';
import type { AdmissionVerdict, ChangeDescriptor } from '@entities/evidence';
import { Button, Icon, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { SymbolContext } from './types';

interface Props {
  /** Aggregated symbol context (used to seed the prompt). */
  context?: SymbolContext;
  /** Override label / disabled — useful for the floating variant. */
  variant?: 'inline' | 'floating';
  /** Optional explicit diagnostic to fix. */
  diagnosticId?: string;
}

export function FixSafelyButton({ context, variant = 'inline', diagnosticId }: Props) {
  const [busy, setBusy] = useState(false);
  const [lastVerdict, setLastVerdict] = useState<AdmissionVerdict | null>(null);

  const onClick = async () => {
    if (busy) return;
    if (!hasApiKey()) {
      toast.error('AI key required', {
        description: 'Configure an Anthropic API key in Settings → AI.',
      });
      return;
    }

    setBusy(true);
    setLastVerdict(null);
    try {
      const userMessage = buildPrompt(context, diagnosticId);
      const conversation: ChatMessage[] = [];

      const proposed: PatchCandidate[] = [];
      const result = await runAgent({
        userMessage,
        conversation,
        maxIterations: 6,
        hooks: {
          onPatch: (p) => proposed.push(p),
        },
      });

      if (proposed.length === 0 && result.patches.length === 0) {
        toast.message('No patch needed', {
          description: result.text.slice(0, 160) || 'Agent finished without proposing changes.',
        });
        return;
      }

      const candidates = proposed.length > 0 ? proposed : result.patches;
      // Run each candidate through admission. Only admit decisions are
      // counted as applicable. We never write to disk here — applying is a
      // separate, explicit user action via the existing patch-gate UI.
      const verdicts = await Promise.all(
        candidates.map(async (p) => {
          const change: ChangeDescriptor = {
            kind: 'patch',
            files: [p.filePath],
          };
          const { verdict } = await runFullAdmission(change);
          return { patch: p, verdict };
        }),
      );

      const admitted = verdicts.filter((v) => v.verdict.decision === 'admit');
      const blocked = verdicts.filter((v) => v.verdict.decision !== 'admit');

      if (admitted.length > 0) {
        setLastVerdict(admitted[0]?.verdict ?? null);
        toast.success(`Fix safely · ${admitted.length} candidate${admitted.length === 1 ? '' : 's'} ready`, {
          description: `Open AI panel to review and apply.`,
        });
      }
      if (blocked.length > 0) {
        setLastVerdict(blocked[0]?.verdict ?? null);
        toast.warning(`Fix safely · ${blocked.length} candidate${blocked.length === 1 ? '' : 's'} blocked`, {
          description:
            blocked[0]?.verdict.reasons.slice(0, 2).join('; ') ||
            'Admission gate did not admit. See AI panel for details.',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Fix safely failed', { description: msg });
    } finally {
      setBusy(false);
    }
  };

  const tooltip = lastVerdict
    ? `Last verdict: ${lastVerdict.decision} (${lastVerdict.score})`
    : 'Ask the agent for a patch and run it through the admission gate.';

  if (variant === 'floating') {
    return (
      <Tooltip content={tooltip} side="left">
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          aria-label="Fix safely"
          className={cn(
            'pointer-events-auto fixed bottom-6 right-6 z-50',
            'inline-flex items-center gap-2 rounded-full px-4 py-2',
            'bg-accent text-white shadow-pop',
            'transition-transform duration-200 ease-out hover:-translate-y-0.5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            'disabled:opacity-60',
          )}
        >
          {busy ? (
            <Icon.Refresh className="h-4 w-4 animate-spin" />
          ) : (
            <Icon.Bulb className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{busy ? 'Working…' : 'Fix safely'}</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={tooltip} side="top">
      <Button size="xs" tone="default" onClick={onClick} disabled={busy} aria-label="Fix safely">
        {busy ? (
          <Icon.Refresh className="h-3 w-3 animate-spin" />
        ) : (
          <Icon.Bulb className="h-3 w-3" />
        )}
        Fix safely
      </Button>
    </Tooltip>
  );
}

function buildPrompt(context: SymbolContext | undefined, diagnosticId?: string): string {
  const lines: string[] = [];
  lines.push(
    'You are the safe-fix agent. Propose a minimal patch that resolves the issue under the following constraints:',
    '- Boundaries: never move secrets to client components.',
    '- Cache: every mutation must pair with a revalidate / revalidateTag for affected tags.',
    '- Auth: preserve guards.',
    '- Submit ONLY patches that pass the admission gate.',
  );
  if (diagnosticId) {
    lines.push('', `Target diagnostic id: ${diagnosticId}`);
  }
  if (context) {
    lines.push(
      '',
      `Symbol: ${context.name} (${context.kind}) at ${context.file}:${context.line}`,
      `Boundary: ${context.boundary.surface} (${context.boundary.reason})`,
      `Routes touched: ${context.routes.map((r) => r.path).join(', ') || '(none)'}`,
      `Cache tags touched: ${context.cache.map((c) => c.tag).join(', ') || '(none)'}`,
      `Risks: ${context.risks.length}`,
    );
    if (context.risks.length > 0) {
      lines.push('Risks:');
      for (const r of context.risks.slice(0, 5)) {
        lines.push(`  - [${r.severity}] ${r.ruleId}: ${r.title} (${r.file}:${r.line})`);
      }
    }
  }
  lines.push(
    '',
    'Use read_file / grep tools as needed. Emit propose_patch only when you have',
    'a precise, minimal edit. Reply briefly with the rationale once done.',
  );
  return lines.join('\n');
}

/**
 * Floating action button — visible whenever a diagnostic is selected or
 * the agent has at least one in-flight patch candidate. Designed to live
 * in the editor area so it overlays the bottom-right of the workspace.
 */
export function FixSafelyFab() {
  const selected = useDiagnosticStore((s) => s.selectedDiagnosticIds);
  const patches = useAgentStore((s) => s.patches);
  const visible = selected.size > 0 || patches.length > 0;
  if (!visible) return null;
  // Use the first selected diagnostic id as the target. The FAB still
  // works without one if an open patch candidate is the trigger.
  const firstId = Array.from(selected)[0];
  return <FixSafelyButton variant="floating" {...(firstId ? { diagnosticId: firstId } : {})} />;
}
