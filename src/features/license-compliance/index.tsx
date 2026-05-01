import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  OverlayPanel,
  ScrollArea,
  Tooltip,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import {
  COMPAT_FILL,
  COMPAT_LABEL,
  COMPAT_RULE,
  LICENSES,
  MATRIX,
  REPLACEMENTS,
  violatorsFor,
  type Compatibility,
} from './helpers';

export function LicenseComplianceOverlay() {
  const open = useUiStore((s) => s.overlays.licenseCompliance.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [project, setProject] = useState<string>('MIT');

  const violators = useMemo(() => violatorsFor(project), [project]);

  const incompatible = violators.filter((v) => v.compatibility === 'no').length;
  const conditional = violators.filter((v) => v.compatibility === 'cond').length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('licenseCompliance'))}
      title="License Compliance"
      subtitle={`Project license: ${project} · ${incompatible} incompatible · ${conditional} with conditions`}
      size="lg"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Compliance ticket opened')}
          >
            <Icon.Doc className="h-3 w-3" /> Open compliance ticket
          </Button>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast('NOTICE.md generated')}
          >
            <Icon.Doc className="h-3 w-3" /> Generate NOTICE.md
          </Button>
        </>
      }
    >
      <PanelHeader>
        <SelectControl<string>
          label="Project license"
          value={project}
          onChange={setProject}
          options={LICENSES.map((l) => ({ value: l, label: l }))}
        />
        <span className="hairline-r mx-1 h-4" />
        <span className="text-caps text-ink-3">Legend</span>
        {(['yes', 'cond', 'no'] as const).map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 text-[11px] text-ink-2"
          >
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-sm border border-line"
              style={{ background: COMPAT_FILL[c] }}
            />
            {COMPAT_LABEL[c]}
          </span>
        ))}
      </PanelHeader>

      <div className="grid grid-cols-[1fr_360px]">
        <div className="min-w-0 hairline-r p-3">
          <div className="mb-2 text-caps text-ink-3">
            Compatibility matrix · rows = library · columns = project
          </div>
          <Matrix project={project} onPickProject={setProject} />
        </div>
        <aside className="bg-bg-subtle/60">
          <div className="px-3 py-2 hairline-b text-caps text-ink-3">
            Violators ({violators.length})
          </div>
          {violators.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="All clear"
                description="No license violations against the current project license."
              />
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <ul className="divide-y divide-line/60">
                {violators.map((v) => {
                  const replacements = REPLACEMENTS[v.license] ?? [];
                  return (
                    <li key={v.name} className="px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-ink-1">
                          {v.name}
                          <span className="ml-1 text-ink-3">@{v.version}</span>
                        </span>
                        <Chip
                          tone={v.compatibility === 'no' ? 'err' : 'warn'}
                          size="xs"
                        >
                          {v.compatibility === 'no'
                            ? 'incompatible'
                            : 'conditions'}
                        </Chip>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <Chip tone="muted" size="xs">
                          {v.license}
                        </Chip>
                        <span className="text-[10px] text-ink-3">
                          {COMPAT_RULE[v.compatibility]}
                        </span>
                      </div>
                      {replacements.length > 0 ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="text-[10px] uppercase tracking-caps text-ink-3">
                            Replace with:
                          </span>
                          {replacements.map((r) => (
                            <button
                              key={r}
                              onClick={() => toast(`Swap ${v.name} → ${r}`)}
                              className="inline-flex items-center"
                            >
                              <Chip tone="info" size="xs">
                                <span className="font-mono">{r}</span>
                              </Chip>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}

function Matrix({
  project,
  onPickProject,
}: {
  project: string;
  onPickProject(p: string): void;
}) {
  const cell = 36;
  const labelW = 110;
  const W = labelW + cell * LICENSES.length + 4;
  const H = labelW + cell * LICENSES.length + 4;
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label="License compatibility matrix"
      >
        {/* Column headers */}
        {LICENSES.map((proj, i) => {
          const x = labelW + i * cell + cell / 2;
          const y = labelW - 6;
          return (
            <g key={`c-${proj}`} transform={`translate(${x}, ${y})`}>
              <text
                transform="rotate(-45)"
                textAnchor="start"
                className={
                  proj === project
                    ? 'fill-ink-1 text-[10px] font-medium'
                    : 'fill-ink-3 text-[10px]'
                }
              >
                {proj}
              </text>
            </g>
          );
        })}
        {/* Row headers */}
        {LICENSES.map((lib, j) => {
          const y = labelW + j * cell + cell / 2 + 3;
          return (
            <text
              key={`r-${lib}`}
              x={labelW - 6}
              y={y}
              textAnchor="end"
              className="fill-ink-2 text-[10px]"
            >
              {lib}
            </text>
          );
        })}
        {/* Cells */}
        {LICENSES.map((lib, j) =>
          LICENSES.map((proj, i) => {
            const c: Compatibility = MATRIX[lib]?.[proj] ?? 'cond';
            const x = labelW + i * cell;
            const y = labelW + j * cell;
            const isCol = proj === project;
            return (
              <Tooltip
                key={`${lib}-${proj}`}
                content={
                  <div className="space-y-0.5">
                    <div className="font-medium">
                      {lib} → {proj}
                    </div>
                    <div className="text-ink-2">
                      {COMPAT_LABEL[c]}: {COMPAT_RULE[c]}
                    </div>
                  </div>
                }
              >
                <g
                  className="cursor-pointer"
                  onClick={() => onPickProject(proj)}
                >
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={cell - 2}
                    height={cell - 2}
                    rx={2}
                    fill={COMPAT_FILL[c]}
                    stroke={isCol ? 'rgb(15 23 42)' : 'rgb(226 232 240)'}
                    strokeWidth={isCol ? 1.5 : 1}
                  />
                  <text
                    x={x + cell / 2}
                    y={y + cell / 2 + 3}
                    textAnchor="middle"
                    className="fill-ink-2 text-[9px]"
                  >
                    {c === 'yes' ? '✓' : c === 'cond' ? '~' : '✗'}
                  </text>
                </g>
              </Tooltip>
            );
          }),
        )}
      </svg>
    </div>
  );
}
