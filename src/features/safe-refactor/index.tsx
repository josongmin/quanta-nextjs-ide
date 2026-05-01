/**
 * Safe Refactor wizard.
 *
 * Step 1 — Pick operation (rename / move / extract) + fill the form.
 * Step 2 — Review the generated `RefactorPlan` (steps, affected, risks).
 * Step 3 — Run admission gate; show verdict; allow proceed/abort.
 * Step 4 — Execute via the executor (LSP + workspace fs); show result.
 *
 * Tabs at the top: "Wizard" + "Suggestions" (AI-generated candidates).
 */

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { runFullAdmission } from '@shared/admission';
import { hasApiKey, runAgent, type AssistantMessage } from '@shared/ai';
import {
  Button,
  Chip,
  OverlayPanel,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { executePlan } from './executor';
import { planRefactor } from './planner';
import { useSafeRefactorStore } from './store';
import type {
  ExtractOperation,
  MoveOperation,
  RefactorOperation,
  RefactorOperationKind,
  RefactorPlan,
  RenameOperation,
  WizardStep,
} from './types';

const STEPS: ReadonlyArray<{ id: WizardStep; label: string }> = [
  { id: 'pick-op', label: '1. Pick' },
  { id: 'review-plan', label: '2. Plan' },
  { id: 'admission', label: '3. Verdict' },
  { id: 'execute', label: '4. Execute' },
];

export function SafeRefactorOverlay() {
  const open = useUiStore((s) => s.overlays.safeRefactor.open);
  const close = useUiStore((s) => s.closeOverlay);

  const step = useSafeRefactorStore((s) => s.step);
  const plan = useSafeRefactorStore((s) => s.plan);
  const verdict = useSafeRefactorStore((s) => s.verdict);
  const executing = useSafeRefactorStore((s) => s.executing);
  const result = useSafeRefactorStore((s) => s.result);
  const setStep = useSafeRefactorStore((s) => s.setStep);
  const setPlan = useSafeRefactorStore((s) => s.setPlan);
  const setVerdict = useSafeRefactorStore((s) => s.setVerdict);
  const setExecuting = useSafeRefactorStore((s) => s.setExecuting);
  const setResult = useSafeRefactorStore((s) => s.setResult);
  const reset = useSafeRefactorStore((s) => s.reset);

  const [tab, setTab] = useState<'wizard' | 'suggestions'>('wizard');

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('safeRefactor'))}
      title="Safe Refactor"
      subtitle="Plan → admission → execute, with risks & required tests"
      size="xl"
      footer={
        <>
          <Button size="sm" tone="ghost" onClick={() => { reset(); close('safeRefactor'); }}>
            Close
          </Button>
        </>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="border-b border-line px-4 pt-3">
          <TabsList>
            <TabsTrigger value="wizard">Wizard</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="wizard">
          <Stepper step={step} />
          <div className="px-4 py-3">
            {step === 'pick-op' && (
              <PickOpStep
                onPlan={async (op) => {
                  const next = await planRefactor(op);
                  setPlan(next);
                  setStep('review-plan');
                }}
              />
            )}
            {step === 'review-plan' && plan && (
              <ReviewPlanStep
                plan={plan}
                onBack={() => setStep('pick-op')}
                onAdmit={async () => {
                  const { verdict: v } = await runFullAdmission({
                    kind: 'patch',
                    files: plan.affectedFiles,
                    diff: plan.diff,
                  });
                  setVerdict(v);
                  setStep('admission');
                }}
              />
            )}
            {step === 'admission' && verdict && (
              <AdmissionStep
                verdict={verdict}
                onBack={() => setStep('review-plan')}
                onProceed={async () => {
                  if (!plan) return;
                  setStep('execute');
                  setExecuting(true);
                  try {
                    const r = await executePlan(plan);
                    setResult(r);
                    if (r.ok) toast.success('Refactor applied');
                    else toast.error('Refactor failed', { description: r.errors[0] });
                  } finally {
                    setExecuting(false);
                  }
                }}
              />
            )}
            {step === 'execute' && (
              <ExecuteStep
                executing={executing}
                result={result}
                onRestart={() => reset()}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions">
          <SuggestionsTab />
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}

function Stepper({ step }: { step: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-2 border-b border-line bg-bg-subtle px-4 py-2">
      {STEPS.map((s, i) => {
        const active = s.id === step;
        const done = i < idx;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                active && 'bg-accent text-bg',
                done && 'bg-accent-soft text-accent',
                !active && !done && 'bg-bg text-ink-3 ring-1 ring-line',
              )}
            >
              {i + 1}
            </div>
            <span className={cn('text-[12px]', active ? 'text-ink-1' : 'text-ink-3')}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn('h-px w-6', done ? 'bg-accent' : 'bg-line')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PickOpStep({ onPlan }: { onPlan(op: RefactorOperation): Promise<void> }) {
  const [kind, setKind] = useState<RefactorOperationKind>('rename');

  const [rename, setRename] = useState<RenameOperation>({
    kind: 'rename',
    file: 'src/features/checkout/checkout.tsx',
    line: 138,
    column: 17,
    oldName: 'submitOrder',
    newName: 'placeOrder',
  });
  const [move, setMove] = useState<MoveOperation>({
    kind: 'move',
    fromFile: 'src/features/checkout/charge.ts',
    toFile: 'src/features/billing/charge.ts',
  });
  const [extract, setExtract] = useState<ExtractOperation>({
    kind: 'extract',
    file: 'src/features/checkout/checkout.tsx',
    startLine: 50,
    endLine: 110,
    newName: 'CheckoutSummary',
    target: 'new-file',
    newFile: 'src/features/checkout/checkout-summary.tsx',
  });

  const submit = async () => {
    if (kind === 'rename') return onPlan(rename);
    if (kind === 'move') return onPlan(move);
    return onPlan(extract);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['rename', 'move', 'extract'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-[12px] capitalize',
              kind === k
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line/60 text-ink-2 hover:bg-bg-subtle',
            )}
          >
            {k}
          </button>
        ))}
      </div>

      {kind === 'rename' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="File" value={rename.file} onChange={(v) => setRename({ ...rename, file: v })} />
          <Field label="Old name" value={rename.oldName} onChange={(v) => setRename({ ...rename, oldName: v })} />
          <Field label="New name" value={rename.newName} onChange={(v) => setRename({ ...rename, newName: v })} />
          <Field
            label="Line"
            value={String(rename.line)}
            onChange={(v) => setRename({ ...rename, line: Number(v) || 1 })}
          />
        </div>
      )}
      {kind === 'move' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="From file" value={move.fromFile} onChange={(v) => setMove({ ...move, fromFile: v })} />
          <Field label="To file" value={move.toFile} onChange={(v) => setMove({ ...move, toFile: v })} />
          <Field
            label="Symbol (optional)"
            value={move.symbol ?? ''}
            onChange={(v) => setMove({ ...move, symbol: v || undefined })}
          />
        </div>
      )}
      {kind === 'extract' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="File" value={extract.file} onChange={(v) => setExtract({ ...extract, file: v })} />
          <Field label="New name" value={extract.newName} onChange={(v) => setExtract({ ...extract, newName: v })} />
          <Field
            label="Start line"
            value={String(extract.startLine)}
            onChange={(v) => setExtract({ ...extract, startLine: Number(v) || 1 })}
          />
          <Field
            label="End line"
            value={String(extract.endLine)}
            onChange={(v) => setExtract({ ...extract, endLine: Number(v) || 1 })}
          />
          <Field
            label="New file (if target=new-file)"
            value={extract.newFile ?? ''}
            onChange={(v) => setExtract({ ...extract, newFile: v || undefined })}
          />
        </div>
      )}

      <div className="pt-2">
        <Button size="md" tone="default" onClick={submit}>
          Plan refactor
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(v: string): void;
}) {
  return (
    <label className="block text-[12px]">
      <span className="mb-0.5 block text-ink-3">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line/60 bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function ReviewPlanStep({
  plan,
  onBack,
  onAdmit,
}: {
  plan: RefactorPlan;
  onBack(): void;
  onAdmit(): Promise<void>;
}) {
  const [admitting, setAdmitting] = useState(false);
  return (
    <div className="grid grid-cols-2 gap-4">
      <section>
        <header className="text-caps mb-1 text-ink-3">Steps</header>
        <ol className="space-y-1 text-[12px]">
          {plan.steps.map((s, i) => (
            <li key={s.id} className="flex gap-2">
              <span className="text-ink-3">{i + 1}.</span>
              <span className="flex-1">
                <span className="text-ink-1">{s.description}</span>
                {s.file && <span className="block font-mono text-[11px] text-ink-3">{s.file}</span>}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="space-y-3">
        <div>
          <header className="text-caps mb-1 text-ink-3">Affected files</header>
          <ul className="space-y-0.5 font-mono text-[11px]">
            {plan.affectedFiles.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <div>
          <header className="text-caps mb-1 text-ink-3">Risks</header>
          {plan.risks.length === 0 ? (
            <span className="text-[11px] text-ink-3">No flagged risks.</span>
          ) : (
            <ul className="space-y-1 text-[12px]">
              {plan.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Chip
                    size="xs"
                    tone={r.level === 'high' ? 'err' : r.level === 'medium' ? 'warn' : 'info'}
                  >
                    {r.level}
                  </Chip>
                  <span className="text-ink-2">{r.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <header className="text-caps mb-1 text-ink-3">Required tests</header>
          <ul className="list-disc pl-5 text-[12px] text-ink-2">
            {plan.requiredTests.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </section>
      <div className="col-span-2 flex gap-2 pt-2">
        <Button size="sm" tone="ghost" onClick={onBack}>Back</Button>
        <Button
          size="md"
          tone="default"
          onClick={async () => {
            setAdmitting(true);
            try { await onAdmit(); } finally { setAdmitting(false); }
          }}
        >
          {admitting ? 'Running admission…' : 'Run admission gate'}
        </Button>
      </div>
    </div>
  );
}

function AdmissionStep({
  verdict,
  onBack,
  onProceed,
}: {
  verdict: NonNullable<ReturnType<typeof useSafeRefactorStore.getState>['verdict']>;
  onBack(): void;
  onProceed(): Promise<void>;
}) {
  const tone =
    verdict.decision === 'reject' ? 'err' : verdict.decision === 'review' ? 'warn' : 'info';
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Chip size="sm" tone={tone}>{verdict.decision}</Chip>
        <span className="text-[12px] text-ink-2">score {verdict.score}</span>
      </div>
      <div>
        <header className="text-caps mb-1 text-ink-3">Reasons</header>
        {verdict.reasons.length === 0 ? (
          <span className="text-[11px] text-ink-3">No reasons cited.</span>
        ) : (
          <ul className="list-disc pl-5 text-[12px] text-ink-2">
            {verdict.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </div>
      <div>
        <header className="text-caps mb-1 text-ink-3">Required obligations</header>
        {verdict.required.length === 0 ? (
          <span className="text-[11px] text-ink-3">None.</span>
        ) : (
          <ul className="space-y-1 text-[12px]">
            {verdict.required.map((o) => (
              <li key={o.id} className="flex items-start gap-2">
                <Chip size="xs" tone="warn">{o.kind}</Chip>
                <span className="text-ink-2">{o.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" tone="ghost" onClick={onBack}>Back</Button>
        <Button
          size="md"
          tone="default"
          onClick={onProceed}
          disabled={verdict.decision === 'reject'}
        >
          Execute refactor
        </Button>
      </div>
    </div>
  );
}

function ExecuteStep({
  executing,
  result,
  onRestart,
}: {
  executing: boolean;
  result: ReturnType<typeof useSafeRefactorStore.getState>['result'];
  onRestart(): void;
}) {
  return (
    <div className="space-y-3">
      {executing && <span className="text-[12px] text-ink-3">Applying refactor…</span>}
      {result && (
        <>
          <div className="flex items-center gap-2">
            <Chip size="sm" tone={result.ok ? 'info' : 'err'}>
              {result.ok ? 'applied' : 'failed'}
            </Chip>
          </div>
          <div>
            <header className="text-caps mb-1 text-ink-3">Applied</header>
            <ul className="font-mono text-[11px] text-ink-1">
              {result.applied.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
          {result.errors.length > 0 && (
            <div>
              <header className="text-caps mb-1 text-ink-3">Errors</header>
              <ul className="font-mono text-[11px] text-sev-err">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
      <div className="pt-2">
        <Button size="sm" tone="default" onClick={onRestart}>Start over</Button>
      </div>
    </div>
  );
}

interface SuggestionItem {
  id: string;
  title: string;
  rationale: string;
  operation: RefactorOperation;
}

const SAMPLE_SUGGESTIONS: ReadonlyArray<SuggestionItem> = [
  {
    id: 'sx-1',
    title: 'Extract checkout summary into a server component',
    rationale: 'CheckoutPage has a 60-line summary block with no client state — extract & make it RSC.',
    operation: {
      kind: 'extract',
      file: 'src/features/checkout/checkout.tsx',
      startLine: 50,
      endLine: 110,
      newName: 'CheckoutSummary',
      target: 'new-file',
      newFile: 'src/features/checkout/checkout-summary.tsx',
    },
  },
  {
    id: 'sx-2',
    title: 'Split <ProductPage> client component',
    rationale: 'Page is 320 lines and only the price widget needs interactivity — split.',
    operation: {
      kind: 'extract',
      file: 'src/features/product/product-page.tsx',
      startLine: 220,
      endLine: 305,
      newName: 'PriceWidget',
      target: 'new-file',
      newFile: 'src/features/product/price-widget.tsx',
    },
  },
];

function SuggestionsTab() {
  const setPlan = useSafeRefactorStore((s) => s.setPlan);
  const setStep = useSafeRefactorStore((s) => s.setStep);
  const reset = useSafeRefactorStore((s) => s.reset);

  const [aiItems, setAiItems] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const items = useMemo<ReadonlyArray<SuggestionItem>>(
    () => [...aiItems, ...SAMPLE_SUGGESTIONS],
    [aiItems],
  );

  useEffect(() => {
    setAiItems([]);
  }, []);

  const requestAi = async () => {
    if (!hasApiKey()) {
      toast('Add an Anthropic API key in AI Settings to use AI suggestions.');
      return;
    }
    setLoading(true);
    try {
      const reply: AssistantMessage = await runAgent({
        userMessage:
          'Suggest two safe refactor candidates for the current Next.js workspace. Reply with a one-line summary per candidate, no code.',
        conversation: [],
        maxIterations: 1,
      });
      const summary = reply.text || '(no suggestions)';
      // We don't try to parse — the AI panel proper handles structured output.
      // Surface as a single annotation entry.
      setAiItems([
        {
          id: 'ai-summary',
          title: 'AI: refactor candidates',
          rationale: summary.slice(0, 200),
          operation: {
            kind: 'extract',
            file: 'src/features/checkout/checkout.tsx',
            startLine: 1,
            endLine: 30,
            newName: 'AiCandidate',
            target: 'same-file',
          },
        },
      ]);
    } catch (e) {
      toast.error('AI suggestion failed', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] text-ink-2">AI-generated refactor candidates.</span>
        <Button size="sm" tone="ghost" onClick={requestAi} disabled={loading}>
          {loading ? 'Asking AI…' : 'Refresh AI suggestions'}
        </Button>
      </div>
      <ScrollArea className="max-h-[440px]">
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-line/60 px-3 py-2 hover:border-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[12px] font-semibold text-ink-1">{s.title}</div>
                  <div className="text-[11px] text-ink-3">{s.rationale}</div>
                </div>
                <Button
                  size="sm"
                  tone="ghost"
                  onClick={async () => {
                    reset();
                    const plan = await planRefactor(s.operation);
                    setPlan(plan);
                    setStep('review-plan');
                    toast(`Loaded plan: ${s.title}`);
                  }}
                >
                  Load into wizard
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
