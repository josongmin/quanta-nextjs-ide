import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  CodeBlock,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  dependencyOrder,
  generateRows,
  LOCALE_OPTIONS,
  seedModels,
  STRATEGY_OPTIONS,
  type SeedModel,
  type SeedStrategy,
} from './helpers';

type FkMode = 'link' | 'auto';

export function SeedBuilderOverlay() {
  const open = useUiStore((s) => s.overlays.seedBuilder.open);
  const requested = useUiStore((s) => s.overlays.seedBuilder.modelId);
  const close = useUiStore((s) => s.closeOverlay);

  const [rowCounts, setRowCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(seedModels.map((m) => [m.id, m.defaultRows])),
  );
  const [selectedId, setSelectedId] = useState<string>(seedModels[0]?.id ?? '');
  const [strategies, setStrategies] = useState<Record<string, Record<string, SeedStrategy>>>({});
  const [locale, setLocale] = useState<string>('en-US');
  const [seedNum, setSeedNum] = useState<number>(42);
  const [fkMode, setFkMode] = useState<FkMode>('link');

  useEffect(() => {
    if (!open) return;
    if (requested && seedModels.some((m) => m.id === requested)) {
      setSelectedId(requested);
    }
  }, [open, requested]);

  const selected = useMemo(
    () => seedModels.find((m) => m.id === selectedId) ?? null,
    [selectedId],
  );

  // Build refs: ids per model based on rowCounts
  const refs = useMemo<Record<string, ReadonlyArray<string>>>(() => {
    const out: Record<string, string[]> = {};
    for (const m of seedModels) {
      const count = rowCounts[m.id] ?? m.defaultRows;
      const arr: string[] = [];
      for (let i = 0; i < Math.min(count, 50); i += 1) {
        arr.push(`uuid-${m.id.toLowerCase()}-${i.toString().padStart(4, '0')}`);
      }
      out[m.id] = arr;
    }
    return out;
  }, [rowCounts]);

  const previewRows = useMemo(() => {
    if (!selected) return [];
    const fieldStrats = strategies[selected.id] ?? {};
    return generateRows(selected, 10, fieldStrats, locale, seedNum, refs);
  }, [selected, strategies, locale, seedNum, refs]);

  const order = useMemo(() => dependencyOrder(), []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('seedBuilder')}
      title="Seed Builder"
      subtitle="Realistic mock data generators per model"
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Seed file generated (mock)')}>
            Generate file (mock)
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Inserted into mock store (mock)')}>
            Insert into mock store (mock)
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[200px_1fr_240px]">
        <div className="hairline-r bg-bg-subtle/50">
          <div className="px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">models</div>
          <ul>
            {seedModels.map((m) => {
              const isSel = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedId(m.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover',
                      isSel && 'bg-bg-selected',
                    )}
                  >
                    <span className="font-mono text-ink-1">{m.name}</span>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={rowCounts[m.id] ?? 0}
                      onChange={(e) =>
                        setRowCounts((c) => ({
                          ...c,
                          [m.id]: Math.max(0, Math.min(9999, Number(e.target.value) || 0)),
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-14 rounded-sm border border-line bg-bg px-1 text-right font-mono text-[10px]"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-bg p-3">
          {!selected ? null : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-ink-1">{selected.name}</span>
                <Chip tone="muted" size="xs">
                  {rowCounts[selected.id] ?? selected.defaultRows} rows
                </Chip>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-3">
                  <label className="flex items-center gap-1">
                    locale
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className="h-5 rounded-sm border border-line bg-bg px-1 text-[10px]"
                    >
                      {LOCALE_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1">
                    seed
                    <input
                      type="number"
                      value={seedNum}
                      onChange={(e) => setSeedNum(Number(e.target.value) || 0)}
                      className="h-5 w-14 rounded-sm border border-line bg-bg px-1 text-[10px]"
                    />
                  </label>
                </span>
              </div>

              <div className="mb-3">
                <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">field strategies</div>
                <ScrollArea className="max-h-[180px] rounded-sm border border-line">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
                      <tr>
                        <th className="px-2 py-1 text-left">field</th>
                        <th className="px-2 py-1 text-left">strategy</th>
                        <th className="px-2 py-1 text-left">notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.fields.map((f) => {
                        const current =
                          strategies[selected.id]?.[f.name] ?? f.defaultStrategy;
                        return (
                          <tr key={f.name} className="border-t border-line/60">
                            <td className="px-2 py-1 font-mono text-ink-1">{f.name}</td>
                            <td className="px-2 py-1">
                              <select
                                value={current}
                                onChange={(e) =>
                                  setStrategies((s) => ({
                                    ...s,
                                    [selected.id]: {
                                      ...(s[selected.id] ?? {}),
                                      [f.name]: e.target.value as SeedStrategy,
                                    },
                                  }))
                                }
                                className="h-5 w-full rounded-sm border border-line bg-bg px-1 text-[10px]"
                              >
                                {STRATEGY_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1 text-[10px] text-ink-3">
                              {f.fkModel ? `→ ${f.fkModel}` : ''}
                              {f.intMin != null ? ` [${f.intMin}…${f.intMax}]` : ''}
                              {f.enumValues ? f.enumValues.join(' | ') : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>

              <div>
                <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                  preview · first 10 rows
                </div>
                <CodeBlock
                  code={JSON.stringify(previewRows, null, 2)}
                  language="json"
                  maxHeight={260}
                  showLineNumbers={false}
                />
              </div>
            </>
          )}
        </div>

        <div className="hairline-l bg-bg-subtle/40 p-3 text-xs">
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">FK strategy</div>
          <div className="mb-3 flex flex-col gap-1">
            <button
              onClick={() => setFkMode('link')}
              className={cn(
                'rounded-sm border px-2 py-1 text-left',
                fkMode === 'link'
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2',
              )}
            >
              <div className="font-medium">Link to existing</div>
              <div className="text-[10px] text-ink-3">Pick from generated parent rows</div>
            </button>
            <button
              onClick={() => setFkMode('auto')}
              className={cn(
                'rounded-sm border px-2 py-1 text-left',
                fkMode === 'auto'
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2',
              )}
            >
              <div className="font-medium">Auto generate</div>
              <div className="text-[10px] text-ink-3">Generate parent on demand</div>
            </button>
          </div>

          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">dependency order</div>
          <DependencyGraph order={order} selectedId={selectedId} />
        </div>
      </div>
    </OverlayPanel>
  );
}

function DependencyGraph({
  order,
  selectedId,
}: {
  order: ReadonlyArray<SeedModel>;
  selectedId: string;
}) {
  const W = 200;
  const H = order.length * 36 + 12;
  return (
    <div className="rounded-sm border border-line bg-bg">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="dependency order">
        {order.map((m, i) => {
          const y = 16 + i * 36;
          const isSel = m.id === selectedId;
          return (
            <g key={m.id}>
              {i > 0 ? (
                <line
                  x1={W / 2}
                  y1={y - 18}
                  x2={W / 2}
                  y2={y - 8}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  markerEnd="url(#dgArrow)"
                />
              ) : null}
              <rect
                x={W / 2 - 70}
                y={y - 8}
                width={140}
                height={20}
                rx={4}
                fill={isSel ? '#dbeafe' : '#f8fafc'}
                stroke={isSel ? '#2563eb' : '#cbd5e1'}
              />
              <text
                x={W / 2}
                y={y + 5}
                fontSize="11"
                textAnchor="middle"
                fill={isSel ? '#1e3a8a' : '#334155'}
                fontFamily="ui-monospace, monospace"
              >
                {i + 1}. {m.name}
              </text>
              {m.dependsOn.length > 0 ? (
                <text
                  x={W / 2}
                  y={y + 18}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                >
                  → {m.dependsOn.join(', ')}
                </text>
              ) : null}
            </g>
          );
        })}
        <defs>
          <marker id="dgArrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
