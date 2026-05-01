export interface ParamSig {
  name: string;
  params: string[];
  /** Marks the index from which a rest parameter applies. */
  rest?: number;
}

export const PARAM_SIGS: ParamSig[] = [
  { name: 'cn', params: ['base', 'modifier', 'theme'], rest: 1 },
  { name: 'match', params: ['target', 'patterns'], rest: 1 },
  { name: 'useEffect', params: ['effect', 'deps'] },
  { name: 'useMemo', params: ['compute', 'deps'] },
  { name: 'useState', params: ['initial'] },
  { name: 'setTimeout', params: ['handler', 'delayMs'] },
];

export interface ParamHint {
  line: number;
  column: number;
  label: string;
}

interface CallSite {
  fn: string;
  line: number;
  /** Column (1-based) of the opening "(". */
  parenCol: number;
  /** The text inside the parens (top-level same-line slice). */
  inner: string;
  /** Column (1-based) where `inner` starts (just after "("). */
  innerStartCol: number;
}

const CALL_RE = /\b([A-Za-z_$][\w$]*)\s*\(/g;

function findInnerEnd(text: string, start: number): number {
  let depth = 1;
  let inStr: string | null = null;
  for (let i = start; i < text.length; i++) {
    const ch = text.charAt(i);
    if (inStr) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitArgs(inner: string): { text: string; offset: number }[] {
  const out: { text: string; offset: number }[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner.charAt(i);
    if (inStr) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      out.push({ text: inner.slice(start, i), offset: start });
      start = i + 1;
    }
  }
  const tail = inner.slice(start);
  if (tail.trim().length > 0 || out.length > 0) {
    out.push({ text: tail, offset: start });
  }
  return out;
}

export function findCallSites(
  lines: { line: number; text: string }[],
): CallSite[] {
  const sites: CallSite[] = [];
  for (const { line, text } of lines) {
    CALL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CALL_RE.exec(text)) !== null) {
      const fn = m[1];
      if (!fn) continue;
      const openIdx = m.index + m[0].length - 1;
      const innerStart = openIdx + 1;
      const innerEnd = findInnerEnd(text, innerStart);
      if (innerEnd < 0) continue;
      const inner = text.slice(innerStart, innerEnd);
      sites.push({
        fn,
        line,
        parenCol: openIdx + 1,
        inner,
        innerStartCol: innerStart + 1,
      });
    }
  }
  return sites;
}

export function hintsForCall(site: CallSite, sig: ParamSig): ParamHint[] {
  const args = splitArgs(site.inner);
  if (args.length === 0) return [];
  const out: ParamHint[] = [];
  args.forEach((arg, i) => {
    const trimmed = arg.text.trimStart();
    if (!trimmed) return;
    const leading = arg.text.length - trimmed.length;
    const col = site.innerStartCol + arg.offset + leading;

    let paramName: string | undefined;
    if (sig.rest != null && i >= sig.rest) {
      paramName = sig.params[sig.rest];
    } else if (i < sig.params.length) {
      paramName = sig.params[i];
    }
    if (!paramName) return;
    out.push({
      line: site.line,
      column: col,
      label: paramName,
    });
  });
  return out;
}

export function buildHints(
  visibleLines: { line: number; text: string }[],
  cap = 6,
): ParamHint[] {
  const sigByName = new Map(PARAM_SIGS.map((s) => [s.name, s]));
  const sites = findCallSites(visibleLines);
  const out: ParamHint[] = [];
  let used = 0;
  for (const site of sites) {
    const sig = sigByName.get(site.fn);
    if (!sig) continue;
    const hints = hintsForCall(site, sig);
    if (hints.length === 0) continue;
    out.push(...hints);
    used++;
    if (used >= cap) break;
  }
  return out;
}
