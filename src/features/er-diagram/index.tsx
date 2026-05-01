import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  EmptyState,
  OverlayPanel,
  ScrollArea,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  erModels,
  erRelations,
  fieldRowY,
  formatRecordCount,
  HEADER_HEIGHT,
  modelHeight,
  MODEL_WIDTH,
  ROW_HEIGHT,
  type ErModel,
  type ErRelation,
} from './helpers';

export function ErDiagramOverlay() {
  const open = useUiStore((s) => s.overlays.erDiagram.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string>(erModels[0]?.id ?? '');
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const selected = useMemo(
    () => erModels.find((m) => m.id === selectedId) ?? null,
    [selectedId],
  );

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) });
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('erDiagram')}
      title="ER Diagram"
      subtitle="Models, fields, and relationships"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Auto-layout (mock)')}>
            Auto-layout
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Add relation (mock)')}>
            Add relation
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Schema exported (mock)')}>
            Export schema
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_300px]">
        <div
          className="relative h-[640px] overflow-hidden bg-bg-subtle hairline-r select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
        >
          <svg
            width="100%"
            height="100%"
            role="img"
            aria-label="ER diagram canvas"
          >
            <defs>
              <pattern id="erGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#erGrid)" />
            <g transform={`translate(${pan.x}, ${pan.y})`}>
              {erRelations.map((rel) => (
                <RelationEdge key={rel.id} rel={rel} />
              ))}
              {erModels.map((m) => (
                <ModelTable
                  key={m.id}
                  model={m}
                  selected={m.id === selectedId}
                  onSelect={(id) => setSelectedId(id)}
                />
              ))}
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-sm border border-line bg-bg/90 px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
            <span>pan: drag canvas</span>
            <span>·</span>
            <span>{erModels.length} models</span>
            <span>·</span>
            <span>{erRelations.length} relations</span>
          </div>
        </div>

        <ScrollArea className="max-h-[640px] bg-bg">
          {selected ? <ModelDetail model={selected} /> : (
            <div className="p-3">
              <EmptyState title="No model selected" description="Click a table on the canvas." />
            </div>
          )}
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function ModelTable({
  model,
  selected,
  onSelect,
}: {
  model: ErModel;
  selected: boolean;
  onSelect(id: string): void;
}) {
  const h = modelHeight(model);
  const stroke = selected ? '#2563eb' : '#d1d5db';
  const headerFill = selected ? '#dbeafe' : '#f3f4f6';
  return (
    <g
      transform={`translate(${model.pos.x}, ${model.pos.y})`}
      className="cursor-pointer"
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(model.id);
      }}
    >
      <rect
        x={0}
        y={0}
        width={MODEL_WIDTH}
        height={h}
        rx={6}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={selected ? 1.5 : 1}
      />
      <rect
        x={0}
        y={0}
        width={MODEL_WIDTH}
        height={HEADER_HEIGHT}
        rx={6}
        fill={headerFill}
        stroke={stroke}
        strokeWidth={selected ? 1.5 : 1}
      />
      <rect x={0} y={HEADER_HEIGHT - 6} width={MODEL_WIDTH} height={6} fill={headerFill} />
      <text
        x={10}
        y={19}
        fill="#0f172a"
        fontSize="12"
        fontWeight="600"
        fontFamily="ui-monospace, monospace"
      >
        {model.name}
      </text>
      <g transform={`translate(${MODEL_WIDTH - 56}, 8)`}>
        <rect width={48} height={14} rx={7} fill="#ffffff" stroke="#cbd5e1" />
        <text
          x={24}
          y={10}
          fill="#475569"
          fontSize="9"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
        >
          {formatRecordCount(model.recordCount)}
        </text>
      </g>

      {model.fields.map((f, idx) => {
        const y = HEADER_HEIGHT + idx * ROW_HEIGHT;
        return (
          <g key={f.name} transform={`translate(0, ${y})`}>
            {idx > 0 ? (
              <line x1={0} y1={0} x2={MODEL_WIDTH} y2={0} stroke="#f1f5f9" strokeWidth={1} />
            ) : null}
            <text
              x={10}
              y={ROW_HEIGHT / 2 + 4}
              fill="#0f172a"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
            >
              {f.name}
            </text>
            <text
              x={MODEL_WIDTH - 10}
              y={ROW_HEIGHT / 2 + 4}
              fill="#64748b"
              fontSize="10"
              textAnchor="end"
              fontFamily="ui-monospace, monospace"
            >
              {f.type}
              {f.nullable ? '?' : ''}
            </text>
            <g transform={`translate(${MODEL_WIDTH - 78}, ${ROW_HEIGHT / 2 - 5})`}>
              {f.pk ? (
                <text fontSize="10" fill="#b45309">
                  🔑
                </text>
              ) : null}
              {f.fk ? (
                <text fontSize="10" fill="#2563eb" x={f.pk ? 12 : 0}>
                  🔗
                </text>
              ) : null}
            </g>
          </g>
        );
      })}
    </g>
  );
}

