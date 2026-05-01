import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  EmptyState,
  Icon,
  OverlayPanel,
  ScrollArea,
  Tooltip,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  ACTIONS,
  MIDDLEWARES,
  actionById,
  aggregateFailureModes,
  compileOutput,
  detectConflicts,
  middlewareById,
  recommendedOrder,
  riskChipTone,
  totalLatency,
} from './helpers';

export function ActionMiddlewareComposerOverlay() {
  const open = useUiStore((s) => s.overlays.actionMiddlewareComposer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [actionId, setActionId] = useState<string>('createOrder');
  const [pipeline, setPipeline] = useState<ReadonlyArray<string>>([
    'requireAuth',
    'rateLimit',
    'validate',
    'logging',
  ]);

  const action = actionById(actionId);
  const conflicts = useMemo(() => detectConflicts(pipeline), [pipeline]);
  const compiled = useMemo(
    () => compileOutput(actionId, pipeline),
    [actionId, pipeline],
  );
  const latency = totalLatency(pipeline);
  const failureModes = useMemo(() => aggregateFailureModes(pipeline), [pipeline]);

  const inPipeline = (id: string): boolean => pipeline.includes(id);

  function add(id: string): void {
    if (inPipeline(id)) {
      toast(`${id} already in pipeline`);
      return;
    }
    setPipeline((p) => [...p, id]);
  }
  function remove(id: string): void {
    setPipeline((p) => p.filter((x) => x !== id));
  }
  function move(id: string, dir: -1 | 1): void {
    setPipeline((p) => {
      const i = p.indexOf(id);
      if (i < 0) return p;
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      const cur = next[i];
      const swap = next[j];
      if (cur === undefined || swap === undefined) return p;
      next[i] = swap;
      next[j] = cur;
      return next;
    });
  }
  function applyRecommended(): void {
    const recommended = recommendedOrder().filter((id) => pipeline.includes(id));
    setPipeline(recommended);
    toast.success('Recommended ordering applied');
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('actionMiddlewareComposer')}
      title="Server action middleware composer"
      subtitle="Stack auth, rate-limit, validation, audit on a server action"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">stack:</span>{' '}
              <span className="font-mono text-ink-1">{pipeline.length}</span>
            </span>
            <span>
              <span className="text-ink-2">latency:</span>{' '}
              <span className="font-mono text-ink-1">~{latency}ms</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Test cases generated (mock)')}
            >
              Generate test cases
            </Button>
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Composition saved (mock)')}
            >
              Save composition
            </Button>
            <Button
              size="xs"
              tone="accent"
              onClick={() =>
                toast.success(`${pipeline.length} middlewares applied to ${action.name} (mock)`)
              }
            >
              Apply to action
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <SelectControl<string>
          label="action"
          value={actionId}
          onChange={setActionId}
          options={ACTIONS.map((a) => ({ value: a.id, label: a.name }))}
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="font-mono text-[11px] text-ink-3">{action.file}</span>
        <span className="ml-auto text-[10px] uppercase tracking-caps text-ink-3">
          {action.inputType} → {action.returnType}
        </span>
      </PanelHeader>

      <div className="grid grid-cols-[300px_1fr_280px] divide-x divide-line">
        {/* Available */}
        <aside className="min-w-0 px-3 py-3">
          <h4 className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">
            Available middlewares
          </h4>
          <ScrollArea className="max-h-[460px]">
            <ul className="space-y-1">
              {MIDDLEWARES.map((m) => {
                const used = inPipeline(m.id);
                return (
                  <li
                    key={m.id}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm border border-line bg-bg px-2 py-1.5',
                      used && 'opacity-60',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => add(m.id)}
                      disabled={used}
                      className="flex flex-1 items-center gap-1.5 text-left disabled:cursor-not-allowed"
                    >
                      <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                        {m.name}
                      </span>
                      <Chip tone={riskChipTone(m.riskTier)} size="xs">
                        {m.riskTier}
                      </Chip>
                    </button>
                    <Tooltip
                      content={
                        <div className="space-y-1">
                          <div className="font-medium text-ink-1">{m.name}</div>
                          <div className="text-ink-2">{m.description}</div>
                          <div className="text-ink-3">
                            ~{m.latencyMs}ms · {m.blocking ? 'blocking' : 'non-blocking'} ·{' '}
                            {m.requiresContext ? 'needs ctx' : 'no ctx'}
                          </div>
                        </div>
                      }
                    >
                      <span className="text-ink-3 hover:text-ink-1">
                        <Icon.Info className="h-3 w-3" />
                      </span>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </aside>

        {/* Pipeline + compiled */}
        <main className="min-w-0 px-3 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] uppercase tracking-caps text-ink-3">
              Composed pipeline
            </h4>
            <span className="text-[10px] text-ink-3">
              top → bottom = outer → inner wrap
            </span>
          </div>

          {pipeline.length === 0 ? (
            <EmptyState
              title="No middlewares yet"
              description="Click an entry on the left to add it to the pipeline."
              className="mt-2"
            />
          ) : (
            <ol className="mt-2 space-y-1.5">
              {pipeline.map((id, i) => {
                const m = middlewareById(id);
                return (
                  <li
                    key={id}
                    className="relative flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1.5"
                  >
                    {i < pipeline.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute left-3 top-full z-0 h-1.5 w-px bg-line"
                      />
                    ) : null}
                    <span className="font-mono text-[10px] text-ink-3">
                      #{i + 1}
                    </span>
                    <span className="flex-1 truncate font-mono text-[12px] text-ink-1">
                      {m.name}
                    </span>
                    <Chip tone="muted" size="xs">
                      ~{m.latencyMs}ms
                    </Chip>
                    {m.blocking ? (
                      <Chip tone="warn" size="xs">
                        block
                      </Chip>
                    ) : (
                      <Chip tone="info" size="xs">
                        async
                      </Chip>
                    )}
                    <button
                      type="button"
                      onClick={() => move(id, -1)}
                      disabled={i === 0}
                      className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1 disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <Icon.Up className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(id, 1)}
                      disabled={i === pipeline.length - 1}
                      className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1 disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <Icon.Down className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      className="rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-sev-err"
                      aria-label="Remove"
                    >
                      <Icon.X className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              Compiled output
            </div>
            <CodeBlock code={compiled} language="ts" maxHeight={240} />
          </div>
        </main>

        {/* Analysis */}
        <aside className="min-w-0 px-3 py-3">
          <h4 className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">
            Pipeline analysis
          </h4>

          <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-ink-3">Latency budget</span>
              <span className="font-mono text-ink-1">~{latency}ms</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              Conflicts
            </div>
            {conflicts.length === 0 ? (
              <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1.5 text-[11px] text-ink-3">
                None — ordering looks healthy.
              </div>
            ) : (
              <ul className="space-y-1 text-[11px]">
                {conflicts.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      'rounded-sm px-2 py-1.5',
                      c.severity === 'err'
                        ? 'bg-sev-err-soft text-sev-err'
                        : 'bg-sev-warn-soft text-sev-warn',
                    )}
                  >
                    {c.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              Failure modes
            </div>
            {failureModes.length === 0 ? (
              <div className="text-[11px] text-ink-3">No failure modes recorded.</div>
            ) : (
              <ScrollArea className="max-h-32">
                <ul className="space-y-1 text-[11px]">
                  {failureModes.map((f) => (
                    <li key={f.id} className="flex items-start gap-1.5">
                      <Chip tone="muted" size="xs">
                        {f.from}
                      </Chip>
                      <span className="flex-1 text-ink-2">{f.message}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          <div className="mt-3">
            <Button
              size="xs"
              tone="default"
              onClick={applyRecommended}
              className="w-full justify-center"
            >
              Apply recommended ordering
            </Button>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
