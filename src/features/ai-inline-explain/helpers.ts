export type ExplainModel = 'opus-4.7' | 'sonnet-4.6' | 'haiku-4.5';

export interface MockSymbol {
  id: string;
  name: string;
  file: string;
  language: string;
  startLine: number;
  endLine: number;
  highlightStart: number;
  highlightEnd: number;
  source: string;
  explanation: string[];
}

const fmt = (s: string): string => s.replace(/^\n/, '').replace(/\n$/, '');

export const MOCK_SYMBOLS: ReadonlyArray<MockSymbol> = [
  {
    id: 'sym-1',
    name: 'useDebouncedValue',
    file: 'src/shared/hooks/use-debounced-value.ts',
    language: 'ts',
    startLine: 4,
    endLine: 14,
    highlightStart: 6,
    highlightEnd: 12,
    source: fmt(`
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
`),
    explanation: [
      'This hook returns a debounced copy of the input value. It defers updates until activity has settled for the specified delay window.',
      'On every render where value changes, an effect schedules a setTimeout that copies the latest value into local state. The cleanup function clears any pending timer when the value changes again.',
      'The debounce window resets on every keystroke, so callers receive the final settled value rather than every intermediate one. This is ideal for type-ahead search inputs, expensive autocomplete, and analytics events.',
      'A subtle gotcha: the initial render emits the value immediately, not after the delay. If your downstream code expects a leading delay, wrap with a one-shot guard or bias the initial state to a sentinel.',
    ],
  },
  {
    id: 'sym-2',
    name: 'computeRouteCost',
    file: 'src/entities/route/cost.ts',
    language: 'ts',
    startLine: 12,
    endLine: 24,
    highlightStart: 13,
    highlightEnd: 22,
    source: fmt(`
import type { RouteSegment, CostModel } from './types';

export function computeRouteCost(
  segments: ReadonlyArray<RouteSegment>,
  model: CostModel,
): number {
  let total = 0;
  for (const seg of segments) {
    const base = model.baseFor(seg.kind);
    const factor = seg.dynamic ? model.dynamicFactor : 1;
    total += base * factor * seg.expectedRps;
  }
  return Math.round(total * 100) / 100;
}
`),
    explanation: [
      'Aggregates the per-second runtime cost of a Next.js route by summing across all segments. The cost model decouples pricing knobs from the traversal so different runtimes can plug in.',
      'Each segment contributes base cost times a dynamic factor times its expected RPS. Static segments use a factor of 1, so they contribute a flat baseline.',
      'Rounding to two decimals at the end avoids floating point noise in dashboards and tooltips. Note the rounding is applied once at the boundary, not in the inner loop.',
      'The function is pure and synchronous, which makes it safe to call inside selectors and memoized hooks. For very large routes consider precomputing baseFor lookups outside the loop.',
    ],
  },
  {
    id: 'sym-3',
    name: 'applyPatch',
    file: 'src/features/diff-approval/apply.ts',
    language: 'ts',
    startLine: 8,
    endLine: 22,
    highlightStart: 10,
    highlightEnd: 19,
    source: fmt(`
import type { Patch, ApplyResult } from './types';

export async function applyPatch(patch: Patch): Promise<ApplyResult> {
  const log: string[] = [];
  for (const hunk of patch.hunks) {
    if (hunk.locked) {
      log.push(\`skip locked: \${hunk.file}\`);
      continue;
    }
    await writeHunk(hunk);
    log.push(\`wrote \${hunk.file}\`);
  }
  return { ok: true, log };
}
`),
    explanation: [
      'Applies a structured patch hunk by hunk and returns a structured result with a per-file log. Locked hunks are skipped instead of failing the entire patch.',
      'The loop is sequential rather than parallel — this is intentional so writes appear in source order in the log and conflicts surface deterministically.',
      'Errors from writeHunk are not caught here; callers wrap this in their own try/catch to convert to a partial-failure ApplyResult shape if needed.',
      'The returned ok flag is currently always true because the loop completes only on success. If skip semantics change to be a partial failure, this should be a discriminated union.',
    ],
  },
  {
    id: 'sym-4',
    name: 'parseFrontmatter',
    file: 'src/shared/lib/frontmatter.ts',
    language: 'ts',
    startLine: 1,
    endLine: 13,
    highlightStart: 3,
    highlightEnd: 11,
    source: fmt(`
import { z } from 'zod';

export function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\\n([\\s\\S]*?)\\n---\\n/);
  if (!match) return {};
  const body = match[1] ?? '';
  const lines = body.split('\\n').filter(Boolean);
  const out: Record<string, unknown> = {};
  for (const line of lines) {
    const [k, ...rest] = line.split(':');
    if (k) out[k.trim()] = rest.join(':').trim();
  }
  return out;
}
`),
    explanation: [
      'Extracts a YAML-ish frontmatter block from a Markdown string. Returns an empty object when no block is present, so callers can chain without guards.',
      'The regex anchors to the start of the file and uses a lazy match so multiple --- separators inside the body do not confuse the parser.',
      'Splitting on the first colon preserves URLs and timestamps in values. Keys are trimmed but the values keep internal whitespace intact.',
      'This is a tiny ad-hoc parser and not a general YAML reader. If you need lists, multiline strings, or quoted values, swap in a real YAML library at the call site.',
    ],
  },
  {
    id: 'sym-5',
    name: 'RouteRow',
    file: 'src/shared/ui/route-row.tsx',
    language: 'tsx',
    startLine: 6,
    endLine: 18,
    highlightStart: 7,
    highlightEnd: 16,
    source: fmt(`
interface Props { path: string; rendering: Rendering; sizeKb: number }

export function RouteRow({ path, rendering, sizeKb }: Props) {
  const tone = renderingTone(rendering);
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2 py-1">
      <span className="truncate font-mono text-xs text-ink-1">{path}</span>
      <RenderingChip rendering={rendering} />
      <span className={cn('text-[11px] tabular-nums', tone)}>
        {sizeKb.toFixed(1)} kB
      </span>
    </div>
  );
}
`),
    explanation: [
      'A presentational row used in the route list. It renders a path, a rendering chip, and a size readout in a fixed three-column grid.',
      'The rendering color is derived from a helper, so the row stays in sync with the chip even when the design tokens shift.',
      'Sizes use tabular-nums so columns visually align across rows even with different digit counts. Truncation on the path prevents horizontal scroll in narrow panels.',
      'The component is purely visual and stateless. All sorting, filtering, and grouping happens upstream in the route list container.',
    ],
  },
];

export const MODEL_OPTIONS: ReadonlyArray<{
  id: ExplainModel;
  label: string;
  cost: number;
}> = [
  { id: 'opus-4.7', label: 'Opus 4.7', cost: 38 },
  { id: 'sonnet-4.6', label: 'Sonnet 4.6', cost: 14 },
  { id: 'haiku-4.5', label: 'Haiku 4.5', cost: 4 },
];

/** Split a paragraph into 6-12 word chunks for streaming. */
export function splitIntoChunks(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const size = 6 + (i % 7); // 6..12 deterministic
    const end = Math.min(words.length, i + size);
    chunks.push(words.slice(i, end).join(' '));
    i = end;
  }
  return chunks;
}

/** Build a flat ordered list of chunks with paragraph markers. */
export function buildStreamPlan(paragraphs: ReadonlyArray<string>): string[] {
  const out: string[] = [];
  paragraphs.forEach((p, idx) => {
    if (idx > 0) out.push('\n\n');
    splitIntoChunks(p).forEach((c) => out.push(c + ' '));
  });
  return out;
}

export function symbolById(id: string | undefined): MockSymbol {
  return MOCK_SYMBOLS.find((s) => s.id === id) ?? MOCK_SYMBOLS[0]!;
}
