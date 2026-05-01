import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useDiagnosticStore } from '@entities/diagnostic';
import type { Confidence, Diagnostic, Severity } from '@shared/types';
import {
  Button,
  Chip,
  ConfidenceDot,
  Icon,
  ScrollArea,
  SeverityLabel,
  Switch,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';

type SortKey = 'rule' | 'category' | 'severity' | 'confidence' | 'hits';
type SortDir = 'asc' | 'desc';

interface RuleRow {
  ruleId: string;
  category: Diagnostic['category'];
  defaultSeverity: Severity;
  effectiveSeverity: Severity;
  hasOverride: boolean;
  defaultConfidence: Confidence;
  hits: number;
  title: string;
  muted: boolean;
}

const SEVERITY_OPTIONS: ReadonlyArray<{ value: Severity; label: string }> = [
  { value: 'err', label: 'err' },
  { value: 'warn', label: 'warn' },
  { value: 'info', label: 'info' },
  { value: 'hint', label: 'hint' },
];

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

function mostCommon<T extends string>(values: T[]): T {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T = values[0]!;
  let bestCount = -1;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

function compareRows(a: RuleRow, b: RuleRow, key: SortKey, dir: SortDir): number {
  const sign = dir === 'asc' ? 1 : -1;
  const cmp = match(key)
    .with('rule', () => a.ruleId.localeCompare(b.ruleId))
    .with('category', () => a.category.localeCompare(b.category))
    .with('severity', () => {
      const order: Record<Severity, number> = { err: 4, warn: 3, info: 2, hint: 1 };
      return order[a.effectiveSeverity] - order[b.effectiveSeverity];
    })
    .with('confidence', () => CONFIDENCE_RANK[a.defaultConfidence] - CONFIDENCE_RANK[b.defaultConfidence])
    .with('hits', () => a.hits - b.hits)
    .exhaustive();
  return cmp * sign;
}

function HeaderCell({
  label,
  sortKey,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick(k: SortKey): void;
  className?: string;
}) {
  const isActive = active === sortKey;
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 text-left text-[10px] uppercase tracking-caps text-ink-3 hover:text-ink-1',
        isActive && 'text-ink-1',
        className,
      )}
    >
      {label}
      {isActive ? (
        dir === 'asc' ? (
          <Icon.Up className="h-3 w-3" />
        ) : (
          <Icon.Down className="h-3 w-3" />
        )
      ) : null}
    </button>
  );
}

