// Workspace-wide find/replace search helpers — pure functions over the
// in-memory mock workspace index.

import { workspaceIndex } from '@shared/mocks/workspace-index';

export interface SearchHit {
  file: string;
  line: number;
  column: number;
  preview: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchFileGroup {
  file: string;
  hits: SearchHit[];
}

export interface SearchResult {
  fileGroups: SearchFileGroup[];
  totalHits: number;
  totalFiles: number;
  truncated: boolean;
}

export interface SearchOptions {
  query: string;
  replace: string;
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  include: string;
  exclude: string;
}

const HIT_LIMIT = 200;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(opts: SearchOptions): RegExp | null {
  if (!opts.query) return null;
  let body = opts.regex ? opts.query : escapeRegex(opts.query);
  if (opts.wholeWord) body = `\\b(?:${body})\\b`;
  const flags = opts.caseSensitive ? 'g' : 'gi';
  try {
    return new RegExp(body, flags);
  } catch {
    return null;
  }
}

/**
 * Glob-ish matching: supports `*` (any chars except `/`), `**` (any chars),
 * and `,`-separated multiple patterns. Empty string = match-all.
 */
function compileGlobs(spec: string): RegExp[] | null {
  if (!spec.trim()) return null;
  return spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pat) => {
      let body = '';
      let i = 0;
      while (i < pat.length) {
        const c = pat[i] ?? '';
        if (c === '*' && pat[i + 1] === '*') {
          body += '.*';
          i += 2;
        } else if (c === '*') {
          body += '[^/]*';
          i += 1;
        } else if (c === '?') {
          body += '.';
          i += 1;
        } else if (/[.+^${}()|[\]\\]/.test(c)) {
          body += `\\${c}`;
          i += 1;
        } else {
          body += c;
          i += 1;
        }
      }
      return new RegExp(`^${body}$`);
    });
}

function matchesAnyGlob(file: string, globs: RegExp[] | null): boolean {
  if (!globs) return true;
  return globs.some((g) => g.test(file));
}

export function search(opts: SearchOptions): SearchResult {
  const re = buildPattern(opts);
  if (!re) {
    return { fileGroups: [], totalHits: 0, totalFiles: 0, truncated: false };
  }
  const include = compileGlobs(opts.include);
  const exclude = compileGlobs(opts.exclude);

  const groups: SearchFileGroup[] = [];
  let total = 0;
  let truncated = false;

  for (const [file, source] of Object.entries(workspaceIndex)) {
    if (!matchesAnyGlob(file, include)) continue;
    if (exclude && matchesAnyGlob(file, exclude)) continue;

    const lines = source.split('\n');
    const hits: SearchHit[] = [];
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i] ?? '';
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(ln)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        hits.push({
          file,
          line: i + 1,
          column: start + 1,
          preview: ln,
          matchStart: start,
          matchEnd: end,
        });
        total += 1;
        if (total >= HIT_LIMIT) {
          truncated = true;
          break;
        }
        // Guard zero-length matches.
        if (m.index === re.lastIndex) re.lastIndex += 1;
      }
      if (truncated) break;
    }
    if (hits.length > 0) {
      groups.push({ file, hits });
    }
    if (truncated) break;
  }

  groups.sort((a, b) => b.hits.length - a.hits.length);

  return {
    fileGroups: groups,
    totalHits: total,
    totalFiles: groups.length,
    truncated,
  };
}

/**
 * Builds the would-be replaced preview line for a hit (regex-aware).
 */
export function buildReplacementPreview(
  hit: SearchHit,
  opts: SearchOptions,
): string {
  if (!opts.replace && opts.replace !== '') return hit.preview;
  const matched = hit.preview.slice(hit.matchStart, hit.matchEnd);
  let replaced = opts.replace;
  if (opts.regex) {
    try {
      const re = new RegExp(
        opts.query,
        opts.caseSensitive ? '' : 'i',
      );
      replaced = matched.replace(re, opts.replace);
    } catch {
      replaced = opts.replace;
    }
  }
  return (
    hit.preview.slice(0, hit.matchStart) +
    replaced +
    hit.preview.slice(hit.matchEnd)
  );
}
