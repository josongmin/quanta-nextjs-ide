/**
 * CODEOWNERS parser.
 *
 * Reference: https://docs.github.com/articles/about-code-owners
 *
 *   - Lines starting with `#` are comments.
 *   - Each line is `<pattern> <owner> [owner...]`.
 *   - Patterns are gitignore-like (we implement the common subset:
 *     `**`, `*`, exact path, leading `/` for repo-root, trailing `/`
 *     for directory match).
 *   - Owners can be `@user`, `@org/team`, or an email address.
 *   - The LAST matching pattern wins (per spec).
 */

export interface CodeownersRule {
  /** 1-based line number in the source file. */
  readonly line: number;
  readonly pattern: string;
  readonly owners: ReadonlyArray<string>;
  /** Compiled regex for matching workspace-relative paths. */
  readonly regex: RegExp;
}

export interface CodeownersParseResult {
  readonly rules: ReadonlyArray<CodeownersRule>;
  readonly errors: ReadonlyArray<{ line: number; message: string }>;
}

function compilePattern(raw: string): RegExp {
  let pattern = raw;
  // Drop leading `/` — we always match against repo-relative paths.
  const anchored = pattern.startsWith('/');
  if (anchored) pattern = pattern.slice(1);
  const dirOnly = pattern.endsWith('/');
  if (dirOnly) pattern = pattern.slice(0, -1);

  let body = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    const next = pattern[i + 1];
    if (c === '*' && next === '*') {
      body += '.*';
      i++;
    } else if (c === '*') {
      body += '[^/]*';
    } else if (c === '?') {
      body += '[^/]';
    } else if (c && /[.+^${}()|[\]\\]/.test(c)) {
      body += '\\' + c;
    } else if (c) {
      body += c;
    }
  }

  // Anchored: must start at the path root. Otherwise: may live anywhere.
  const lead = anchored ? '^' : '(^|/)';
  const tail = dirOnly ? '(/|$)' : '($|/)';
  return new RegExp(`${lead}${body}${tail}`);
}

export function parseCodeowners(source: string): CodeownersParseResult {
  const rules: CodeownersRule[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    const line = i + 1;
    const trimmed = raw.replace(/#.*$/, '').trim();
    if (!trimmed) continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) {
      errors.push({ line, message: 'Pattern with no owner' });
      continue;
    }
    const pattern = tokens[0];
    const owners = tokens.slice(1);
    if (!pattern) {
      errors.push({ line, message: 'Empty pattern' });
      continue;
    }
    try {
      rules.push({
        line,
        pattern,
        owners,
        regex: compilePattern(pattern),
      });
    } catch (e) {
      errors.push({ line, message: (e as Error).message });
    }
  }

  return { rules, errors };
}

/**
 * Resolve owners for a path. Per CODEOWNERS spec the LAST matching rule
 * wins — we walk from the end and return the first match.
 */
export function ownersFor(
  file: string,
  rules: ReadonlyArray<CodeownersRule>,
): ReadonlyArray<string> {
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (r && r.regex.test(file)) return r.owners;
  }
  return [];
}
