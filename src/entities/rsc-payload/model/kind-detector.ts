import type { ChunkKind } from './types';

// Quoted string-encoded references that React Flight emits as plain JSON
// strings, e.g. `"$Sreact.suspense"`, `"$Sreact.fragment"`. These are not
// payload data — they are symbol references the receiver must resolve.
const QUOTED_REF = /^"\$[A-Za-z@]/;

// Debug-info chunk: `D"$5"` etc. emitted by Next 15 to attach server-component
// metadata (name/env/key/owner) to a model id. We treat these as references
// because they don't carry user-visible payload — they point elsewhere.
const DEBUG_REF = /^D"/;

export function detectKind(payload: string): ChunkKind {
  if (!payload) return 'text';
  const first = payload[0];
  if (first === 'I') return 'module';
  if (first === 'M' || first === 'H') return 'hint';
  if (first === '[') return 'element';
  if (first === '$' || first === '@') return 'reference';
  // String-encoded references: `"$Sreact.suspense"`, `"$Sreact.fragment"`.
  if (first === '"' && QUOTED_REF.test(payload)) return 'reference';
  // Debug-info preface: `D"$5"`.
  if (first === 'D' && DEBUG_REF.test(payload)) return 'reference';
  return 'text';
}
