import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  components,
  locales,
  type ComponentId,
  type LocaleId,
} from './helpers';

export function RtlPreviewOverlay() {
  const open = useUiStore((s) => s.overlays.rtlPreview.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [activeId, setActiveId] = useState<ComponentId>('header');
  const [forceRtl, setForceRtl] = useState(true);
  const [locale, setLocale] = useState<LocaleId>('ar');

  const comp = useMemo(
    () => components.find((c) => c.id === activeId) ?? components[0]!,
    [activeId],
  );

  const localeMeta = useMemo(
    () => locales.find((l) => l.id === locale) ?? locales[0]!,
    [locale],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('rtlPreview'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Globe className="h-4 w-4 text-ink-3" />
          <span>RTL Preview</span>
        </span>
      }
      subtitle="LTR ↔ RTL · logical-property auditor"
      size="xl"
      footer={
        <Button size="sm" tone="ghost" onClick={() => close('rtlPreview')}>
          Close
        </Button>
      }
    >
      <div className="px-3 py-2 hairline-b">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-caps text-ink-3">component</span>
          {components.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={cn(
                'inline-flex h-5 items-center rounded-sm border border-line bg-bg px-1.5 text-[11px] tracking-caps text-ink-2 hover:bg-bg-hover hover:text-ink-1',
                activeId === c.id &&
                  'bg-bg-selected text-ink-1 border-line-strong',
              )}
            >
              {c.label}
            </button>
          ))}
          <span className="ml-2">
            <ToggleChip active={forceRtl} onClick={() => setForceRtl((v) => !v)}>
              Force RTL
            </ToggleChip>
          </span>
          <span className="ml-auto text-[11px] text-ink-3">
            {comp.issues.length} {comp.issues.length === 1 ? 'issue' : 'issues'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="min-w-0 px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            <PreviewCard label="LTR" dir="ltr" component={comp.id} />
            <PreviewCard
              label={forceRtl ? `RTL · ${localeMeta.label}` : 'RTL'}
              dir="rtl"
              component={comp.id}
              hasIssues={comp.issues.length > 0}
            />
          </div>

          <div className="mt-3 text-xs text-ink-3">{comp.description}</div>

          <div className="mt-3">
            <h3 className="mb-1 text-caps text-ink-3">Issues for {comp.label}</h3>
            {comp.issues.length === 0 ? (
              <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-3 py-3 text-center text-xs text-ink-3">
                No physical-property usage detected.
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-0 text-xs">
                <thead>
                  <tr className="text-caps text-ink-3">
                    <th className="hairline-b px-2 py-1 text-left font-normal">file</th>
                    <th className="hairline-b px-2 py-1 text-left font-normal">line</th>
                    <th className="hairline-b px-2 py-1 text-left font-normal">prop</th>
                    <th className="hairline-b px-2 py-1 text-left font-normal">replace with</th>
                    <th className="hairline-b px-2 py-1 text-right font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {comp.issues.map((i) => (
                    <tr key={i.id}>
                      <td
                        className="hairline-b truncate px-2 py-1 font-mono text-[11px] text-ink-1"
                        title={i.file}
                      >
                        {i.file}
                      </td>
                      <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-3">
                        {i.line}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <Chip tone="warn" size="xs">
                          {i.prop}
                        </Chip>
                      </td>
                      <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-2">
                        {i.after}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            toast('Fix copied', {
                              description: `${i.before} → ${i.after}`,
                            })
                          }
                          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[10px] tracking-caps text-ink-2 hover:bg-bg-hover hover:text-ink-1"
                        >
                          Copy fix
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="min-w-0 px-3 py-3">
          <h3 className="mb-2 text-caps text-ink-3">Locale switcher</h3>
          <div className="space-y-1">
            {locales.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLocale(l.id)}
                className={cn(
                  'block w-full rounded-sm border border-line bg-bg px-2 py-1.5 text-left hover:bg-bg-hover',
                  locale === l.id && 'border-line-strong bg-bg-selected',
                )}
              >
                <div className="text-xs text-ink-1">{l.label}</div>
                <div className="mt-0.5 text-[11px] text-ink-2" dir="rtl">
                  {l.sample}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-ink-3">
                  numerals: {l.numerals}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 hairline-t pt-2">
            <h3 className="mb-1 text-caps text-ink-3">Tips</h3>
            <ul className="space-y-1 text-[11px] text-ink-2">
              <li>Prefer <span className="font-mono">margin-inline-*</span> over <span className="font-mono">margin-left/right</span>.</li>
              <li>Use <span className="font-mono">text-align: start | end</span>.</li>
              <li>Mirror icons with <span className="font-mono">scaleX(-1)</span>.</li>
              <li>Use logical <span className="font-mono">inset-inline-*</span> for absolute layout.</li>
            </ul>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function PreviewCard({
  label,
  dir,
  component,
  hasIssues,
}: {
  label: string;
  dir: 'ltr' | 'rtl';
  component: ComponentId;
  hasIssues?: boolean;
}) {
  return (
    <div className="rounded-sm border border-line bg-bg">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-bg-subtle px-2 py-1">
        <span className="text-caps text-ink-3">{label}</span>
        <span className="font-mono text-[10px] text-ink-3">dir="{dir}"</span>
      </div>
      <div className="p-2">
        <ComponentSvg component={component} dir={dir} highlightIssues={dir === 'rtl' && !!hasIssues} />
      </div>
    </div>
  );
}

function ComponentSvg({
  component,
  dir,
  highlightIssues,
}: {
  component: ComponentId;
  dir: 'ltr' | 'rtl';
  highlightIssues: boolean;
}) {
  const W = 360;
  const H = 200;
  const flip = dir === 'rtl';
  const fx = (x: number, w: number) => (flip ? W - x - w : x);

  const issueRect = (x: number, y: number, w: number, h: number) =>
    highlightIssues ? (
      <rect
        x={fx(x, w)}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="#dc2626"
        strokeDasharray="3 3"
        strokeWidth={1}
      />
    ) : null;

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${component} ${dir}`}
    >
      {component === 'header' && (
        <>
          <rect x={fx(8, 60)} y={12} width={60} height={28} rx={4} className="fill-accent-soft" />
          <rect x={fx(80, 50)} y={16} width={50} height={20} rx={3} className="fill-bg-subtle" />
          <rect x={fx(140, 50)} y={16} width={50} height={20} rx={3} className="fill-bg-subtle" />
          <rect x={fx(200, 50)} y={16} width={50} height={20} rx={3} className="fill-bg-subtle" />
          <rect x={fx(310, 40)} y={12} width={40} height={28} rx={4} className="fill-bg-subtle" />
          {issueRect(8, 12, 60, 28)}
          <rect x={8} y={64} width={W - 16} height={120} rx={4} className="fill-bg-subtle" />
        </>
      )}
      {component === 'nav' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={fx(8 + i * 80, 60)} y={20} width={60} height={24} rx={3} className="fill-accent-soft" />
              <text x={fx(8 + i * 80, 60) + 30} y={36} fontSize={11} textAnchor="middle" className="fill-ink-2">
                Link {i + 1}
              </text>
            </g>
          ))}
          {issueRect(8, 20, 60, 24)}
          <rect x={8} y={60} width={W - 16} height={130} rx={4} className="fill-bg-subtle" />
        </>
      )}
      {component === 'card' && (
        <>
          <rect x={fx(8, W - 16)} y={8} width={W - 16} height={184} rx={6} className="fill-white stroke-line" strokeWidth={1} />
          <rect x={fx(8, 4)} y={8} width={4} height={184} className="fill-accent" />
          <rect x={fx(20, 110)} y={20} width={110} height={84} rx={3} className="fill-bg-subtle" />
          <rect x={fx(140, 180)} y={20} width={180} height={12} rx={2} className="fill-line" />
          <rect x={fx(140, 120)} y={40} width={120} height={10} rx={2} className="fill-line" />
          <rect x={fx(140, 80)} y={60} width={80} height={20} rx={3} className="fill-accent-soft" />
          {issueRect(8, 8, 4, 184)}
        </>
      )}
      {component === 'form' && (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={fx(8, 60)} y={20 + i * 50} width={60} height={14} className="fill-line" />
              <rect x={fx(80, W - 96)} y={16 + i * 50} width={W - 96} height={28} rx={3} className="fill-bg-subtle" />
            </g>
          ))}
          <rect x={fx(8, 80)} y={170} width={80} height={24} rx={3} className="fill-accent-soft" />
          <rect x={fx(96, 80)} y={170} width={80} height={24} rx={3} className="fill-bg-subtle" />
          {issueRect(8, 170, 80, 24)}
        </>
      )}
      {component === 'table' && (
        <>
          {[0, 1, 2, 3].map((row) => (
            <g key={row}>
              <rect x={fx(8, W - 16)} y={20 + row * 36} width={W - 16} height={32} rx={2} className={row === 0 ? 'fill-bg-subtle' : 'fill-white'} stroke="#e5e7eb" strokeWidth={1} />
              <text x={fx(20, 0)} y={40 + row * 36} fontSize={10} className="fill-ink-2">Plan</text>
              <text x={fx(W - 24, 0)} y={40 + row * 36} fontSize={10} textAnchor="end" className="fill-ink-1">$48</text>
            </g>
          ))}
          {issueRect(W - 80, 20, 72, 32 * 4 + 12)}
        </>
      )}
      {component === 'chart' && (
        <>
          <rect x={fx(8, 40)} y={20} width={40} height={160} rx={2} className="fill-bg-subtle" />
          <line x1={fx(60, 0)} y1={170} x2={fx(W - 80, 0)} y2={170} className="stroke-line" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={fx(70 + i * 50, 30)}
              y={170 - (40 + i * 25)}
              width={30}
              height={40 + i * 25}
              rx={2}
              className="fill-accent-soft"
            />
          ))}
          <rect x={fx(W - 70, 60)} y={20} width={60} height={80} rx={3} className="fill-bg-subtle" />
          {issueRect(8, 20, 40, 160)}
        </>
      )}
    </svg>
  );
}
