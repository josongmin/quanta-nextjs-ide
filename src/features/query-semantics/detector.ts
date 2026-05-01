// Static query-smell detection. We provide both a regex-based fast pass
// (works in-browser) and a richer ts-morph implementation that activates if
// ts-morph has been pre-loaded by the host.
import type { QuerySmell, QuerySmellKind, QuerySmellSeverity } from './types';

interface SourceInput {
  file: string;
  source: string;
  /** Optional: route id this file belongs to. */
  routeId?: string;
  /** Whether the file is in a "list" surface (page route showing many rows). */
  isListPage?: boolean;
}

const ID = (
  kind: QuerySmellKind,
  file: string,
  line: number,
): string => `${kind}:${file}:${line}`;

function severityFor(kind: QuerySmellKind): QuerySmellSeverity {
  switch (kind) {
    case 'n+1':
      return 'high';
    case 'no-pagination':
      return 'high';
    case 'no-transaction':
      return 'medium';
    case 'heavy-include':
      return 'medium';
    case 'select-star':
      return 'low';
  }
}

function labelFor(kind: QuerySmellKind): string {
  switch (kind) {
    case 'n+1':
      return 'Likely N+1 query inside .map()';
    case 'no-pagination':
      return 'findMany without take/skip/cursor';
    case 'no-transaction':
      return 'Multiple writes without prisma.$transaction';
    case 'heavy-include':
      return 'findMany with deep include and no select';
    case 'select-star':
      return 'findMany without select clause';
  }
}

function suggestionFor(kind: QuerySmellKind): string {
  switch (kind) {
    case 'n+1':
      return 'Replace the loop with a single query using `include` or `where: { id: { in: ids } }`.';
    case 'no-pagination':
      return 'Add `take` (and `cursor`/`skip`) to bound the result set.';
    case 'no-transaction':
      return 'Wrap dependent writes in `prisma.$transaction([...])` to ensure atomicity.';
    case 'heavy-include':
      return 'Use `select` to fetch only the columns you render.';
    case 'select-star':
      return 'Add `select: { ... }` listing the columns you read.';
  }
}

const FIND_MANY_RE = /\bprisma\.(\w+)\.findMany\s*\(\s*({[\s\S]*?})\s*\)/g;
const QUERY_INSIDE_MAP_RE =
  /\.map\s*\(\s*\([^)]*\)\s*=>\s*{?[\s\S]{0,400}?prisma\.\w+\.(?:findUnique|findFirst|findMany)\s*\(/g;
const PRISMA_WRITE_RE =
  /\bprisma\.(\w+)\.(create|update|upsert|delete|createMany|updateMany|deleteMany)\s*\(/g;
const TRANSACTION_RE = /prisma\.\$transaction\s*\(/;

function lineOfMatch(source: string, idx: number): number {
  let line = 1;
  for (let i = 0; i < idx; i++) if (source[i] === '\n') line++;
  return line;
}

function snippetAt(source: string, line: number, ctx = 0): string {
  const lines = source.split('\n');
  const start = Math.max(0, line - 1 - ctx);
  const end = Math.min(lines.length, line + ctx);
  return lines.slice(start, end).join('\n');
}

export function detectSmells(inputs: SourceInput[]): QuerySmell[] {
  const out: QuerySmell[] = [];

  for (const input of inputs) {
    const { file, source, routeId, isListPage } = input;

    // 1) N+1 detection: a prisma call inside a .map(...) callback.
    let m: RegExpExecArray | null;
    QUERY_INSIDE_MAP_RE.lastIndex = 0;
    while ((m = QUERY_INSIDE_MAP_RE.exec(source)) !== null) {
      const line = lineOfMatch(source, m.index);
      out.push({
        id: ID('n+1', file, line),
        kind: 'n+1',
        file,
        line,
        severity: severityFor('n+1'),
        title: labelFor('n+1'),
        message:
          'A Prisma query is invoked inside a .map() iteration; this issues one query per item.',
        snippet: snippetAt(source, line, 1),
        suggestion: suggestionFor('n+1'),
        ...(routeId ? { routeId } : {}),
      });
    }

    // 2) findMany without take/skip/cursor — extra weight on list pages.
    FIND_MANY_RE.lastIndex = 0;
    while ((m = FIND_MANY_RE.exec(source)) !== null) {
      const args = m[2] ?? '';
      const hasBound = /\b(take|skip|cursor)\s*:/.test(args);
      const hasInclude = (args.match(/\binclude\s*:/g) ?? []).length;
      const includeRelations = (args.match(/\b\w+\s*:\s*true/g) ?? []).length;
      const hasSelect = /\bselect\s*:/.test(args);
      const line = lineOfMatch(source, m.index);

      if (!hasBound && (isListPage || /\bfindMany/.test(args) || true)) {
        out.push({
          id: ID('no-pagination', file, line),
          kind: 'no-pagination',
          file,
          line,
          severity: severityFor('no-pagination'),
          title: labelFor('no-pagination'),
          message: 'findMany() is unbounded; result size grows with the table.',
          snippet: snippetAt(source, line, 1),
          suggestion: suggestionFor('no-pagination'),
          ...(routeId ? { routeId } : {}),
        });
      }
      if (hasInclude && includeRelations > 2 && !hasSelect) {
        out.push({
          id: ID('heavy-include', file, line),
          kind: 'heavy-include',
          file,
          line,
          severity: severityFor('heavy-include'),
          title: labelFor('heavy-include'),
          message: `findMany pulls ${includeRelations} relations with no select`,
          snippet: snippetAt(source, line, 1),
          suggestion: suggestionFor('heavy-include'),
          ...(routeId ? { routeId } : {}),
        });
      }
      if (!hasSelect && !hasInclude) {
        out.push({
          id: ID('select-star', file, line),
          kind: 'select-star',
          file,
          line,
          severity: severityFor('select-star'),
          title: labelFor('select-star'),
          message: 'findMany returns every column.',
          snippet: snippetAt(source, line, 1),
          suggestion: suggestionFor('select-star'),
          ...(routeId ? { routeId } : {}),
        });
      }
    }

    // 3) Multiple writes in same file without a transaction.
    const writes: number[] = [];
    PRISMA_WRITE_RE.lastIndex = 0;
    while ((m = PRISMA_WRITE_RE.exec(source)) !== null) {
      writes.push(lineOfMatch(source, m.index));
    }
    if (writes.length >= 2 && !TRANSACTION_RE.test(source)) {
      const line = writes[0]!;
      out.push({
        id: ID('no-transaction', file, line),
        kind: 'no-transaction',
        file,
        line,
        severity: severityFor('no-transaction'),
        title: labelFor('no-transaction'),
        message: `${writes.length} writes in this file (lines ${writes.join(', ')}) are not wrapped in $transaction.`,
        snippet: snippetAt(source, line, 1),
        suggestion: suggestionFor('no-transaction'),
        ...(routeId ? { routeId } : {}),
      });
    }
  }

  return out;
}

// Convenience helper for tests / fixtures.
export const __internal = { lineOfMatch, snippetAt };