function RelationEdge({ rel }: { rel: ErRelation }) {
  const from = erModels.find((m) => m.id === rel.fromModel);
  const to = erModels.find((m) => m.id === rel.toModel);
  if (!from || !to) return null;
  const fromY = from.pos.y + fieldRowY(from, rel.fromField);
  const toY = to.pos.y + fieldRowY(to, rel.toField);
  const fromRight = from.pos.x + MODEL_WIDTH;
  const toLeft = to.pos.x;
  const x1 = from.pos.x < to.pos.x ? fromRight : from.pos.x;
  const x2 = from.pos.x < to.pos.x ? toLeft : to.pos.x + MODEL_WIDTH;
  const midX = (x1 + x2) / 2;
  const midY = (fromY + toY) / 2;
  const fromLabel = rel.cardinality === '1:1' ? '1' : rel.cardinality === '1:n' ? '∞' : '∞';
  const toLabel = rel.cardinality === '1:1' ? '1' : rel.cardinality === '1:n' ? '1' : '∞';

  return (
    <g>
      <path
        d={`M ${x1} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${x2} ${toY}`}
        stroke="#94a3b8"
        strokeWidth={1.25}
        fill="none"
      />
      <circle cx={x1} cy={fromY} r={3} fill="#64748b" />
      <circle cx={x2} cy={toY} r={3} fill="#64748b" />
      <g>
        <rect x={x1 + (x2 > x1 ? 4 : -16)} y={fromY - 8} width={12} height={12} rx={2} fill="#ffffff" stroke="#cbd5e1" />
        <text
          x={x1 + (x2 > x1 ? 10 : -10)}
          y={fromY + 1}
          fontSize="9"
          textAnchor="middle"
          fill="#334155"
          fontFamily="ui-monospace, monospace"
        >
          {fromLabel}
        </text>
      </g>
      <g>
        <rect x={x2 + (x2 > x1 ? -16 : 4)} y={toY - 8} width={12} height={12} rx={2} fill="#ffffff" stroke="#cbd5e1" />
        <text
          x={x2 + (x2 > x1 ? -10 : 10)}
          y={toY + 1}
          fontSize="9"
          textAnchor="middle"
          fill="#334155"
          fontFamily="ui-monospace, monospace"
        >
          {toLabel}
        </text>
      </g>
      <g>
        <rect x={midX - 14} y={midY - 7} width={28} height={14} rx={3} fill="#f8fafc" stroke="#cbd5e1" />
        <text
          x={midX}
          y={midY + 3}
          fontSize="9"
          textAnchor="middle"
          fill="#334155"
          fontFamily="ui-monospace, monospace"
        >
          {rel.cardinality}
        </text>
      </g>
    </g>
  );
}

function ModelDetail({ model }: { model: ErModel }) {
  return (
    <div className="flex flex-col gap-3 p-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">model</div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="font-mono text-sm font-semibold text-ink-1">{model.name}</div>
          <Chip tone="muted" size="xs">
            {formatRecordCount(model.recordCount)} rows
          </Chip>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">fields</div>
        <div className="overflow-hidden rounded-sm border border-line">
          <table className="w-full text-xs">
            <thead className="bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
              <tr>
                <th className="px-2 py-1 text-left">name</th>
                <th className="px-2 py-1 text-left">type</th>
                <th className="px-2 py-1 text-left">attrs</th>
              </tr>
            </thead>
            <tbody>
              {model.fields.map((f) => (
                <tr key={f.name} className="border-t border-line/60">
                  <td className="px-2 py-1 font-mono text-ink-1">{f.name}</td>
                  <td className="px-2 py-1 font-mono text-ink-2">
                    {f.type}
                    {f.nullable ? '?' : ''}
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex flex-wrap gap-1">
                      {f.pk ? (
                        <Chip tone="warn" size="xs">
                          PK
                        </Chip>
                      ) : null}
                      {f.fk ? (
                        <Chip tone="info" size="xs">
                          FK→{f.fk.model}
                        </Chip>
                      ) : null}
                      {f.unique ? (
                        <Chip tone="muted" size="xs">
                          unique
                        </Chip>
                      ) : null}
                      {f.nullable ? (
                        <Chip tone="muted" size="xs">
                          null
                        </Chip>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">indexes</div>
        <ul className="space-y-1">
          {model.indexes.map((i) => (
            <li
              key={i.name}
              className={cn(
                'flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1',
              )}
            >
              <span className="font-mono text-ink-1">{i.name}</span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-ink-3">
                  {i.fields.join(', ')}
                </span>
                {i.unique ? (
                  <Chip tone="info" size="xs">
                    unique
                  </Chip>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        size="xs"
        tone="default"
        onClick={() => toast(`Open ${model.name} in editor (mock)`)}
      >
        Open in editor
      </Button>
    </div>
  );
}