export function RuleManagerSection() {
  const diagnostics = useDiagnosticStore((s) => s.diagnostics);
  const mutedRuleIds = useDiagnosticStore((s) => s.mutedRuleIds);
  const ruleSeverityOverrides = useDiagnosticStore((s) => s.ruleSeverityOverrides);
  const muteRule = useDiagnosticStore((s) => s.muteRule);
  const unmuteRule = useDiagnosticStore((s) => s.unmuteRule);
  const setRuleSeverity = useDiagnosticStore((s) => s.setRuleSeverity);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('hits');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo<RuleRow[]>(() => {
    const grouped = new Map<string, Diagnostic[]>();
    for (const d of diagnostics) {
      const arr = grouped.get(d.ruleId);
      if (arr) arr.push(d);
      else grouped.set(d.ruleId, [d]);
    }
    const out: RuleRow[] = [];
    for (const [ruleId, items] of grouped) {
      const defaultSeverity = mostCommon(items.map((d) => d.severity));
      const override = ruleSeverityOverrides[ruleId];
      const effectiveSeverity = override ?? defaultSeverity;
      out.push({
        ruleId,
        category: items[0]!.category,
        defaultSeverity,
        effectiveSeverity,
        hasOverride: Boolean(override),
        defaultConfidence: mostCommon(items.map((d) => d.confidence)),
        hits: items.length,
        title: items[0]!.title,
        muted: mutedRuleIds.has(ruleId),
      });
    }
    return out;
  }, [diagnostics, mutedRuleIds, ruleSeverityOverrides]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.ruleId} ${r.category} ${r.title}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const sorted = useMemo(() => {
    const copy = filtered.slice();
    copy.sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return copy;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir(k === 'rule' || k === 'category' ? 'asc' : 'desc');
    }
  };

  const mutedCount = rows.filter((r) => r.muted).length;
  const overrideCount = Object.keys(ruleSeverityOverrides).length;

  const handleResetAll = () => {
    if (mutedCount === 0 && overrideCount === 0) {
      toast('Nothing to reset', { description: 'No mutes or overrides set.' });
      return;
    }
    for (const id of Array.from(mutedRuleIds)) unmuteRule(id);
    for (const id of Object.keys(ruleSeverityOverrides)) setRuleSeverity(id, null);
    toast.success('All rules reset', {
      description: `${mutedCount} mute${mutedCount === 1 ? '' : 's'} · ${overrideCount} override${overrideCount === 1 ? '' : 's'} cleared`,
    });
  };

  return (
    <div className="flex h-[60vh] min-h-[420px] flex-col">
      <div className="flex shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <div className="flex h-6 min-w-0 flex-1 items-center gap-1 rounded-sm border border-line bg-bg px-1.5">
          <Icon.Search className="h-3 w-3 shrink-0 text-ink-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rule id, category, or title"
            className="min-w-0 flex-1 bg-transparent text-xs text-ink-1 placeholder:text-ink-3 focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              className="text-ink-3 hover:text-ink-1"
              onClick={() => setSearch('')}
            >
              <Icon.X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <span className="text-[11px] text-ink-3">{sorted.length} rules</span>
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(220px,1.6fr)_100px_90px_80px_60px_70px_120px] items-center gap-2 hairline-b bg-bg-subtle px-3 py-1.5">
        <HeaderCell label="Rule" sortKey="rule" active={sortKey} dir={sortDir} onClick={handleSort} />
        <HeaderCell label="Category" sortKey="category" active={sortKey} dir={sortDir} onClick={handleSort} />
        <HeaderCell label="Severity" sortKey="severity" active={sortKey} dir={sortDir} onClick={handleSort} />
        <HeaderCell label="Conf" sortKey="confidence" active={sortKey} dir={sortDir} onClick={handleSort} />
        <HeaderCell label="Hits" sortKey="hits" active={sortKey} dir={sortDir} onClick={handleSort} className="justify-self-end" />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Muted</span>
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Override</span>
      </div>

      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            No rules match the search.
          </div>
        ) : (
          <div>
            {sorted.map((r) => (
              <div
                key={r.ruleId}
                className={cn(
                  'grid grid-cols-[minmax(220px,1.6fr)_100px_90px_80px_60px_70px_120px] items-center gap-2 hairline-b px-3 py-1.5 text-xs',
                  r.muted && 'bg-bg-subtle/60',
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('truncate font-mono', r.muted ? 'text-ink-3 line-through' : 'text-ink-1')}>
                      {r.ruleId}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-ink-3">{r.title}</div>
                </div>

                <div>
                  <Chip tone="muted" size="xs" className="font-normal normal-case tracking-normal">
                    {r.category}
                  </Chip>
                </div>

                <div className="flex items-center gap-1">
                  <SeverityLabel severity={r.effectiveSeverity} />
                  {r.hasOverride ? (
                    <span
                      title={`default: ${r.defaultSeverity}`}
                      className="rounded-sm border border-accent/30 bg-accent-soft px-1 text-[9px] font-semibold uppercase tracking-caps text-accent"
                    >
                      ovr
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1 text-ink-2">
                  <ConfidenceDot confidence={r.defaultConfidence} />
                  <span className="text-[11px] uppercase">{r.defaultConfidence}</span>
                </div>

                <div className="justify-self-end font-mono text-ink-1">{r.hits}</div>

                <div>
                  <Switch
                    size="sm"
                    checked={r.muted}
                    onCheckedChange={(next) => {
                      if (!next) {
                        unmuteRule(r.ruleId);
                        toast(`Unmuted ${r.ruleId}`);
                      } else {
                        muteRule(r.ruleId);
                        toast.success(`Muted ${r.ruleId}`);
                      }
                    }}
                    label={r.muted ? 'Unmute rule' : 'Mute rule'}
                  />
                </div>

                <div>
                  <select
                    value={ruleSeverityOverrides[r.ruleId] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setRuleSeverity(r.ruleId, null);
                        toast(`Override cleared`, { description: r.ruleId });
                      } else {
                        setRuleSeverity(r.ruleId, v as Severity);
                        toast.success(`Severity → ${v}`, { description: r.ruleId });
                      }
                    }}
                    className="h-6 w-full rounded-sm border border-line bg-bg px-1 text-[11px] text-ink-1 focus:outline-2 focus:outline-accent"
                  >
                    <option value="">default</option>
                    {SEVERITY_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex shrink-0 items-center gap-2 hairline-t bg-bg-subtle px-3 py-2 text-[11px] text-ink-3">
        <span>
          <span className="text-ink-1">{mutedCount}</span> muted
        </span>
        <span>·</span>
        <span>
          <span className="text-ink-1">{overrideCount}</span> overrides
        </span>
        <span>·</span>
        <span>
          <span className="text-ink-1">{rows.length}</span> rules total
        </span>
        <Button size="xs" tone="ghost" className="ml-auto" onClick={handleResetAll}>
          <Icon.Refresh className="h-3 w-3" />
          Reset all
        </Button>
      </div>
    </div>
  );
}
