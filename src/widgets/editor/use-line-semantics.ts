import { useMemo } from 'react';
import type { Diagnostic, RenderingClass, Route } from '@shared/types';

export type LineKind =
  | 'dynamic-trigger'
  | 'use-client'
  | 'use-server'
  | 'fetch'
  | 'route-top'
  | 'function-decl'
  | 'plain';

export interface LineInfo {
  /** 1-based line number */
  line: number;
  text: string;
  kind: LineKind;
  /** ghost text shown after the line (semantic inlay) */
  ghost?: string;
  /** rough # of routes/files this line affects */
  blast?: number;
  /** classification mark for vertical sign bar */
  classMark?: 'static' | 'isr' | 'dynamic' | 'client' | 'server' | 'err' | 'warn';
}

export interface FileSemantics {
  lines: LineInfo[];
  /** strongest diagnostic per line (1-based) */
  diagnosticsByLine: Map<number, Diagnostic[]>;
  /** route info attached to this file (if any) */
  route?: Route;
}

const DYNAMIC_TRIGGERS = ['cookies()', 'cookies(', 'headers()', 'headers(', 'searchParams', 'draftMode('];
const SECRET_PATTERNS = ['STRIPE_SECRET', 'process.env'];

function detectKind(text: string): LineKind {
  const t = text.trim();
  if (t === '"use client"' || t === "'use client'") return 'use-client';
  if (t === "'use server'" || t === '"use server"') return 'use-server';
  if (DYNAMIC_TRIGGERS.some((p) => t.includes(p))) return 'dynamic-trigger';
  if (/\bfetch\s*\(/.test(t)) return 'fetch';
  if (/^export\s+(?:default\s+)?(?:async\s+)?function\b/.test(t)) return 'function-decl';
  return 'plain';
}

function pickGhost(line: string, kind: LineKind, route?: Route): string | undefined {
  if (kind === 'dynamic-trigger') return '→ dynamic';
  if (kind === 'use-client') return '↑ pulls files into client tree';
  if (kind === 'use-server') return 'server-only · action';
  if (kind === 'fetch') {
    const tag = route?.dataSources[0]?.cacheTags?.[0];
    const rev = route?.dataSources[0]?.revalidate ?? null;
    if (tag && rev) return `→ tag: ${tag} · rev ${rev}`;
    if (rev) return `→ revalidate ${rev}`;
    return '→ default cache · ⚠ stale risk?';
  }
  if (line.includes('notFound(')) return '→ throws NEXT_NOT_FOUND';
  if (line.includes('redirect(')) return '→ throws NEXT_REDIRECT';
  if (SECRET_PATTERNS.some((p) => line.includes(p))) return '⚠ secret-flow';
  return undefined;
}

function classMarkForKind(kind: LineKind, rendering: RenderingClass | undefined): LineInfo['classMark'] {
  if (kind === 'use-client') return 'client';
  if (kind === 'use-server') return 'server';
  if (kind === 'dynamic-trigger') return 'dynamic';
  if (kind === 'route-top') {
    if (rendering === 'isr') return 'isr';
    if (rendering === 'static') return 'static';
    if (rendering === 'dynamic') return 'dynamic';
  }
  return undefined;
}

function severityRank(s: Diagnostic['severity']): number {
  return s === 'err' ? 4 : s === 'warn' ? 3 : s === 'info' ? 2 : 1;
}

/**
 * Aggregate semantic info per line from raw source + diagnostics + route.
 * Pure derivation, memoized.
 */
export function useLineSemantics(
  source: string,
  file: string,
  diagnostics: Diagnostic[],
  route: Route | undefined,
): FileSemantics {
  return useMemo(() => {
    const rawLines = source.split('\n');
    const isRouteFile = !!route && (route.files.page === file || route.files.layout === file);

    const diagnosticsByLine = new Map<number, Diagnostic[]>();
    for (const d of diagnostics) {
      if (d.location.file !== file) continue;
      const arr = diagnosticsByLine.get(d.location.line) ?? [];
      arr.push(d);
      diagnosticsByLine.set(d.location.line, arr);
    }
    // sort each bucket strongest-first
    for (const arr of diagnosticsByLine.values()) {
      arr.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    }

    const lines: LineInfo[] = rawLines.map((text, idx) => {
      const lineNo = idx + 1;
      let kind: LineKind = detectKind(text);
      if (lineNo === 1 && isRouteFile) kind = 'route-top';

      const lineDx = diagnosticsByLine.get(lineNo) ?? [];
      const blast =
        kind === 'use-client' ? 38
          : kind === 'route-top' ? (route?.riskCount ?? 0) || (lineDx[0]?.affectedRouteIds?.length ?? 0)
          : lineDx[0]?.affectedRouteIds?.length ?? undefined;

      let classMark = classMarkForKind(kind, route?.rendering);
      const top = lineDx[0];
      if (!classMark && top) {
        if (top.severity === 'err' && top.confidence === 'high') classMark = 'err';
        else if (top.severity === 'warn') classMark = 'warn';
      }

      return {
        line: lineNo,
        text,
        kind,
        ghost: pickGhost(text, kind, route),
        blast,
        classMark,
      };
    });

    return { lines, diagnosticsByLine, route };
  }, [source, file, diagnostics, route]);
}
