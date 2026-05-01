import { Fragment, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { analyzeClientModules, useLastTraceStore } from '@entities/rsc-payload';
import type {
  Confidence,
  Diagnostic,
  EvidenceItem,
  Severity,
} from '@shared/types';
import {
  Button,
  ConfidenceDot,
  Icon,
  ScrollArea,
  SeverityLabel,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { WhyBrokenButton } from '@features/full-context-hover/why-broken';
import { FixSafelyButton } from '@features/full-context-hover/fix-safely';

type GroupBy = 'route' | 'rule' | 'severity' | 'file';

const GROUP_BY_OPTIONS: ReadonlyArray<{ value: GroupBy; label: string }> = [
  { value: 'route', label: 'Route' },
  { value: 'rule', label: 'Rule' },
  { value: 'severity', label: 'Severity' },
  { value: 'file', label: 'File' },
];

const SEVERITY_OPTIONS: ReadonlyArray<{ value: Severity; label: string }> = [
  { value: 'err', label: 'ERR' },
  { value: 'warn', label: 'WARN' },
  { value: 'info', label: 'INFO' },
  { value: 'hint', label: 'HINT' },
];

const CONFIDENCE_OPTIONS: ReadonlyArray<{ value: Confidence; label: string }> = [
  { value: 'high', label: 'HIGH' },
  { value: 'medium', label: 'MED' },
  { value: 'low', label: 'LOW' },
];

function tabIdFor(file: string): string {
  return `tab-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

function tabLabelFor(file: string): string {
  return file.split('/').pop() ?? file;
}

function groupKey(d: Diagnostic, by: GroupBy): string {
  return match(by)
    .with('route', () => d.scope || d.routeId || '(no route)')
    .with('rule', () => d.ruleId)
    .with('severity', () => d.severity.toUpperCase())
    .with('file', () => d.location.file)
    .exhaustive();
}

function evidenceKindLabel(k: EvidenceItem['kind']): string {
  return match(k)
    .with('direct', () => 'direct')
    .with('indirect', () => 'indirect')
    .with('heuristic', () => 'heuristic')
    .exhaustive();
}

export function ProblemsTab() {
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const groupBy = useDiagnosticStore((s) => s.groupBy);
  const setGroupBy = useDiagnosticStore((s) => s.setGroupBy);
  const filters = useDiagnosticStore((s) => s.filters);
  const toggleSeverity = useDiagnosticStore((s) => s.toggleSeverity);
  const toggleConfidence = useDiagnosticStore((s) => s.toggleConfidence);
  const toggleInDiff = useDiagnosticStore((s) => s.toggleInDiff);
  const toggleAutofixOnly = useDiagnosticStore((s) => s.toggleAutofixOnly);
  const mutedRuleIds = useDiagnosticStore((s) => s.mutedRuleIds);
  const selectedIds = useDiagnosticStore((s) => s.selectedDiagnosticIds);
  const toggleSelected = useDiagnosticStore((s) => s.toggleSelected);
  const selectMany = useDiagnosticStore((s) => s.selectMany);
  const clearSelection = useDiagnosticStore((s) => s.clearSelection);
  const muteRule = useDiagnosticStore((s) => s.muteRule);
  const muteDiagnostic = useDiagnosticStore((s) => s.muteDiagnostic);

  const openOverlay = useUiStore((s) => s.openOverlay);
  const openTab = useEditorStore((s) => s.openTab);

  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return diagnostics.filter((d) => {
      if (mutedRuleIds.has(d.ruleId)) return false;
      if (filters.severity && !filters.severity.has(d.severity)) return false;
      if (filters.confidence && !filters.confidence.has(d.confidence)) return false;
      if (filters.inDiff && !d.introducedInCurrentDiff) return false;
      if (filters.autofixOnly && d.fixes.length === 0) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay =
          d.title.toLowerCase() +
          ' ' +
          d.message.toLowerCase() +
          ' ' +
          d.scope.toLowerCase() +
          ' ' +
          d.location.file.toLowerCase() +
          ' ' +
          d.ruleId.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [diagnostics, filters, mutedRuleIds, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Diagnostic[]>();
    for (const d of filtered) {
      const k = groupKey(d, groupBy);
      const arr = map.get(k);
      if (arr) arr.push(d);
      else map.set(k, [d]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  // Flat list mirroring visible (group-ordered) rows. Used for shift-range
  // selection so a range click respects the current ordering.
  const flatVisible = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  const handleCheckboxClick = (
    d: Diagnostic,
    e: React.MouseEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();
    if (e.shiftKey && lastClickedId) {
      const startIdx = flatVisible.findIndex((x) => x.id === lastClickedId);
      const endIdx = flatVisible.findIndex((x) => x.id === d.id);
      if (startIdx >= 0 && endIdx >= 0) {
        const [a, b] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const range = flatVisible.slice(a, b + 1).map((x) => x.id);
        const next = new Set(selectedIds);
        for (const id of range) next.add(id);
        selectMany(Array.from(next));
        setLastClickedId(d.id);
        return;
      }
    }
    toggleSelected(d.id);
    setLastClickedId(d.id);
  };

  const selectedDiagnostics = useMemo(
    () => diagnostics.filter((d) => selectedIds.has(d.id)),
    [diagnostics, selectedIds],
  );

  const onBulkApplyFix = () => {
    const fixable = selectedDiagnostics.filter((d) => d.fixes.length > 0);
    toast.success(`Apply ${fixable.length} fix${fixable.length === 1 ? '' : 'es'} (mock)`, {
      description:
        fixable.length < selectedDiagnostics.length
          ? `${selectedDiagnostics.length - fixable.length} selected without fixes — skipped`
          : undefined,
    });
    clearSelection();
  };

  const onBulkMuteRules = () => {
    const ruleIds = Array.from(new Set(selectedDiagnostics.map((d) => d.ruleId)));
    for (const id of ruleIds) muteRule(id);
    toast.success(`Muted ${ruleIds.length} rule${ruleIds.length === 1 ? '' : 's'}`, {
      description: ruleIds.slice(0, 3).join(', ') + (ruleIds.length > 3 ? '…' : ''),
    });
    clearSelection();
  };

  const onBulkMuteDiagnostics = () => {
    const count = selectedDiagnostics.length;
    for (const d of selectedDiagnostics) muteDiagnostic(d.id);
    toast.success(`Muted ${count} diagnostic${count === 1 ? '' : 's'}`);
    clearSelection();
  };

  const onBulkOpenAll = () => {
    const files = Array.from(new Set(selectedDiagnostics.map((d) => d.location.file)));
    for (const file of files) {
      openTab({ id: tabIdFor(file), file, label: tabLabelFor(file) });
    }
    toast.success(`Opened ${files.length} file${files.length === 1 ? '' : 's'}`);
  };

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const onRowClick = (d: Diagnostic) => {
    toggleRow(d.id);
    openTab({
      id: tabIdFor(d.location.file),
      file: d.location.file,
      label: tabLabelFor(d.location.file),
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <RscClientLeakDiagnostics />
      <PanelHeader>
        <SelectControl
          label="group"
          value={groupBy}
          options={GROUP_BY_OPTIONS}
          onChange={setGroupBy}
        />

        <div className="flex items-center gap-1">
          <span className="text-ink-3">sev:</span>
          {SEVERITY_OPTIONS.map((s) => (
            <ToggleChip
              key={s.value}
              active={filters.severity?.has(s.value) ?? false}
              onClick={() => toggleSeverity(s.value)}
              title={`Filter ${s.label}`}
            >
              {s.label}
            </ToggleChip>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-ink-3">conf:</span>
          {CONFIDENCE_OPTIONS.map((c) => (
            <ToggleChip
              key={c.value}
              active={filters.confidence?.has(c.value) ?? false}
              onClick={() => toggleConfidence(c.value)}
              title={`Confidence ${c.label}`}
            >
              <ConfidenceDot confidence={c.value} />
              {c.label}
            </ToggleChip>
          ))}
        </div>

        <ToggleChip
          active={filters.inDiff}
          onClick={toggleInDiff}
          title="Only diagnostics introduced in current diff"
        >
          IN-DIFF
        </ToggleChip>
        <ToggleChip
          active={filters.autofixOnly}
          onClick={toggleAutofixOnly}
          title="Only diagnostics with quick fixes"
        >
          AUTOFIX
        </ToggleChip>

        <ToggleChip
          active={selectMode}
          onClick={() => {
            setSelectMode((m) => {
              const next = !m;
              if (!next) {
                clearSelection();
                setLastClickedId(null);
              }
              return next;
            });
          }}
          title="Toggle multi-select mode"
        >
          <Icon.Filter className="h-3 w-3" />
          SELECT
        </ToggleChip>

        {selectMode && selectedIds.size > 0 ? (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-ink-2">
              <span className="font-mono text-ink-1">{selectedIds.size}</span> selected
            </span>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                clearSelection();
                setLastClickedId(null);
              }}
            >
              Clear
            </Button>
            <Button size="xs" tone="default" onClick={onBulkApplyFix}>
              <Icon.Bulb className="h-3 w-3" />
              Apply quick fix
            </Button>
            <Button size="xs" tone="ghost" onClick={onBulkMuteRules}>
              <Icon.X className="h-3 w-3" />
              Mute rules
            </Button>
            <Button size="xs" tone="ghost" onClick={onBulkMuteDiagnostics}>
              <Icon.X className="h-3 w-3" />
              Mute selected
            </Button>
            <Button size="xs" tone="ghost" onClick={onBulkOpenAll}>
              <Icon.UpRight className="h-3 w-3" />
              Open all
            </Button>
          </div>
        ) : (
          <div className="ml-auto w-48">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Filter problems"
            />
          </div>
        )}
      </PanelHeader>

      <ScrollArea className="flex-1">
        {groups.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            No problems matching filters.
          </div>
        ) : (
          <div className="text-sm">
            {groups.map(({ key, items }) => {
              const collapsed = collapsedGroups.has(key);
              return (
                <Fragment key={key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(key)}
                    className="flex h-7 w-full items-center gap-1.5 hairline-b bg-bg-subtle px-3 text-left text-xs font-medium text-ink-1 hover:bg-bg-hover"
                  >
                    {collapsed ? (
                      <Icon.ChevRight className="h-3.5 w-3.5 text-ink-3" />
                    ) : (
                      <Icon.ChevDown className="h-3.5 w-3.5 text-ink-3" />
                    )}
                    <span className="truncate font-mono">{key}</span>
                    <span className="ml-auto rounded-sm border border-line bg-bg px-1 text-[10px] font-semibold text-ink-2">
                      {items.length}
                    </span>
                  </button>

                  {!collapsed &&
                    items.map((d) => {
                      const expanded = expandedRows.has(d.id);
                      const checked = selectedIds.has(d.id);
                      return (
                        <Fragment key={d.id}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onRowClick(d)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onRowClick(d);
                              }
                            }}
                            className={cn(
                              'flex h-7 cursor-pointer items-center gap-2 hairline-b px-3 hover:bg-bg-hover',
                              expanded && 'bg-bg-subtle',
                              checked && 'bg-accent-soft/40',
                            )}
                          >
                            {selectMode ? (
                              <input
                                type="checkbox"
                                checked={checked}
                                aria-label={`Select diagnostic ${d.title}`}
                                onClick={(e) => handleCheckboxClick(d, e)}
                                onChange={() => {
                                  /* handled in onClick to support shift-click */
                                }}
                                className="h-3 w-3 shrink-0 cursor-pointer accent-accent"
                              />
                            ) : null}
                            <ConfidenceDot confidence={d.confidence} />
                            <SeverityLabel severity={d.severity} />
                            {d.introducedInCurrentDiff ? (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-accent"
                                aria-label="introduced in current diff"
                              />
                            ) : null}
                            <span className="truncate text-ink-1">{d.title}</span>
                            <span className="ml-auto truncate font-mono text-[11px] text-ink-3">
                              {d.location.file}:{d.location.line}
                            </span>
                            {expanded ? (
                              <Icon.ChevDown className="h-3 w-3 shrink-0 text-ink-3" />
                            ) : (
                              <Icon.ChevRight className="h-3 w-3 shrink-0 text-ink-3" />
                            )}
                          </div>

                          {expanded ? (
                            <DiagnosticInlineCard
                              d={d}
                              onShowTrace={() =>
                                openOverlay('evidenceTracer', { diagnosticId: d.id })
                              }
                              onQuickFix={() =>
                                toast(`Quick fix · ${d.title}`, {
                                  description:
                                    d.fixes[0]?.title ?? 'No fixes available',
                                })
                              }
                              onMute={() =>
                                toast(`Muted rule "${d.ruleId}"`, {
                                  description: 'Toggle in Settings → Rules',
                                })
                              }
                            />
                          ) : null}
                        </Fragment>
                      );
                    })}
                </Fragment>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface InlineProps {
  d: Diagnostic;
  onShowTrace(): void;
  onQuickFix(): void;
  onMute(): void;
}

function DiagnosticInlineCard({ d, onShowTrace, onQuickFix, onMute }: InlineProps) {
  return (
    <div className="hairline-b bg-bg-subtle px-3 py-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <section>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            Evidence
          </div>
          {d.evidence.length === 0 ? (
            <div className="text-xs text-ink-3">No evidence captured.</div>
          ) : (
            <ul className="flex flex-col gap-0.5 text-xs">
              {d.evidence.map((e) => (
                <li key={e.id} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      e.kind === 'direct' && 'bg-accent',
                      e.kind === 'indirect' && 'bg-sev-warn',
                      e.kind === 'heuristic' && 'bg-ink-3',
                    )}
                    aria-hidden
                  />
                  <span className="text-ink-1">{e.label}</span>
                  {e.location ? (
                    <span className="font-mono text-[11px] text-ink-3">
                      · {e.location.file}:{e.location.line}
                    </span>
                  ) : null}
                  <span className="ml-1 rounded-sm border border-line bg-bg px-1 text-[10px] uppercase tracking-caps text-ink-3">
                    {evidenceKindLabel(e.kind)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {d.impact.length > 0 ? (
            <>
              <div className="mb-1 mt-2 text-[10px] uppercase tracking-caps text-ink-3">
                Impact
              </div>
              <ul className="flex flex-col gap-0.5 text-xs text-ink-2">
                {d.impact.map((i, idx) => (
                  <li key={idx}>· {i}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section>
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            Actions
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="xs" tone="default" onClick={onShowTrace}>
              <Icon.Net className="h-3 w-3" />
              Show trace
            </Button>
            <Button size="xs" tone="soft" onClick={onQuickFix}>
              <Icon.Bulb className="h-3 w-3" />
              Quick fix
              <Icon.ChevDown className="h-3 w-3" />
            </Button>
            {/* Phase 6 — 23-1 / 23-3 */}
            <WhyBrokenButton diagnosticId={d.id} />
            <FixSafelyButton diagnosticId={d.id} />
            <Button size="xs" tone="ghost" onClick={onMute}>
              <Icon.X className="h-3 w-3" />
              Mute
              <Icon.ChevDown className="h-3 w-3" />
            </Button>
          </div>

          {d.fixes.length > 0 ? (
            <>
              <div className="mb-1 mt-2 text-[10px] uppercase tracking-caps text-ink-3">
                Available fixes
              </div>
              <ul className="flex flex-col gap-0.5 text-xs text-ink-2">
                {d.fixes.map((f) => (
                  <li key={f.id} className="flex items-baseline gap-1">
                    <span className="text-ink-3">·</span>
                    <span>{f.title}</span>
                    {f.description ? (
                      <span className="text-ink-3">— {f.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function RscClientLeakDiagnostics() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const modules = useMemo(() => analyzeClientModules(chunks), [chunks]);
  if (!url) return null;
  const userLeaks = modules.filter((m) => !m.isNextInternal && !m.isThirdParty);
  if (userLeaks.length === 0) return null;
  const totalBytes = userLeaks.reduce((s, m) => s + m.sizeBytes, 0);
  return (
    <div className="hairline-b border-b-2 border-edge/40 bg-edge/5 px-3 py-2 text-[11px]">
      <div className="mb-1 flex items-center gap-2">
        <Icon.Alert className="h-3 w-3 text-edge" />
        <span className="font-mono uppercase tracking-caps text-edge">
          probe · client component leaked
        </span>
        <span className="ml-auto font-mono text-ink-3">
          {url} · {userLeaks.length} module(s) · {totalBytes}B
        </span>
      </div>
      <div className="ml-5 space-y-0.5 font-mono text-ink-2">
        {userLeaks.map((m) => (
          <div key={m.id} className="truncate" title={m.modulePath}>
            <span className="text-ink-3">{m.id} </span>
            <span className="text-ink-1">{m.label}</span>
            <span className="text-ink-3"> ({m.sizeBytes}B) — {m.modulePath}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

