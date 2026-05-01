import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import {
  Send,
  Sparkles,
  TextCursorInput,
  Workflow,
  ShieldCheck,
} from 'lucide-react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  countIssues,
  findForm,
  forms,
  totalIssues,
  type FormStage,
  type FormStageKind,
} from './helpers';

const STAGE_ORDER: ReadonlyArray<FormStageKind> = [
  'field',
  'schema',
  'action',
  'response',
  'ui',
];

const STAGE_LABEL: Record<FormStageKind, string> = {
  field: 'Fields',
  schema: 'Schema',
  action: 'Action',
  response: 'Response',
  ui: 'UI',
};

function StageIcon({ kind, className }: { kind: FormStageKind; className?: string }) {
  const Cmp = match(kind)
    .with('field', () => TextCursorInput)
    .with('schema', () => ShieldCheck)
    .with('action', () => Workflow)
    .with('response', () => Send)
    .with('ui', () => Sparkles)
    .exhaustive();
  return <Cmp className={cn('h-3.5 w-3.5', className)} />;
}

function StageColumn({ stage }: { stage: FormStage }) {
  const hasWarnings = stage.warnings.length > 0;
  return (
    <div
      className={cn(
        'flex h-full min-h-[220px] flex-col rounded-sm border bg-bg p-2 text-xs',
        hasWarnings ? 'border-sev-warn/40' : 'border-line',
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-caps text-ink-3">
          <StageIcon kind={stage.kind} />
          {STAGE_LABEL[stage.kind]}
        </span>
        {hasWarnings ? (
          <Chip tone="warn" size="xs">
            {stage.warnings.length}
          </Chip>
        ) : (
          <Chip tone="static" size="xs">
            ok
          </Chip>
        )}
      </div>
      <div className="text-ink-1">{stage.label}</div>
      {stage.file ? (
        <div className="mt-1 truncate font-mono text-[10px] text-ink-3">
          {stage.file}
          {stage.line ? `:${stage.line}` : ''}
        </div>
      ) : null}
      {stage.shape ? (
        <div className="mt-2">
          <CodeBlock
            code={stage.shape}
            language="ts"
            showLineNumbers={false}
            maxHeight={120}
          />
        </div>
      ) : null}
      {hasWarnings ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {stage.warnings.map((w, i) => (
            <Chip
              key={i}
              tone={w.includes('drift') || w.includes('not mapped') ? 'err' : 'warn'}
              size="xs"
              className="whitespace-normal text-left leading-tight"
            >
              {w}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FormPipelineOverlay() {
  const open = useUiStore((s) => s.overlays.formPipeline.open);
  const requestedFormId = useUiStore((s) => s.overlays.formPipeline.formId);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const effective = activeFormId ?? requestedFormId ?? forms[0]?.id;
  const flow = useMemo(() => findForm(effective), [effective]);
  const issues = countIssues(flow);

  // Order stages canonically
  const orderedStages = useMemo(() => {
    const byKind = new Map<FormStageKind, FormStage>();
    for (const s of flow.stages) byKind.set(s.kind, s);
    return STAGE_ORDER.map((k) => byKind.get(k)).filter(
      (s): s is FormStage => s !== undefined,
    );
  }, [flow.stages]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('formPipeline'))}
      title="Form Pipeline"
      subtitle="fields → schema → action → response → UI"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Generate field-level error map (preview)')}
          >
            Generate field-level error map
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast(`Open ${flow.routePath}`)}
          >
            Open form
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Form</span>
        <select
          value={flow.id}
          onChange={(e) => setActiveFormId(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 font-mono text-[11px] text-ink-1"
        >
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <span className="font-mono text-[10px] text-ink-3">{flow.routePath}</span>
        <Chip
          tone={flow.progressiveEnhancement ? 'static' : 'warn'}
          size="xs"
          className="ml-2"
        >
          {flow.progressiveEnhancement ? 'progressive' : 'JS-only'}
        </Chip>
        <Chip tone={flow.errorMappingComplete ? 'static' : 'err'} size="xs">
          {flow.errorMappingComplete ? 'errors mapped' : 'errors unmapped'}
        </Chip>
        <span className="ml-auto text-[10px] text-ink-3">
          {forms.length} forms · {totalIssues()} issues · this form: {issues}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 p-3">
        {orderedStages.map((s, i) => (
          <div key={s.id} className="relative">
            <StageColumn stage={s} />
            {i < orderedStages.length - 1 ? (
              <div
                aria-hidden
                className="pointer-events-none absolute -right-1 top-[26px] z-10 text-ink-3"
              >
                →
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="hairline-t bg-bg-subtle px-3 py-2 text-[11px] text-ink-3">
        {issues === 0 ? (
          <span>No warnings. Pipeline is clean.</span>
        ) : (
          <span>
            <span className="font-mono text-ink-1">{issues}</span> warning
            {issues === 1 ? '' : 's'} across{' '}
            {orderedStages.filter((s) => s.warnings.length > 0).length} stages.
          </span>
        )}
      </div>
    </OverlayPanel>
  );
}
