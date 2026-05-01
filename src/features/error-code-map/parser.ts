/**
 * Multi-format stack trace parser.
 *
 * Accepts pasted production error output and returns a normalized
 * `ParsedError` with frames. Supports the three flavors we see in Next:
 *   - V8 / Chrome: `    at functionName (file:line:col)`
 *   - V8 anonymous: `    at file:line:col`
 *   - Next.js bundle frames: `    at MyComp (webpack-internal:///...:line:col)`
 *
 * The first non-empty line is treated as the message; remaining lines are
 * parsed as frames best-effort. Lines that don't match are dropped.
 */

export interface RawFrame {
  /** Raw text of the frame line, untrimmed. */
  raw: string;
  /** Containing function or symbol if known. */
  fn?: string;
  /** File path or URL the frame points at. */
  file: string;
  /** 1-based line number. */
  line: number;
  /** 1-based column. */
  column?: number;
  /** True if the frame's source is webpack-internal/eval/native. */
  synthetic: boolean;
}

export interface ParsedError {
  /** First line of the input — usually `TypeError: foo is undefined`. */
  message: string;
  /** Detected error class, e.g. `TypeError`. */
  errorName?: string;
  frames: RawFrame[];
}

const FRAME_NAMED = /^\s*at\s+([^(]+?)\s+\((.+):(\d+):(\d+)\)\s*$/;
const FRAME_ANON = /^\s*at\s+(.+):(\d+):(\d+)\s*$/;
const FRAME_NODE = /^\s*at\s+([^(]+?)\s+\((.+):(\d+)\)\s*$/;
const ERROR_NAME = /^([A-Z][A-Za-z]*Error|Error):\s*(.*)$/;

const SYNTHETIC_PREFIXES = [
  'webpack-internal:',
  'webpack:',
  'eval at',
  'native',
  '<anonymous>',
];

function isSynthetic(file: string): boolean {
  return SYNTHETIC_PREFIXES.some((p) => file.startsWith(p));
}

/** Normalize a captured file URL into a project-relative path when possible. */
export function normalizeFile(input: string): string {
  let f = input.trim();
  // Strip wrapping quotes.
  f = f.replace(/^['"]|['"]$/g, '');
  // Strip Next/webpack scheme prefixes.
  f = f.replace(/^webpack-internal:\/\/\/(\(?[^)]*\)?\/)?/, '');
  f = f.replace(/^webpack:\/\/_N_E\//, '');
  f = f.replace(/^webpack:\/\/[^/]+\//, '');
  // Strip query/hash.
  f = f.replace(/\?.*$/, '');
  f = f.replace(/#.*$/, '');
  // Common Next dev prefixes — just keep tail relative path.
  f = f.replace(/^.*\/\.next\/server\//, '.next/server/');
  f = f.replace(/^file:\/\//, '');
  return f;
}

export function parseStack(input: string): ParsedError {
  const lines = input.split(/\r?\n/);
  let message = '';
  let errorName: string | undefined;
  const frames: RawFrame[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    // Frame patterns first — they're cheap to detect.
    const m1 = FRAME_NAMED.exec(line);
    if (m1) {
      const file = normalizeFile(m1[2]!);
      frames.push({
        raw: line,
        fn: m1[1]!.trim(),
        file,
        line: Number(m1[3]),
        column: Number(m1[4]),
        synthetic: isSynthetic(m1[2]!),
      });
      continue;
    }
    const m2 = FRAME_ANON.exec(line);
    if (m2) {
      const file = normalizeFile(m2[1]!);
      frames.push({
        raw: line,
        file,
        line: Number(m2[2]),
        column: Number(m2[3]),
        synthetic: isSynthetic(m2[1]!),
      });
      continue;
    }
    const m3 = FRAME_NODE.exec(line);
    if (m3) {
      const file = normalizeFile(m3[2]!);
      frames.push({
        raw: line,
        fn: m3[1]!.trim(),
        file,
        line: Number(m3[3]),
        synthetic: isSynthetic(m3[2]!),
      });
      continue;
    }

    // Otherwise it's the message line(s). Capture the first one.
    if (!message) {
      message = line.trim();
      const en = ERROR_NAME.exec(message);
      if (en) errorName = en[1];
    }
  }

  return { message, errorName, frames };
}
