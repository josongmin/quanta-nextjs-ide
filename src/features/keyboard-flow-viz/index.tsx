import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  anomalyLabel,
  anomalyTone,
  pages,
  tabOrder,
  type Focusable,
} from './helpers';

export function KeyboardFlowVizOverlay() {
  const open = useUiStore((s) => s.overlays.keyboardFlowViz.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [pageId, setPageId] = useState<string>('home');
  const [showOverrides, setShowOverrides] = useState(true);

  const page = useMemo(
    () => pages.find((p) => p.id === pageId) ?? pages[0]!,
    [pageId],
  );

  const order = useMemo(() => tabOrder(page.focusables), [page]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('keyboardFlowViz'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Keyboard Flow</span>
        </span>
      }
      subtitle="tab order graph · focus trap inspector"
      size="xl"
      footer={
        <Button size="sm" tone="ghost" onClick={() => close('keyboardFlowViz')}>
          Close
        </Button>
      }
    >
      <div className="px-3 py-2 hairline-b">
        <div className="flex flex-wrap items-center gap-2">
          <SelectControl<string>
            label="page"
            value={pageId}
            onChange={(v) => setPageId(v)}
            options={pages.map((p) => ({ value: p.id, label: p.label }))}
          />
          <ToggleChip
            active={showOverrides}
            onClick={() => setShowOverrides((v) => !v)}
          >
            Show tabIndex overrides
          </ToggleChip>
          <span className="ml-auto text-[11px] text-ink-3">
            {order.length} reachable · {page.focusables.length - order.length}{' '}
            unreachable
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="min-w-0 px-3 py-3">
          <FlowSvg
            focusables={page.focusables}
            order={order}
            showOverrides={showOverrides}
          />

          <div className="mt-3">
            <h3 className="mb-1 text-caps text-ink-3">Focus order list</h3>
            <ul className="space-y-1">
              {order.map((f, idx) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-sm border border-line bg-bg px-2 py-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-4 w-5 items-center justify-center rounded-sm border border-line bg-bg-subtle font-mono text-[10px] text-ink-3">
                      {idx + 1}
                    </span>
                    <Chip tone="muted" size="xs">
                      {f.role}
                    </Chip>
                    <span className="truncate text-xs text-ink-1">
                      {f.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-ink-3">
                      tab={f.tabIndex}
                    </span>
                    {f.anomaly ? (
                      <Chip tone={anomalyTone(f.anomaly)} size="xs">
                        {anomalyLabel(f.anomaly)}
                      </Chip>
                    ) : (
                      <Chip tone="static" size="xs">
                        ok
                      </Chip>
                    )}
                  </div>
                </li>
              ))}
              {page.focusables
                .filter((f) => f.tabIndex < 0)
                .map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-sm border border-dashed border-line bg-bg-subtle/30 px-2 py-1"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-4 w-5 items-center justify-center rounded-sm border border-line bg-bg-subtle font-mono text-[10px] text-ink-3">
                        —
                      </span>
                      <Chip tone="muted" size="xs">
                        {f.role}
                      </Chip>
                      <span className="truncate text-xs text-ink-2">
                        {f.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-ink-3">
                        tab={f.tabIndex}
                      </span>
                      <Chip tone="err" size="xs">
                        unreachable
                      </Chip>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <aside className="min-w-0 px-3 py-3">
          <h3 className="mb-2 text-caps text-ink-3">Trap inspector</h3>
          <ul className="space-y-2">
            {page.modals.map((m) => (
              <li
                key={m.id}
                className="rounded-sm border border-line bg-bg px-2 py-2"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-1">{m.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        m.trapInstalled
                          ? 'Trap looks healthy'
                          : 'Install focus trap',
                        {
                          description: m.label,
                        },
                      )
                    }
                    className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[10px] tracking-caps text-ink-2 hover:bg-bg-hover hover:text-ink-1"
                  >
                    Audit
                  </button>
                </div>
                <dl className="space-y-1 text-[11px]">
                  <Row k="trap installed">
                    <Chip tone={m.trapInstalled ? 'static' : 'err'} size="xs">
                      {m.trapInstalled ? 'yes' : 'no'}
                    </Chip>
                  </Row>
                  <Row k="first focus">
                    <span className="font-mono text-ink-1">
                      {m.firstFocus}
                    </span>
                  </Row>
                  <Row k="restores on close">
                    <Chip tone={m.restoresOnClose ? 'static' : 'warn'} size="xs">
                      {m.restoresOnClose ? 'yes' : 'no'}
                    </Chip>
                  </Row>
                </dl>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function Row({
  k,
  children,
}: {
  k: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-3">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function FlowSvg({
  focusables,
  order,
  showOverrides,
}: {
  focusables: readonly Focusable[];
  order: readonly Focusable[];
  showOverrides: boolean;
}) {
  const W = 800;
  const H = 410;
  const center = (f: Focusable) => ({
    x: f.x + f.width / 2,
    y: f.y + f.height / 2,
  });

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Tab order graph"
      className="rounded-sm border border-line bg-bg"
    >
      {/* Page region outline */}
      <rect
        x={4}
        y={4}
        width={W - 8}
        height={350}
        rx={6}
        fill="none"
        className="stroke-line"
        strokeWidth={1}
      />
      {/* Modal-1 region */}
      <rect
        x={220}
        y={350}
        width={170}
        height={50}
        rx={4}
        fill="none"
        stroke="#dc2626"
        strokeDasharray="3 3"
        strokeWidth={1}
      />
      <text x={228} y={362} fontSize={9} fontFamily="ui-monospace" fill="#dc2626">
        modal-1 (no trap)
      </text>

      {/* Edges between consecutive elements */}
      {order.map((f, i) => {
        if (i === order.length - 1) return null;
        const next = order[i + 1];
        if (!next) return null;
        const a = center(f);
        const b = center(next);
        const stroke = next.anomaly === 'skip'
          ? '#d97706'
          : next.anomaly === 'loop'
            ? '#0ea5e9'
            : next.anomaly === 'out-of-trap'
              ? '#dc2626'
              : '#94a3b8';
        return (
          <g key={`${f.id}-${next.id}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={1.4}
              markerEnd="url(#arrow)"
            />
          </g>
        );
      })}

      <defs>
        <marker
          id="arrow"
          viewBox="0 0 8 8"
          refX={6}
          refY={4}
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Element nodes */}
      {focusables.map((f) => {
        const idx = order.findIndex((o) => o.id === f.id);
        const reachable = idx >= 0;
        const stroke =
          f.anomaly === 'unreachable'
            ? '#dc2626'
            : f.anomaly === 'skip'
              ? '#d97706'
              : f.anomaly === 'out-of-trap'
                ? '#dc2626'
                : reachable
                  ? '#0ea5e9'
                  : '#94a3b8';
        return (
          <g key={f.id}>
            <rect
              x={f.x}
              y={f.y}
              width={f.width}
              height={f.height}
              rx={4}
              className={reachable ? 'fill-bg-subtle' : 'fill-white'}
              stroke={stroke}
              strokeWidth={1.2}
              strokeDasharray={reachable ? '0' : '3 2'}
            />
            <text
              x={f.x + 6}
              y={f.y + Math.min(14, f.height / 2 + 4)}
              fontSize={9}
              fontFamily="ui-sans-serif"
              className="fill-ink-2"
            >
              {f.label.length > 18 ? `${f.label.slice(0, 18)}…` : f.label}
            </text>
            {reachable ? (
              <circle
                cx={f.x + f.width - 8}
                cy={f.y + 8}
                r={7}
                className="fill-accent"
              />
            ) : null}
            {reachable ? (
              <text
                x={f.x + f.width - 8}
                y={f.y + 11}
                textAnchor="middle"
                fontSize={9}
                fontFamily="ui-monospace"
                className="fill-white"
              >
                {idx + 1}
              </text>
            ) : null}
            {showOverrides && f.tabIndex !== 0 && f.tabIndex !== -1 ? (
              <text
                x={f.x + 6}
                y={f.y + f.height - 4}
                fontSize={8}
                fontFamily="ui-monospace"
                fill="#d97706"
              >
                tabIndex={f.tabIndex}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
