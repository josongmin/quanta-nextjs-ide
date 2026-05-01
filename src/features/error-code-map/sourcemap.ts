/**
 * Tiny VLQ-decoder source-map resolver.
 *
 * We don't pull in `source-map` (it's a large WASM dep). For our IDE scope
 * the goal is best-effort: given a generated `file:line:col` and a Source-Map
 * v3 JSON object, return the original `{ file, line, column }`.
 *
 * If the runtime caller has no `.map` available we just return the original
 * frame untouched — Phase 10 doesn't promise true production resolution,
 * only a "did we map?" signal in the UI.
 */

export interface RawSourceMap {
  version: number;
  sources: ReadonlyArray<string>;
  sourcesContent?: ReadonlyArray<string | null>;
  names?: ReadonlyArray<string>;
  mappings: string;
  file?: string;
  sourceRoot?: string;
}

export interface OriginalPosition {
  source: string;
  line: number; // 1-based
  column: number; // 0-based
  name?: string;
}

const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CHAR_TO_INT = (() => {
  const m = new Map<string, number>();
  for (let i = 0; i < BASE64.length; i++) m.set(BASE64[i]!, i);
  return m;
})();

function decodeVlq(input: string, start: number): { value: number; next: number } {
  let result = 0;
  let shift = 0;
  let i = start;
  for (;;) {
    const ch = input[i];
    if (ch === undefined) break;
    const digit = CHAR_TO_INT.get(ch);
    if (digit === undefined) break;
    i += 1;
    const continuation = digit & 32;
    const value = digit & 31;
    result += value << shift;
    if (!continuation) break;
    shift += 5;
  }
  // ZigZag decode.
  const negative = result & 1;
  const decoded = result >> 1;
  return { value: negative ? -decoded : decoded, next: i };
}

interface DecodedSegment {
  generatedColumn: number;
  source?: number;
  originalLine?: number;
  originalColumn?: number;
  name?: number;
}

interface DecodedLine {
  segments: DecodedSegment[];
}

function decodeMappings(mappings: string): DecodedLine[] {
  const lines: DecodedLine[] = [];
  let genCol = 0;
  let src = 0;
  let origLine = 0;
  let origCol = 0;
  let name = 0;

  for (const lineStr of mappings.split(';')) {
    genCol = 0;
    const segments: DecodedSegment[] = [];
    if (lineStr.length > 0) {
      for (const segStr of lineStr.split(',')) {
        if (!segStr) continue;
        let i = 0;
        const fields: number[] = [];
        while (i < segStr.length) {
          const { value, next } = decodeVlq(segStr, i);
          fields.push(value);
          i = next;
        }
        if (fields.length === 0) continue;
        genCol += fields[0]!;
        const seg: DecodedSegment = { generatedColumn: genCol };
        if (fields.length >= 4) {
          src += fields[1]!;
          origLine += fields[2]!;
          origCol += fields[3]!;
          seg.source = src;
          seg.originalLine = origLine;
          seg.originalColumn = origCol;
          if (fields.length >= 5) {
            name += fields[4]!;
            seg.name = name;
          }
        }
        segments.push(seg);
      }
    }
    lines.push({ segments });
  }
  return lines;
}

let cachedRaw: RawSourceMap | null = null;
let cachedDecoded: DecodedLine[] | null = null;

/**
 * Lazily load + cache decoded mappings for one map. Caller passes the same
 * map object on subsequent calls and we skip re-decoding.
 */
function decode(map: RawSourceMap): DecodedLine[] {
  if (cachedRaw === map && cachedDecoded) return cachedDecoded;
  cachedRaw = map;
  cachedDecoded = decodeMappings(map.mappings);
  return cachedDecoded;
}

/**
 * Look up the original position for a 1-based generated `(line, column)`.
 * Returns `null` if the line/column is past the map bounds.
 */
export function originalPositionFor(
  map: RawSourceMap,
  generatedLine: number,
  generatedColumn: number,
): OriginalPosition | null {
  const decoded = decode(map);
  const lineIdx = generatedLine - 1;
  const decodedLine = decoded[lineIdx];
  if (!decodedLine || decodedLine.segments.length === 0) return null;

  // Binary search the right-most segment <= generatedColumn.
  const segs = decodedLine.segments;
  let lo = 0;
  let hi = segs.length - 1;
  let pick = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const seg = segs[mid]!;
    if (seg.generatedColumn <= generatedColumn) {
      pick = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const seg = segs[pick];
  if (!seg || seg.source === undefined || seg.originalLine === undefined) {
    return null;
  }
  const sourceFile = map.sources[seg.source];
  if (sourceFile === undefined) return null;
  return {
    source: map.sourceRoot ? `${map.sourceRoot}${sourceFile}` : sourceFile,
    line: (seg.originalLine ?? 0) + 1,
    column: seg.originalColumn ?? 0,
    name: seg.name !== undefined ? map.names?.[seg.name] : undefined,
  };
}

/**
 * Resolves a frame against an optional source-map registry keyed by the
 * generated file URL. If the frame's file has no map registered, returns
 * the input frame unchanged with `mapped: false`.
 */
export interface ResolvedFrame {
  file: string;
  line: number;
  column?: number;
  mapped: boolean;
  symbol?: string;
}

export function resolveFrame(
  frame: { file: string; line: number; column?: number },
  registry: ReadonlyMap<string, RawSourceMap>,
): ResolvedFrame {
  const map = registry.get(frame.file);
  if (!map) return { ...frame, mapped: false };
  const orig = originalPositionFor(map, frame.line, frame.column ?? 0);
  if (!orig) return { ...frame, mapped: false };
  return {
    file: orig.source,
    line: orig.line,
    column: orig.column,
    mapped: true,
    symbol: orig.name,
  };
}
