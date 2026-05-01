import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { activeBreakpoint, components } from './helpers';

const SLIDER_MIN = 0;
const SLIDER_MAX = 1000;
const TIMELINE_W = 640;
const TIMELINE_H = 56;

export function ContainerQueryInspectorOverlay() {
  const open = useUiStore((s) => s.overlays.containerQueryInspector.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [componentId, setComponentId] = useState<string>(
    components[0]?.id ?? 'card',
  );
  const component = useMemo(
    () => components.find((c) => c.id === componentId) ?? components[0],
    [componentId],
  );

  const [width, setWidth] = useState<number>(component?.initialWidth ?? 360);

  const active = component ? activeBreakpoint(component, width) : 'base';
  const matchedCss = useMemo(() => {
    if (!component) return '';
    return component.rules
      .filter((r) => width >= r.min)
      .map((r) => r.css)
      .join('\n\n');
  }, [component, width]);

  if (!component) return null;

  const xFor = (n: number): number =>
    (Math.max(0, Math.min(SLIDER_MAX, n)) / SLIDER_MAX) * TIMELINE_W;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('containerQueryInspector'))}
      title="Container query inspector"
      subtitle={`@container ${component.containerName}`}
      size="lg"
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Component</span>
        {components.map((c) => (
          <ToggleChip
            key={c.id}
            active={component.id === c.id}
            onClick={() => {
              setComponentId(c.id);
              setWidth(c.initialWidth);
            }}
          >
            {c.name}
          </ToggleChip>
        ))}
        <span className="ml-auto inline-flex items-center gap-2">
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="h-2 w-48 accent-accent"
          />
          <span className="font-mono text-[11px] text-ink-1">{width}px</span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Breakpoint timeline
          </div>
          <svg
            width={TIMELINE_W + 24}
            height={TIMELINE_H}
            viewBox={`0 0 ${TIMELINE_W + 24} ${TIMELINE_H}`}
            className="mt-2 block"
            role="img"
            aria-label="breakpoint timeline"
          >
            <line
              x1={12}
              y1={28}
              x2={12 + TIMELINE_W}
              y2={28}
              stroke="rgb(0 0 0 / 0.15)"
              strokeWidth={1}
            />
            {([
              ['sm', component.breakpoints.sm],
              ['md', component.breakpoints.md],
              ['lg', component.breakpoints.lg],
            ] as ReadonlyArray<[string, number]>).map(([label, n]) => (
              <g key={label}>
                <line
                  x1={12 + xFor(n)}
                  y1={18}
                  x2={12 + xFor(n)}
                  y2={38}
                  stroke={
                    active === label
                      ? 'rgb(99 102 241)'
                      : 'rgb(0 0 0 / 0.35)'
                  }
                  strokeWidth={active === label ? 2 : 1}
                />
                <text
                  x={12 + xFor(n)}
                  y={14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="rgb(75 85 99)"
                  fontFamily="ui-monospace, monospace"
                >
                  {label} {n}
                </text>
              </g>
            ))}
            <circle
              cx={12 + xFor(width)}
              cy={28}
              r={5}
              fill="rgb(99 102 241)"
            />
            <text
              x={12 + xFor(width)}
              y={50}
              textAnchor="middle"
              fontSize={9}
              fill="rgb(99 102 241)"
              fontFamily="ui-monospace, monospace"
            >
              {width}px
            </text>
          </svg>

          <div className="mt-4 text-[10px] uppercase tracking-caps text-ink-3">
            Live preview
          </div>
          <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle p-3">
            <div
              className="rounded-sm border border-line bg-bg p-3"
              style={{ width: width || 1 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-1">
                  {component.name}
                </span>
                <Chip tone="accent" size="xs">
                  {active}
                </Chip>
              </div>
              <div
                className={cn(
                  'mt-2 grid gap-2',
                  active === 'base' && 'grid-cols-1',
                  active === 'sm' && 'grid-cols-2',
                  active === 'md' && 'grid-cols-3',
                  active === 'lg' && 'grid-cols-4',
                )}
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-sm border border-line bg-bg-subtle"
                  />
                ))}
              </div>
              {(active === 'md' || active === 'lg') && (
                <div className="mt-2 text-[11px] text-ink-2">
                  Meta visible at {active}+
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Matched rules
          </div>
          <CodeBlock
            className="mt-1.5"
            code={matchedCss || '/* no rules at this width */'}
            language="css"
            showLineNumbers={false}
            maxHeight={200}
          />

          <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
            All rules
          </div>
          <ul className="mt-1 space-y-1">
            {component.rules.map((r) => {
              const isActive = r.at === active;
              return (
                <li
                  key={r.at}
                  className={cn(
                    'rounded-sm border px-2 py-1.5 text-[11px]',
                    isActive
                      ? 'border-accent/40 bg-accent-soft'
                      : 'border-line bg-bg',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-ink-1">{r.at}</span>
                    <span className="font-mono text-[10px] text-ink-3">
                      ≥ {r.min}px
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
