/**
 * Pattern catalog for editor-watcher producers. Centralised so regexes are
 * easy to audit and tune without touching watcher logic.
 */

/** Matches the `'use client'` or `"use client"` directive on its own line. */
export const USE_CLIENT_RE = /^\s*['"]use client['"]\s*;?\s*$/;

/** Matches `'use server'` for symmetry (not currently emitted, future use). */
export const USE_SERVER_RE = /^\s*['"]use server['"]\s*;?\s*$/;

/**
 * Patterns that flip a route to dynamic when accepted from completion.
 * Each entry maps the matched API to the discriminator we send on the bus.
 */
export const DYNAMIC_TRIGGERS: Array<{
  re: RegExp;
  api: 'cookies' | 'headers' | 'searchParams';
}> = [
  { re: /\bcookies\s*\(\s*\)/, api: 'cookies' },
  { re: /\bheaders\s*\(\s*\)/, api: 'headers' },
  { re: /\bsearchParams\b/, api: 'searchParams' },
];

/** `revalidateTag('foo')` / `revalidateTag("foo")` → captures the tag. */
export const REVALIDATE_TAG_RE = /\brevalidateTag\s*\(\s*['"]([^'"]+)['"]\s*\)/;

/**
 * `process.env.X` reference. The captured name is then run through
 * SECRET_NAME_RE to decide whether the reaction should fire at all.
 */
export const PROCESS_ENV_RE = /\bprocess\.env\.([A-Z][A-Z0-9_]*)\b/;

/**
 * Heuristic for "looks like a secret". Conservative — we'd rather miss a few
 * than annotate harmless names.
 */
export const SECRET_NAME_RE =
  /(SECRET|TOKEN|KEY|PASSWORD|PASS|API|PRIVATE|CREDENTIAL|DATABASE_URL|DSN|JWT)/;

/** A `NEXT_PUBLIC_` prefixed name is OK to read on the client. */
export const NEXT_PUBLIC_RE = /^NEXT_PUBLIC_/;

/** `'use server'` action declaration (function level OR file directive). */
export const SERVER_ACTION_DECL_RE =
  /async\s+function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{[^}]*['"]use server['"]/;

/** Detects `await fetch(` or bare `fetch(` invocations in a render path. */
export const FETCH_CALL_RE = /\b(?:await\s+)?fetch\s*\(/;
