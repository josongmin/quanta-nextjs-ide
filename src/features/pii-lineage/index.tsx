import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  BASIS_TONE,
  DESTINATIONS,
  PII_FIELDS,
  PROCESSORS,
  SOURCES,
  destLabel,
  piiById,
  processorById,
  processorLabel,
  type PiiId,
} from './helpers';

const GRAPH_W = 760;
const GRAPH_H = 320;
const COL_X = [110, 380, 660] as const;

function PiiGraph({ fieldId }: { fieldId: PiiId }) {
  const field = piiById(fieldId);
  const sourceY = (i: number, n: number) => 30 + (i + 0.5) * ((GRAPH_H - 60) / n);
  const procY = (i: number, n: number) => 30 + (i + 0.5) * ((GRAPH_H - 60) / n);
  const destY = (i: number, n: number) => 30 + (i + 0.5) * ((GRAPH_H - 60) / n);

  const visibleSources = SOURCES.filter((s) => field.sources.includes(s.id));
  const visibleProcessors = PROCESSORS.filter((p) => field.processors.includes(p.id));
  const visibleDests = DESTINATIONS.filter((d) => field.destinations.includes(d.id));

  return (
    <svg
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      className="w-full"
      role="img"
      aria-label={`PII lineage for ${field.label}`}
    >
      <text x={COL_X[0]} y={16} textAnchor="middle" className="fill-ink-3 text-[10px]">
        sources
      </text>
      <text x={COL_X[1]} y={16} textAnchor="middle" className="fill-ink-3 text-[10px]">
        processors
      </text>
      <text x={COL_X[2]} y={16} textAnchor="middle" className="fill-ink-3 text-[10px]">
        destinations
      </text>

      {/* edges source -> processor */}
      {visibleSources.map((s, i) =>
        visibleProcessors.map((p, j) => {
          const x1 = COL_X[0] + 60;
          const y1 = sourceY(i, visibleSources.length);
          const x2 = COL_X[1] - 70;
          const y2 = procY(j, visibleProcessors.length);
          const midX = (x1 + x2) / 2;
          return (
            <path
              key={`${s.id}-${p.id}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              className="stroke-accent"
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          );
        }),
      )}
      {/* edges processor -> dest */}
      {visibleProcessors.map((p, i) =>
        visibleDests.map((d, j) => {
          const x1 = COL_X[1] + 70;
          const y1 = procY(i, visibleProcessors.length);
          const x2 = COL_X[2] - 60;
          const y2 = destY(j, visibleDests.length);
          const midX = (x1 + x2) / 2;
          return (
            <path
              key={`${p.id}-${d.id}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              className="stroke-sev-warn"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          );
        }),
      )}

      {/* source nodes */}
      {visibleSources.map((s, i) => {
        const y = sourceY(i, visibleSources.length);
        return (
          <g key={s.id}>
            <rect
              x={COL_X[0] - 60}
              y={y - 12}
              width={120}
              height={24}
              rx={3}
              className="fill-bg stroke-line"
            />
            <text
              x={COL_X[0]}
              y={y + 4}
              textAnchor="middle"
              className="fill-ink-1 text-[10px]"
            >
              {s.label}
            </text>
          </g>
        );
      })}
      {/* processor nodes */}
      {visibleProcessors.map((p, i) => {
        const y = procY(i, visibleProcessors.length);
        return (
          <g key={p.id}>
            <rect
              x={COL_X[1] - 70}
              y={y - 12}
              width={140}
              height={24}
              rx={3}
              className="fill-bg stroke-line"
            />
            <text
              x={COL_X[1]}
              y={y + 4}
              textAnchor="middle"
              className="fill-ink-1 font-mono text-[10px]"
            >
              {p.label}
            </text>
          </g>
        );
      })}
      {/* destination nodes */}
      {visibleDests.length === 0 ? (
        <g>
          <rect
            x={COL_X[2] - 60}
            y={GRAPH_H / 2 - 12}
            width={120}
            height={24}
            rx={3}
            className="fill-bg-subtle stroke-line"
            strokeDasharray="3 3"
          />
          <text
            x={COL_X[2]}
            y={GRAPH_H / 2 + 4}
            textAnchor="middle"
            className="fill-ink-3 text-[10px]"
          >
            no 3p
          </text>
        </g>
      ) : (
        visibleDests.map((d, i) => {
          const y = destY(i, visibleDests.length);
          return (
            <g key={d.id}>
              <rect
                x={COL_X[2] - 60}
                y={y - 12}
                width={120}
                height={24}
                rx={3}
                className="fill-sev-warn-soft stroke-sev-warn"
                strokeOpacity={0.4}
              />
              <text
                x={COL_X[2]}
                y={y + 4}
                textAnchor="middle"
                className="fill-sev-warn text-[10px]"
              >
                {d.label}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

export function PiiLineageOverlay() {
  const open = useUiStore((s) => s.overlays.piiLineage.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [fieldId, setFieldId] = useState<PiiId>('email');
  const [erased, setErased] = useState<Record<string, boolean>>({});

  const field = piiById(fieldId);

  const erasureTargets = useMemo(() => field.erasureTargets, [field]);
  const erasedCount = erasureTargets.filter((t) => erased[t]).length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('piiLineage')}
      title="PII Lineage"
      subtitle={`${PII_FIELDS.length} PII fields tracked · ${PROCESSORS.length} processors · ${DESTINATIONS.length} destinations`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            field: {field.label} · basis {field.basis} · retention {field.retention}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Lineage exported (mock)')}
            >
              Export lineage
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('DPIA opened (mock)')}
            >
              Open DPIA
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">field:</span>
            {PII_FIELDS.map((f) => (
              <ToggleChip
                key={f.id}
                active={fieldId === f.id}
                onClick={() => setFieldId(f.id)}
              >
                {f.label}
              </ToggleChip>
            ))}
          </PanelHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <div className="rounded-sm border border-line bg-bg p-2">
                <PiiGraph fieldId={fieldId} />
              </div>

              <h3 className="text-caps mt-4 text-ink-3">Processor table</h3>
              <table className="mt-2 w-full border-separate border-spacing-0 text-[11px]">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="hairline-b px-2 py-1 font-normal">processor</th>
                    <th className="hairline-b px-2 py-1 font-normal">kind</th>
                    <th className="hairline-b px-2 py-1 font-normal">retention</th>
                    <th className="hairline-b px-2 py-1 font-normal">encrypted</th>
                    <th className="hairline-b px-2 py-1 font-normal">audit-log</th>
                  </tr>
                </thead>
                <tbody>
                  {field.processors.map((pid) => {
                    const p = processorById(pid);
                    if (!p) return null;
                    return (
                      <tr key={pid}>
                        <td className="hairline-b px-2 py-1 font-mono text-ink-1">
                          {p.label}
                        </td>
                        <td className="hairline-b px-2 py-1">
                          <Chip tone="muted" size="xs">
                            {p.kind}
                          </Chip>
                        </td>
                        <td className="hairline-b px-2 py-1 font-mono text-ink-2">
                          {p.retention}
                        </td>
                        <td className="hairline-b px-2 py-1">
                          <Chip tone={p.encrypted ? 'info' : 'err'} size="xs">
                            {p.encrypted ? 'AES-256' : 'plain'}
                          </Chip>
                        </td>
                        <td className="hairline-b px-2 py-1">
                          <Chip tone={p.auditLog ? 'accent' : 'muted'} size="xs">
                            {p.auditLog ? 'on' : 'off'}
                          </Chip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>

        <aside className="w-[320px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Right to erasure</div>
            <div className="mt-1 text-md text-ink-1">{field.label}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <Chip tone={BASIS_TONE[field.basis]} size="xs">
                {field.basis}
              </Chip>
              <Chip tone="muted" size="xs">
                retention {field.retention}
              </Chip>
              <Chip tone={field.encrypted ? 'info' : 'err'} size="xs">
                {field.encrypted ? 'encrypted' : 'plaintext'}
              </Chip>
            </div>

            <div className="mt-3 text-[11px] text-ink-3">
              Targets to delete ({erasedCount}/{erasureTargets.length})
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${(erasedCount / Math.max(1, erasureTargets.length)) * 100}%`,
                }}
              />
            </div>

            <ul className="mt-2 space-y-1">
              {erasureTargets.map((t) => {
                const checked = erased[t] === true;
                const label = processorById(t)?.label ?? destLabel(t);
                return (
                  <li
                    key={t}
                    className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setErased((p) => ({ ...p, [t]: !p[t] }))
                      }
                    />
                    <span
                      className={cn(
                        'flex-1 truncate font-mono text-[11px]',
                        checked ? 'text-ink-3 line-through' : 'text-ink-1',
                      )}
                    >
                      {label}
                    </span>
                    <Chip tone={checked ? 'info' : 'muted'} size="xs">
                      {checked ? 'erased' : 'pending'}
                    </Chip>
                  </li>
                );
              })}
            </ul>

            <Button
              size="xs"
              tone="warn"
              className="mt-3 w-full"
              onClick={() => {
                const all: Record<string, boolean> = {};
                for (const t of erasureTargets) all[t] = true;
                setErased(all);
                toast(`Deletion executed for ${field.label} (mock)`);
              }}
            >
              Run deletion (mock)
            </Button>

            <h4 className="text-caps mt-3 text-ink-3">Sources</h4>
            <ul className="mt-1 space-y-0.5">
              {field.sources.map((s) => (
                <li key={s} className="font-mono text-[10px] text-ink-2">
                  {SOURCES.find((x) => x.id === s)?.label ?? s}
                </li>
              ))}
            </ul>

            {field.processors.length > 0 ? (
              <>
                <h4 className="text-caps mt-3 text-ink-3">Processors</h4>
                <ul className="mt-1 space-y-0.5">
                  {field.processors.map((p) => (
                    <li
                      key={p}
                      className="font-mono text-[10px] text-ink-2"
                    >
                      {processorLabel(p)}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
