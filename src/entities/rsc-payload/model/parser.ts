import type { ModuleEnvironment, RscChunk } from './types';
import { detectKind } from './kind-detector';

// Hex-id references: $La, $1a, $@10, $Fa (server action), $5 (debug), etc.
// Captures the trailing hex digits.
const REF_PATTERN = /\$[LF@]?([0-9a-f]+)\b/g;
const MODULE_NAME = /I\["([^"]+)"/;
const MODULE_CHUNKS = /I\["[^"]+",\[([^\]]*)\]/;
const HINT_AS = /"as":"([^"]+)"/;
// Server-component metadata: {"name":"X","env":"Server",...} (text chunks).
const COMPONENT_NAME = /^{"name":"([^"]+)","env":"([^"]+)"/;
// Quoted symbol reference: "$Sreact.suspense" → "react.suspense".
const QUOTED_SYMBOL = /^"\$([SL])([^"]+)"$/;
// Debug-info chunk: D"$5" → references id 5.
const DEBUG_TARGET = /^D"\$([0-9a-f]+)"/;
// Server-action descriptor: {"id":"...","name":"submitAction","env":"Server",...}.
const ACTION_DESCRIPTOR = /^{"id":"[a-f0-9]+","bound":[^,]+,"name":"([^"]+)","env":"Server"/;

export function parseRscLine(line: string, arrivedAtMs: number): RscChunk | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) return null;

  const idPart = trimmed.slice(0, colonIdx);
  if (!/^[0-9a-fA-F]+$/.test(idPart)) return null;

  const payload = trimmed.slice(colonIdx + 1);
  if (!payload) return null;

  const kind = detectKind(payload);
  const sizeBytes = byteLengthOf(trimmed);

  const refs = extractRefs(payload);
  const label = extractLabel(payload, kind);
  const environment = kind === 'module' ? detectEnvironment(payload) : undefined;

  return {
    id: `${idPart}:`,
    kind,
    payload,
    arrivedAtMs,
    sizeBytes,
    label,
    resolvesRefs: refs.length ? refs : undefined,
    environment,
  };
}

export function detectEnvironment(payload: string): ModuleEnvironment {
  const m = payload.match(MODULE_CHUNKS);
  const inner = m?.[1];
  if (!inner) return 'unknown';
  const chunks = inner.toLowerCase();
  // Heuristic: client component manifest entries land in client-bundle chunks.
  // Next.js webpack config emits client refs into chunks under `static/chunks/`
  // with names that often include "client" or component names; server-only
  // modules don't ship over the wire as I-references at all (they're inlined).
  // Any I[...] reference is therefore a client reference in standard Next.js,
  // unless the chunk path looks like an internal server runtime asset.
  if (chunks.includes('runtime') || chunks.includes('rsc')) return 'unknown';
  return 'client';
}

export function extractRefs(payload: string): string[] {
  const out: string[] = [];
  for (const match of payload.matchAll(REF_PATTERN)) {
    const id = match[1];
    if (id) out.push(`${id}:`);
  }
  return Array.from(new Set(out));
}

export function extractLabel(payload: string, kind: RscChunk['kind']): string | undefined {
  if (kind === 'module') {
    const m = payload.match(MODULE_NAME);
    const path = m?.[1];
    if (path) {
      const last = path.split('/').pop()?.replace(/\.[jt]sx?$/, '');
      return last || path;
    }
  }
  if (kind === 'element') {
    const m = payload.match(/\["\$","\$L?([0-9a-f]+)"/);
    if (m) return `<${m[1]}/>`;
    const tag = payload.match(/\["\$","([a-zA-Z][a-zA-Z0-9]*)"/);
    if (tag) return `<${tag[1]}/>`;
  }
  if (kind === 'hint') {
    const m = payload.match(HINT_AS);
    if (m) return `preload ${m[1]}`;
  }
  if (kind === 'reference') {
    // Quoted symbol: "$Sreact.suspense" → "Suspense" (or React.x for known)
    const sym = payload.match(QUOTED_SYMBOL);
    if (sym) {
      const name = sym[2];
      if (!name) return undefined;
      if (name.startsWith('react.')) return `<${capitalize(name.slice(6))}/>`;
      return name;
    }
    // Debug target: D"$5" → "→5:".
    const dbg = payload.match(DEBUG_TARGET);
    if (dbg) return `debug → ${dbg[1]}:`;
  }
  if (kind === 'text') {
    // Server-action descriptor (most specific — must beat plain component).
    const action = payload.match(ACTION_DESCRIPTOR);
    if (action) return `action ${action[1]}()`;
    // Server-component metadata: {"name":"X","env":"Server",...}.
    const comp = payload.match(COMPONENT_NAME);
    if (comp && comp[1] && comp[2]) return `<${comp[1]}> (${comp[2].toLowerCase()})`;
  }
  return undefined;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}

function byteLengthOf(s: string): number {
  if (typeof Blob !== 'undefined') return new Blob([s]).size;
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
  return s.length;
}
