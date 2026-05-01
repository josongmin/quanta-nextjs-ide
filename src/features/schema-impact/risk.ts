import type { SchemaChange, SchemaChangeKind } from './diff';
import type { FieldUsage } from './usage-finder';

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface BreakingUsage {
  file: string;
  line: number;
  reason: string;
  snippet: string;
}

export interface ChangeRisk {
  changeId: string;
  kind: SchemaChangeKind;
  severity: RiskSeverity;
  affectedRoutes: string[];
  affectedActions: string[];
  breaks: BreakingUsage[];
  mitigation: string;
}

const ROUTE_HINT = /(?:app|src\/app)\/(.*?)\/(?:page|route)\.(?:tsx?|jsx?)/;
const ACTION_HINT = /(actions|server-actions)\.(?:tsx?|jsx?)/;

function classifyFile(file: string): { route?: string; action?: string } {
  const route = ROUTE_HINT.exec(file);
  if (route?.[1]) return { route: route[1] };
  if (ACTION_HINT.test(file)) return { action: file };
  return {};
}

const MITIGATION: Record<SchemaChangeKind, string> = {
  'model-added': 'New model: review seeds + access policies before deploying.',
  'model-removed':
    'Drop in a separate migration after callers stop reading. Archive table first.',
  'field-added':
    'Provide a default OR backfill before marking required. Run in 3 stages: add nullable → backfill → tighten.',
  'field-removed':
    'Three-stage drop: deprecate reads, dual-write, then drop. Update every reader first.',
  'field-renamed':
    'Add new field, dual-write, copy data, switch readers, drop old. Avoid single-step rename.',
  'field-type-changed':
    'Convert in-place may corrupt data. Add new column with new type, backfill, swap.',
  'field-nullability-changed':
    'If nullable→required: backfill defaults first, then tighten. If required→nullable: update readers.',
  'field-constraint-changed':
    'Validate index/uniqueness against existing data before rollout to avoid migration failures.',
};

function severityFor(
  kind: SchemaChangeKind,
  hits: number,
): RiskSeverity {
  if (kind === 'field-removed' || kind === 'model-removed') return 'high';
  if (kind === 'field-type-changed') return 'high';
  if (kind === 'field-nullability-changed') return hits > 0 ? 'high' : 'medium';
  if (kind === 'field-renamed') return 'high';
  if (kind === 'field-constraint-changed') return 'medium';
  if (kind === 'field-added') return 'low';
  if (kind === 'model-added') return 'low';
  return 'medium';
}

function reasonFor(
  change: SchemaChange,
  usage: FieldUsage,
): string {
  switch (change.kind) {
    case 'field-removed':
      return `Reads ${change.model}.${change.field} — will be undefined after removal.`;
    case 'field-renamed':
      return `Refers to old name '${change.before}', rename to '${change.after}'.`;
    case 'field-type-changed':
      return `Assignment may fail: type ${change.before} → ${change.after}.`;
    case 'field-nullability-changed':
      return change.after === 'nullable'
        ? `Read needs null-check after change.`
        : `Read assumes value but field newly required (must backfill).`;
    case 'field-constraint-changed':
      return `Constraint change (id/unique) — validate uniqueness invariants.`;
    default:
      return usage.kind;
  }
}

export function computeRisks(
  changes: SchemaChange[],
  usages: FieldUsage[],
): ChangeRisk[] {
  const risks: ChangeRisk[] = [];
  for (const change of changes) {
    if (!change.field) {
      risks.push({
        changeId: change.id,
        kind: change.kind,
        severity: severityFor(change.kind, 0),
        affectedRoutes: [],
        affectedActions: [],
        breaks: [],
        mitigation: MITIGATION[change.kind],
      });
      continue;
    }
    const matches = usages.filter(
      (u) =>
        u.modelName.toLowerCase() === change.model.toLowerCase() &&
        (u.fieldName === change.field || u.fieldName === change.before),
    );
    const breaks: BreakingUsage[] = matches.map((u) => ({
      file: u.file,
      line: u.line,
      reason: reasonFor(change, u),
      snippet: u.snippet,
    }));
    const routes = new Set<string>();
    const actions = new Set<string>();
    for (const u of matches) {
      const cls = classifyFile(u.file);
      if (cls.route) routes.add(cls.route);
      if (cls.action) actions.add(cls.action);
    }
    risks.push({
      changeId: change.id,
      kind: change.kind,
      severity: severityFor(change.kind, matches.length),
      affectedRoutes: [...routes],
      affectedActions: [...actions],
      breaks,
      mitigation: MITIGATION[change.kind],
    });
  }
  return risks;
}

export function overallRisk(risks: ChangeRisk[]): RiskSeverity {
  if (risks.some((r) => r.severity === 'high')) return 'high';
  if (risks.some((r) => r.severity === 'medium')) return 'medium';
  return 'low';
}

export function overallReason(risks: ChangeRisk[]): string {
  const highs = risks.filter((r) => r.severity === 'high');
  if (highs.length > 0) {
    return `${highs.length} high-risk change${highs.length === 1 ? '' : 's'} (e.g. ${highs[0]!.kind}).`;
  }
  const meds = risks.filter((r) => r.severity === 'medium');
  if (meds.length > 0) return `${meds.length} medium-risk change${meds.length === 1 ? '' : 's'}.`;
  return 'No breaking changes detected.';
}
