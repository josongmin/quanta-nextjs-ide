/**
 * Pure detector that combines multiple analyzer signals into a single
 * de-duplicated array of `CauseGlyph` for the open file.
 *
 * Inputs are analyzer-shaped (so the function works in tests without a
 * worker round-trip), but at runtime the hook (`useCauseGlyphs`) calls
 * the analyzers itself and threads the results in.
 *
 * Strict zero-false-positive guard: every glyph carries `confidence`, and
 * the renderer only paints `high`/`medium` by default.
 */

import type {
  CauseGlyph,
  CauseKind,
  DetectorStores,
  GlyphConfidence,
  GlyphSeverity,
} from './types';

interface DirectiveFindingLike {
  file: string;
  kind: 'use-client' | 'use-server';
  line: number;
}

interface UseCacheFindingLike {
  file: string;
  line: number;
  kind: 'has-directive' | 'candidate' | 'unsafe';
  scope: 'file' | 'function';
  reason?: string;
}

interface TaintPathLike {
  source: { file: string; expr: string; node: { file: string; line: number } };
  confidence: GlyphConfidence;
}

export interface DetectorInput {
  file: string;
  source: string;
  /** Findings from `analyzeUseClientServer` filtered to this file. */
  directives?: ReadonlyArray<DirectiveFindingLike>;
  /** Findings from `analyzeUseCache` filtered to this file. */
  cacheFindings?: ReadonlyArray<UseCacheFindingLike>;
  /** TaintPaths whose source is in this file. */
  taintPaths?: ReadonlyArray<TaintPathLike>;
  /** All directive findings across the corpus, used for client-leak source detection. */
  allDirectives?: ReadonlyArray<DirectiveFindingLike>;
  stores?: DetectorStores;
}

const SECRET_RE = /process\.env\.([A-Z][A-Z0-9_]*)/g;
const SECRET_NAME_RE = /(SECRET|TOKEN|KEY|PASSWORD|PRIVATE|API)/i;

