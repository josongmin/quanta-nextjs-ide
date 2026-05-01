import { useMemo, useState } from 'react';
import { Chip, Icon, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useSchemaImpactStore } from './store';
import { MigrationCard } from './migration-card';
import type { ParsedField } from './parser';
import type { RiskSeverity } from './risk';

const TYPE_TONE: Record<string, string> = {
  String: 'text-sem-static',
  Int: 'text-accent',
  BigInt: 'text-accent',
  Float: 'text-accent',
  Boolean: 'text-sem-isr',
  DateTime: 'text-sem-server',
  Json: 'text-sem-edge',
};

const RISK_HEAD_TONE: Record<RiskSeverity, string> = {
  high: 'bg-sev-err/15 text-sev-err border-sev-err/40',
  medium: 'bg-sev-warn/15 text-sev-warn border-sev-warn/40',
  low: 'bg-sev-info/15 text-sev-info border-sev-info/40',
};

function FieldRow({ field }: { field: ParsedField }) {
  const baseType = field.type.replace(/[?\[\]]/g, '');
  const tone = TYPE_TONE[baseType] ?? 'text-ink-2';
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-1 text-[11px] hover:bg-bg-hover">
      <span className="truncate font-mono text-ink-1">{field.name}</span>
      <span className={cn('font-mono', tone)}>{field.type}</span>
      <span className="flex items-center gap-1">
        {field.isId ? (
          <Chip tone="info" size="xs">
            PK
          </Chip>
        ) : null}
        {field.isUnique ? (
          <Chip tone="muted" size="xs">
            unique
          </Chip>
        ) : null}
        {field.isRelation ? (
          <Chip tone="static" size="xs">
            FK
          </Chip>
        ) : null}
        {field.nullable ? (
          <span className="font-mono text-[10px] text-ink-3">?</span>
        ) : null}
      </span>
    </div>
  );
}

export function SchemaImpactPanel() {
  const after = useSchemaImpactStore((s) => s.after);
  const changes = useSchemaImpactStore((s) => s.changes);
  const risks = useSchemaImpactStore((s) => s.risks);
  const overall = useSchemaImpactStore((s) => s.overall());
  const selectedModel = useSchemaImpactStore((s) => s.selectedModel);
  const setSelectedModel = useSchemaImpactStore((s) => s.setSelectedModel);

  const [expandedChange, setExpandedChange] = useState<string | null>(
    changes[0]?.id ?? null,
  );

  const risksById = useMemo(() => {
    const m = new Map(risks.map((r) => [r.changeId, r]));
    return m;
  }, [risks]);

  const allAffected = useMemo(() => {
    const routes = new Set<string>();
    const actions = new Set<string>();
    for (const r of risks) {
      r.affectedRoutes.forEach((x) => routes.add(x));
      r.affectedActions.forEach((x) => actions.add(x));
    }
    return { routes: [...routes], actions: [...actions] };
  }, [risks]);

  return (
    <div className="flex h-full flex-col">
      <header
        className={cn(
          'flex items-center gap-3 border-b px-4 py-2 text-xs',
          RISK_HEAD_TONE[overall.severity],
        )}
      >
        <Icon.Alert className="h-4 w-4" />
        <div>
          <div className="text-[10px] uppercase tracking-caps">migration risk</div>
          <div className="text-sm font-semibold uppercase">{overall.severity}</div>
        </div>
        <span className="text-ink-2">{overall.reason}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {changes.length} change{changes.length === 1 ? '' : 's'}
        </span>
      </header>

      <div className="grid flex-1 grid-cols-[260px_1fr_280px] overflow-hidden">
        {/* Left: schema tree */}
        <div className="hairline-r flex flex-col bg-bg-subtle/40">
          <div className="flex h-7 items-center px-3 text-[10px] uppercase tracking-caps text-ink-3">
            schema
          </div>
          <ScrollArea className="flex-1">
            {after.models.map((m) => (
              <div key={m.name} className="border-t border-line/60 first:border-t-0">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedModel(selectedModel === m.name ? null : m.name)
                  }
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover',
                    selectedModel === m.name && 'bg-accent-soft',
                  )}
                >
                  <Icon.Database className="h-3 w-3 text-accent" />
                  <span className="font-medium text-ink-1">{m.name}</span>
                  <span className="ml-auto text-[10px] text-ink-3">
                    {m.fields.length}
                  </span>
                </button>
                {selectedModel === m.name ? (
                  <div className="bg-bg-subtle/30 py-1">
                    {m.fields.map((f) => (
                      <FieldRow key={f.name} field={f} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Middle: change list */}
        <div className="flex flex-col">
          <div className="flex h-7 items-center px-3 text-[10px] uppercase tracking-caps text-ink-3">
            pending changes ({changes.length})
          </div>
          <ScrollArea className="flex-1 px-2 py-2">
            <div className="flex flex-col gap-1.5">
              {changes.length === 0 ? (
                <div className="rounded-sm bg-bg-subtle/40 p-4 text-center text-xs text-ink-3">
                  No schema differences.
                </div>
              ) : (
                changes.map((c) => {
                  const r = risksById.get(c.id);
                  if (!r) return null;
                  return (
                    <MigrationCard
                      key={c.id}
                      change={c}
                      risk={r}
                      expanded={expandedChange === c.id}
                      onToggle={() =>
                        setExpandedChange(expandedChange === c.id ? null : c.id)
                      }
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: impact graph */}
        <div className="hairline-l flex flex-col bg-bg-subtle/30">
          <div className="flex h-7 items-center px-3 text-[10px] uppercase tracking-caps text-ink-3">
            impact graph
          </div>
          <ScrollArea className="flex-1 px-3 py-2 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                routes ({allAffected.routes.length})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {allAffected.routes.length === 0 ? (
                  <span className="text-[11px] text-ink-3">— none —</span>
                ) : (
                  allAffected.routes.map((r) => (
                    <Chip key={r} tone="info" size="xs">
                      /{r}
                    </Chip>
                  ))
                )}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                server actions ({allAffected.actions.length})
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {allAffected.actions.length === 0 ? (
                  <span className="text-[11px] text-ink-3">— none —</span>
                ) : (
                  allAffected.actions.map((a) => (
                    <code
                      key={a}
                      className="block truncate font-mono text-[11px] text-ink-2"
                    >
                      {a}
                    </code>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default SchemaImpactPanel;
