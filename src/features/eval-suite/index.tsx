import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  EVAL_CASES,
  EVALUATOR_TONE,
  MODELS,
  SUITE_LABEL,
  SUITE_TONE,
  SUITES,
  buildResults,
  caseById,
  type ModelId,
  type Suite,
} from './helpers';

type SortKey = 'id' | 'suite';

export function EvalSuiteOverlay() {
  const open = useUiStore((s) => s.overlays.evalSuite.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [suiteFilter, setSuiteFilter] = useState<Suite | 'all'>('all');
  const [activeModels, setActiveModels] = useState<ReadonlyArray<ModelId>>([
    'opus',
    'sonnet',
    'haiku',
  ]);
  const [failsOnly, setFailsOnly] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('fq-1');
  const [selectedModel, setSelectedModel] = useState<ModelId>('opus');
  const [sortKey, setSortKey] = useState<SortKey>('id');

  const allResults = useMemo(() => buildResults(), []);

  const visible = useMemo(() => {
    let list = [...EVAL_CASES];
    if (suiteFilter !== 'all') list = list.filter((c) => c.suite === suiteFilter);
    if (failsOnly) {
      list = list.filter((c) =>
        activeModels.some((m) => allResults[m][c.id]?.pass === false),
      );
    }
    if (sortKey === 'suite') {
      list.sort((a, b) => a.suite.localeCompare(b.suite));
    } else {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }
    return list;
  }, [suiteFilter, failsOnly, activeModels, allResults, sortKey]);

  const toggleModel = (m: ModelId) =>
    setActiveModels((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const selectedCase = caseById(selectedCaseId);
  const selectedResult =
    allResults[selectedModel][selectedCaseId] ?? allResults['opus'][selectedCaseId];

  const stats = useMemo(() => {
    const out: Record<ModelId, { pass: number; total: number; latency: number; cost: number }> = {
      opus: { pass: 0, total: 0, latency: 0, cost: 0 },
      sonnet: { pass: 0, total: 0, latency: 0, cost: 0 },
      haiku: { pass: 0, total: 0, latency: 0, cost: 0 },
    };
    for (const m of MODELS) {
      for (const c of EVAL_CASES) {
        const r = allResults[m][c.id];
        if (!r) continue;
        out[m].total++;
        if (r.pass) out[m].pass++;
        out[m].latency += r.latencyMs;
        out[m].cost += r.costUsd;
      }
    }
    return out;
  }, [allResults]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('evalSuite')}
      title="Eval Suite"
      subtitle={`${EVAL_CASES.length} cases · ${SUITES.length} suites · 3 models`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-end gap-1.5 text-xs">
          <Button size="xs" tone="default" onClick={() => toast('All evals queued (mock)')}>
            Run all
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Report generated (mock)')}>
            Generate report
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Comparing to baseline (mock)')}
          >
            Compare to baseline
          </Button>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">suite:</span>
            <ToggleChip
              active={suiteFilter === 'all'}
              onClick={() => setSuiteFilter('all')}
            >
              all
            </ToggleChip>
            {SUITES.map((s) => (
              <ToggleChip
                key={s}
                active={suiteFilter === s}
                onClick={() => setSuiteFilter(s)}
              >
                {SUITE_LABEL[s]}
              </ToggleChip>
            ))}
            <span className="mx-1 h-3 w-px bg-line" />
            <span className="text-ink-3">models:</span>
            {MODELS.map((m) => (
              <ToggleChip
                key={m}
                active={activeModels.includes(m)}
                onClick={() => toggleModel(m)}
              >
                {m}
              </ToggleChip>
            ))}
            <span className="mx-1 h-3 w-px bg-line" />
            <ToggleChip active={failsOnly} onClick={() => setFailsOnly(!failsOnly)}>
              fails only
            </ToggleChip>
          </PanelHeader>
          <ScrollArea className="max-h-[55vh]">
            <div className="p-2">
              <table className="w-full border-separate border-spacing-0 text-[11px]">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th
                      className="hairline-b sticky top-0 z-10 cursor-pointer bg-bg-subtle px-2 py-1 font-normal hover:text-ink-1"
                      onClick={() => setSortKey('id')}
                    >
                      case
                    </th>
                    <th
                      className="hairline-b sticky top-0 z-10 cursor-pointer bg-bg-subtle px-2 py-1 font-normal hover:text-ink-1"
                      onClick={() => setSortKey('suite')}
                    >
                      suite
                    </th>
                    <th className="hairline-b sticky top-0 z-10 bg-bg-subtle px-2 py-1 font-normal">
                      eval
                    </th>
                    {activeModels.map((m) => (
                      <th
                        key={m}
                        className="hairline-b sticky top-0 z-10 bg-bg-subtle px-2 py-1 font-normal"
                      >
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.id}>
                      <td className="hairline-b px-2 py-1 font-mono text-ink-1">
                        {c.id}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <Chip tone={SUITE_TONE[c.suite]} size="xs">
                          {SUITE_LABEL[c.suite]}
                        </Chip>
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <Chip tone={EVALUATOR_TONE[c.evaluator]} size="xs">
                          {c.evaluator}
                        </Chip>
                      </td>
                      {activeModels.map((m) => {
                        const r = allResults[m][c.id];
                        if (!r) return <td key={m} className="hairline-b px-2 py-1" />;
                        const isSel =
                          selectedCaseId === c.id && selectedModel === m;
                        return (
                          <td
                            key={m}
                            className={cn(
                              'hairline-b cursor-pointer px-2 py-1 hover:bg-bg-hover',
                              isSel && 'bg-accent-soft/40',
                            )}
                            onClick={() => {
                              setSelectedCaseId(c.id);
                              setSelectedModel(m);
                            }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <Chip tone={r.pass ? 'info' : 'err'} size="xs">
                                {r.pass ? 'pass' : 'fail'}
                              </Chip>
                              <span className="font-mono text-[10px] text-ink-3">
                                {r.latencyMs}ms
                              </span>
                              {r.hallucinated ? (
                                <Chip tone="warn" size="xs">
                                  hallu
                                </Chip>
                              ) : null}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          <div className="hairline-t bg-bg-subtle/40 p-3">
            <div className="text-caps text-ink-3">Aggregate stats</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {MODELS.map((m) => {
                const s = stats[m];
                const pct = s.total === 0 ? 0 : (s.pass / s.total) * 100;
                const avg = s.total === 0 ? 0 : s.latency / s.total;
                return (
                  <div
                    key={m}
                    className="rounded-sm border border-line bg-bg p-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-ink-1">{m}</span>
                      <Chip tone="info" size="xs">
                        {pct.toFixed(0)}% pass
                      </Chip>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-ink-3">
                      <span>avg {Math.round(avg)}ms</span>
                      <span>${s.cost.toFixed(3)} total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="w-[320px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Selected case</div>
            <div className="mt-1 font-mono text-md text-ink-1">
              {selectedCase.id}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Chip tone={SUITE_TONE[selectedCase.suite]} size="xs">
                {SUITE_LABEL[selectedCase.suite]}
              </Chip>
              <Chip tone={EVALUATOR_TONE[selectedCase.evaluator]} size="xs">
                {selectedCase.evaluator}
              </Chip>
              <Chip tone="muted" size="xs">
                {selectedModel}
              </Chip>
              {selectedResult ? (
                <Chip tone={selectedResult.pass ? 'info' : 'err'} size="xs">
                  {selectedResult.pass ? 'pass' : 'fail'}
                </Chip>
              ) : null}
              {selectedResult?.hallucinated ? (
                <Chip tone="warn" size="xs">
                  hallucination
                </Chip>
              ) : null}
            </div>

            <h4 className="text-caps mt-3 text-ink-3">Prompt</h4>
            <div className="mt-1">
              <CodeBlock
                code={selectedCase.prompt}
                language="text"
                showLineNumbers={false}
                maxHeight={80}
              />
            </div>

            <h4 className="text-caps mt-3 text-ink-3">Expected vs actual</h4>
            <div className="mt-1 grid grid-cols-1 gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  expected
                </div>
                <div className="mt-1 rounded-sm border border-line bg-bg p-1.5 font-mono text-[10px] text-ink-1">
                  {selectedCase.expectedOutput}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  actual
                </div>
                <div className="mt-1 rounded-sm border border-line bg-bg p-1.5 font-mono text-[10px] text-ink-1 whitespace-pre-wrap">
                  {selectedResult?.actual ?? '—'}
                </div>
              </div>
            </div>

            {selectedResult?.judgeNote ? (
              <div className="mt-2 rounded-sm border border-line bg-bg p-2 text-[11px] text-ink-2">
                <span className="text-ink-3">judge: </span>
                {selectedResult.judgeNote}
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Button
                size="xs"
                tone="default"
                onClick={() => toast(`Re-running ${selectedCase.id} (mock)`)}
              >
                Re-run
              </Button>
              <Button
                size="xs"
                tone="ghost"
                onClick={() => toast(`Marked ${selectedCase.id} as flake (mock)`)}
              >
                Mark flake
              </Button>
              <Button
                size="xs"
                tone="ghost"
                className="col-span-2"
                onClick={() =>
                  toast(`${selectedCase.id} added to regression set (mock)`)
                }
              >
                Add to regression set
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