const REVALIDATE_FN_RE = /\b(revalidateTag|revalidatePath)\s*\(/g;
const CACHE_TAG_RE = /\b(cacheTag|cacheLife)\s*\(/g;
const NO_STORE_RE = /\bnoStore\s*\(\s*\)/g;
const FORCE_DYNAMIC_RE = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/;
const REVALIDATE_ZERO_RE = /export\s+const\s+revalidate\s*=\s*0\b/;
const REVALIDATE_POSITIVE_RE = /export\s+const\s+revalidate\s*=\s*(\d+)\b/;
const COOKIES_HEADERS_RE = /\b(cookies|headers|draftMode)\s*\(\s*\)/g;
const SEARCH_PARAMS_RE = /\bsearchParams\b/;

const SERVER_ONLY_IMPORTS = [
  'fs',
  'fs/promises',
  'node:fs',
  'node:fs/promises',
  'node:child_process',
  'node:net',
  'node:dns',
  'next/headers',
  'server-only',
];

function uniqLines(glyphs: CauseGlyph[]): CauseGlyph[] {
  // Stable de-dupe: prefer higher severity / higher confidence per (line, kind).
  const sevRank: Record<GlyphSeverity, number> = { err: 0, warn: 1, info: 2 };
  const confRank: Record<GlyphConfidence, number> = { high: 0, medium: 1, low: 2 };
  const map = new Map<string, CauseGlyph>();
  for (const g of glyphs) {
    const k = `${g.line}:${g.kind}`;
    const prev = map.get(k);
    if (
      !prev ||
      sevRank[g.severity] < sevRank[prev.severity] ||
      (sevRank[g.severity] === sevRank[prev.severity] &&
        confRank[g.confidence] < confRank[prev.confidence])
    ) {
      map.set(k, g);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.line - b.line);
}

function looksLikeRouteFile(file: string): boolean {
  return /\/(page|layout|route|template|loading|error|default)\.(t|j)sx?$/.test(file);
}

function lineIsClientFile(
  file: string,
  directives?: ReadonlyArray<DirectiveFindingLike>,
): boolean {
  return Boolean(directives?.some((d) => d.file === file && d.kind === 'use-client'));
}

function isServerOnlyModule(spec: string, allDirectives?: ReadonlyArray<DirectiveFindingLike>): boolean {
  if (SERVER_ONLY_IMPORTS.includes(spec)) return true;
  // Relative import to a file marked 'use server' = server-only.
  if (spec.startsWith('.')) {
    return Boolean(allDirectives?.some((d) => d.kind === 'use-server' && d.file.endsWith(spec.replace(/^\.\.?\//, ''))));
  }
  return false;
}

function detectStaticSafe(file: string, source: string): CauseGlyph[] {
  if (!looksLikeRouteFile(file)) return [];
  const out: CauseGlyph[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? '';
    const m = REVALIDATE_POSITIVE_RE.exec(ln);
    if (m && m[1] && Number(m[1]) > 0) {
      out.push({
        id: `static-safe:${file}:${i + 1}`,
        line: i + 1,
        kind: 'static-safe',
        severity: 'info',
        confidence: 'high',
        message: `Static-safe — \`revalidate = ${m[1]}\` enables ISR for this route.`,
        evidence: ln.trim(),
      });
    }
  }
  return out;
}

function detectDynamicTriggers(file: string, source: string): CauseGlyph[] {
  const out: CauseGlyph[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? '';
    const lineNo = i + 1;

    if (FORCE_DYNAMIC_RE.test(ln)) {
      out.push({
        id: `dyn:force:${file}:${lineNo}`,
        line: lineNo,
        kind: 'dynamic-trigger',
        severity: 'warn',
        confidence: 'high',
        message: '`dynamic = "force-dynamic"` opts this route out of all caching.',
        evidence: ln.trim(),
      });
      continue;
    }
    if (REVALIDATE_ZERO_RE.test(ln)) {
      out.push({
        id: `dyn:rev0:${file}:${lineNo}`,
        line: lineNo,
        kind: 'dynamic-trigger',
        severity: 'warn',
        confidence: 'high',
        message: '`revalidate = 0` is equivalent to `force-dynamic`.',
        evidence: ln.trim(),
      });
      continue;
    }

    let m: RegExpExecArray | null;
    COOKIES_HEADERS_RE.lastIndex = 0;
    while ((m = COOKIES_HEADERS_RE.exec(ln))) {
      out.push({
        id: `dyn:${m[1]}:${file}:${lineNo}:${m.index}`,
        line: lineNo,
        kind: 'dynamic-trigger',
        severity: 'warn',
        confidence: 'high',
        message: `\`${m[1]}()\` forces dynamic rendering. Remove to recover ISR.`,
        evidence: ln.trim(),
      });
    }
    NO_STORE_RE.lastIndex = 0;
    if (NO_STORE_RE.test(ln)) {
      out.push({
        id: `dyn:noStore:${file}:${lineNo}`,
        line: lineNo,
        kind: 'dynamic-trigger',
        severity: 'warn',
        confidence: 'high',
        message: '`noStore()` opts this segment out of caching.',
        evidence: ln.trim(),
      });
    }
    if (SEARCH_PARAMS_RE.test(ln) && looksLikeRouteFile(file)) {
      out.push({
        id: `dyn:searchParams:${file}:${lineNo}`,
        line: lineNo,
        kind: 'dynamic-trigger',
        severity: 'info',
        confidence: 'medium',
        message: '`searchParams` access marks this route as dynamic.',
        evidence: ln.trim(),
      });
    }
  }
  return out;
}

function detectCacheMutations(file: string, source: string): CauseGlyph[] {
  const out: CauseGlyph[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? '';
    const lineNo = i + 1;
    let m: RegExpExecArray | null;
    REVALIDATE_FN_RE.lastIndex = 0;
    while ((m = REVALIDATE_FN_RE.exec(ln))) {
      out.push({
        id: `cm:${m[1]}:${file}:${lineNo}:${m.index}`,
        line: lineNo,
        kind: 'cache-mutation',
        severity: 'info',
        confidence: 'high',
        message: `\`${m[1]}()\` invalidates Next.js cache entries.`,
        evidence: ln.trim(),
      });
    }
    CACHE_TAG_RE.lastIndex = 0;
    while ((m = CACHE_TAG_RE.exec(ln))) {
      out.push({
        id: `cm:${m[1]}:${file}:${lineNo}:${m.index}`,
        line: lineNo,
        kind: 'cache-mutation',
        severity: 'info',
        confidence: 'high',
        message: `\`${m[1]}()\` attaches a cache tag for downstream invalidation.`,
        evidence: ln.trim(),
      });
    }
  }
  return out;
}

function detectClientLeakSources(
  file: string,
  source: string,
  directives?: ReadonlyArray<DirectiveFindingLike>,
  allDirectives?: ReadonlyArray<DirectiveFindingLike>,
): CauseGlyph[] {
  if (!lineIsClientFile(file, directives)) return [];
  const out: CauseGlyph[] = [];
  const lines = source.split('\n');
  // crude import line scan
  const IMPORT_RE = /^\s*import\b[^'"]*['"]([^'"]+)['"]/;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? '';
    const m = IMPORT_RE.exec(ln);
    if (!m) continue;
    const spec = m[1];
    if (!spec) continue;
    if (isServerOnlyModule(spec, allDirectives)) {
      out.push({
        id: `leak:${file}:${i + 1}`,
        line: i + 1,
        kind: 'client-leak-source',
        severity: 'err',
        confidence: 'high',
        message: `Server-only module \`${spec}\` imported into a \`'use client'\` file.`,
        evidence: ln.trim(),
      });
    }
  }
  return out;
}

function detectSecretFlows(
  file: string,
  source: string,
  taintPaths?: ReadonlyArray<TaintPathLike>,
): CauseGlyph[] {
  const out: CauseGlyph[] = [];
  // From taint solver: high-signal paths.
  for (const p of taintPaths ?? []) {
    if (p.source.file !== file) continue;
    if (!SECRET_NAME_RE.test(p.source.expr)) continue;
    out.push({
      id: `secret:${file}:${p.source.node.line}:${p.source.expr}`,
      line: p.source.node.line,
      kind: 'secret-flow',
      severity: 'err',
      confidence: p.confidence,
      message: `Secret \`${p.source.expr}\` flows from this line.`,
      evidence: p.source.expr,
    });
  }
  // Regex fallback when solver hasn't fired.
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i] ?? '';
    let m: RegExpExecArray | null;
    SECRET_RE.lastIndex = 0;
    while ((m = SECRET_RE.exec(ln))) {
      const name = m[1] ?? '';
      if (!SECRET_NAME_RE.test(name)) continue;
      out.push({
        id: `secret:fallback:${file}:${i + 1}:${name}`,
        line: i + 1,
        kind: 'secret-flow',
        severity: 'err',
        confidence: 'medium',
        message: `\`process.env.${name}\` looks like a secret.`,
        evidence: ln.trim(),
      });
    }
  }
  return out;
}

export function detectCauses(input: DetectorInput): CauseGlyph[] {
  const { file, source, directives, taintPaths, allDirectives } = input;
  const all: CauseGlyph[] = [
    ...detectStaticSafe(file, source),
    ...detectDynamicTriggers(file, source),
    ...detectCacheMutations(file, source),
    ...detectClientLeakSources(file, source, directives, allDirectives),
    ...detectSecretFlows(file, source, taintPaths),
  ];
  return uniqLines(all);
}

/**
 * Returns a per-kind count map; used by the legend.
 */
export function tallyByKind(glyphs: ReadonlyArray<CauseGlyph>): Record<CauseKind, number> {
  const out: Record<CauseKind, number> = {
    'static-safe': 0,
    'dynamic-trigger': 0,
    'cache-mutation': 0,
    'client-leak-source': 0,
    'secret-flow': 0,
  };
  for (const g of glyphs) out[g.kind] += 1;
  return out;
}
