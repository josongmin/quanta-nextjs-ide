import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  PERMISSIONS,
  PERM_GROUPS,
  ROLES,
  getCell,
  roleSummary,
  statusFill,
  statusGlyph,
  statusStroke,
  statusTone,
  type PermGroup,
  type Role,
} from './helpers';

interface CellSel {
  permId: string;
  role: Role;
}

export function RbacMatrixOverlay() {
  const open = useUiStore((s) => s.overlays.rbacMatrix.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<PermGroup | 'all'>('all');
  const [sel, setSel] = useState<CellSel | null>({
    permId: 'article.publish',
    role: 'maintainer',
  });

  const filteredPerms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PERMISSIONS.filter((p) => {
      if (groupFilter !== 'all' && p.group !== groupFilter) return false;
      if (q && !p.id.toLowerCase().includes(q) && !p.label.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [search, groupFilter]);

  const selPerm = sel ? PERMISSIONS.find((p) => p.id === sel.permId) : undefined;
  const selCell = sel ? getCell(sel.permId, sel.role) : undefined;

  const labelW = 220;
  const colW = 100;
  const rowH = 28;
  const headerH = 40;
  const svgW = labelW + ROLES.length * colW + 12;
  const svgH = headerH + filteredPerms.length * rowH + 8;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('rbacMatrix')}
      title="RBAC matrix"
      subtitle={`${ROLES.length} roles × ${PERMISSIONS.length} permissions`}
      size="xl"
      footer={
        <div className="flex w-full items-center gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((r) => {
              const sum = roleSummary(r);
              return (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[10px] text-ink-2"
                >
                  <span className="text-ink-1">{r}</span>
                  <span className="text-ink-3">
                    {sum.allowed}/{sum.total}
                  </span>
                </span>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button size="xs" tone="ghost" onClick={() => toast('Generated policy.ts (mock)')}>
              Generate policy.ts
            </Button>
            <Button size="xs" tone="default" onClick={() => toast('Exported CSV (mock)')}>
              Export CSV
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search permissions..."
          className="w-56"
        />
        <div className="flex flex-wrap items-center gap-1">
          <ToggleChip active={groupFilter === 'all'} onClick={() => setGroupFilter('all')}>
            all
          </ToggleChip>
          {PERM_GROUPS.map((g) => (
            <ToggleChip
              key={g}
              active={groupFilter === g}
              onClick={() => setGroupFilter(g)}
            >
              {g}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-auto text-ink-3">click cell for rule detail</span>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <ScrollArea className="h-[560px]">
          <div className="px-3 py-3">
            {filteredPerms.length === 0 ? (
              <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-6 text-center text-[11px] text-ink-3">
                No permissions match filter.
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="block w-full"
                style={{ height: svgH }}
              >
                {/* role headers */}
                {ROLES.map((r, i) => (
                  <g key={r} transform={`translate(${labelW + i * colW},0)`}>
                    <rect
                      x={2}
                      y={4}
                      width={colW - 4}
                      height={headerH - 8}
                      rx={3}
                      className="fill-bg-subtle stroke-line"
                    />
                    <text
                      x={colW / 2}
                      y={headerH / 2 + 4}
                      textAnchor="middle"
                      fontSize={11}
                      className="fill-ink-1 font-medium"
                    >
                      {r}
                    </text>
                  </g>
                ))}

                {/* rows */}
                {filteredPerms.map((p, ri) => {
                  const y = headerH + ri * rowH;
                  return (
                    <g key={p.id} transform={`translate(0,${y})`}>
                      <rect
                        x={0}
                        y={0}
                        width={labelW}
                        height={rowH}
                        className="fill-bg stroke-line/60"
                      />
                      <text
                        x={8}
                        y={rowH / 2 + 3}
                        fontSize={10}
                        className="fill-ink-1 font-mono"
                      >
                        {p.id}
                      </text>
                      <text
                        x={labelW - 6}
                        y={rowH / 2 + 3}
                        textAnchor="end"
                        fontSize={9}
                        className="fill-ink-3"
                      >
                        {p.group}
                      </text>
                      {ROLES.map((r, ci) => {
                        const c = getCell(p.id, r);
                        if (!c) return null;
                        const active = sel?.permId === p.id && sel.role === r;
                        return (
                          <g
                            key={r}
                            transform={`translate(${labelW + ci * colW},0)`}
                            className="cursor-pointer"
                            onClick={() => setSel({ permId: p.id, role: r })}
                          >
                            <rect
                              x={2}
                              y={2}
                              width={colW - 4}
                              height={rowH - 4}
                              rx={3}
                              className={cn(
                                statusFill(c.status),
                                active ? statusStroke(c.status) : 'stroke-line/60',
                              )}
                              strokeWidth={active ? 1.5 : 0.75}
                            />
                            <text
                              x={colW / 2}
                              y={rowH / 2 + 3}
                              textAnchor="middle"
                              fontSize={11}
                              className={cn(
                                'font-mono font-semibold',
                                c.status === 'allow'
                                  ? 'fill-sem-static'
                                  : c.status === 'conditional'
                                    ? 'fill-sev-warn'
                                    : 'fill-sev-err',
                              )}
                            >
                              {statusGlyph(c.status)}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </ScrollArea>

        {/* Right rail */}
        <ScrollArea className="h-[560px]">
          <div className="space-y-3 p-3 text-xs">
            {sel && selPerm && selCell ? (
              <>
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="font-mono text-ink-1">{selPerm.id}</div>
                  <div className="text-[11px] text-ink-2">{selPerm.label}</div>
                  <div className="mt-0.5 text-[11px] text-ink-3">
                    role: <span className="font-mono">{sel.role}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Chip tone={statusTone(selCell.status)} size="xs">
                      {selCell.status}
                    </Chip>
                    {selCell.rule ? (
                      <span className="text-[11px] text-ink-2">{selCell.rule}</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Description
                  </div>
                  <div className="mt-1 text-[11px] text-ink-2">
                    {selPerm.description}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Evidence
                  </div>
                  <div className="mt-1 rounded-sm border border-line bg-bg-subtle px-2 py-1 font-mono text-[10px] text-ink-1">
                    {selCell.evidence}
                  </div>
                </div>

                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Tests
                  </div>
                  <div className="mt-1">
                    <Chip
                      tone={selCell.testsPass ? 'static' : 'err'}
                      size="xs"
                    >
                      {selCell.testsPass ? 'tests pass' : 'tests fail'}
                    </Chip>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    tone="default"
                    onClick={() => toast(`Edit rule for ${selPerm.id} (mock)`)}
                  >
                    Edit rule
                  </Button>
                  <Button
                    size="xs"
                    tone="ghost"
                    onClick={() => toast(`Audit log entry queued (mock)`)}
                  >
                    Add audit log
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                Select a cell to inspect.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}
