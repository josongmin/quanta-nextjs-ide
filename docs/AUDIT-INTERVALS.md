# `setInterval` Cleanup Audit — `src/features/`

Method: `grep -rn 'setInterval' src/features/`. For each match, verify
the corresponding `clearInterval` is present in a `useEffect` cleanup,
ref-tracked, or runs on unmount.

## Real `setInterval` usages (10 sites in 9 files)

| File | Line | Cleanup pattern | Verdict |
| --- | --- | --- | --- |
| `runtime-logs/index.tsx` | 100 | Inside `useEffect`; `return () => window.clearInterval(id)` at line 103. | OK |
| `runtime-logs/index.tsx` | 108 | Inside `useEffect`; `return () => window.clearInterval(id)` at line 109. | OK |
| `ai-commit-message/index.tsx` | 63 | `intervalRef.current = setInterval(...)`; cleared at line 52 (start of `stopStream`); `useEffect(() => stopStream, [])` at line 89 ensures unmount cleanup. | OK |
| `ai-inline-explain/index.tsx` | 54 | Same `intervalRef` pattern; `stopStream` clears it (line 43); `useEffect(() => stopStream, [])` at line 84 fires on unmount. | OK |
| `ai-docstring/index.tsx` | 72 | Same `intervalRef` pattern; cleared at line 61; unmount cleanup at line 97. | OK |
| `ai-route-scaffold/index.tsx` | 107 | Same `intervalRef` pattern; cleared at line 72; unmount cleanup at line 160. | OK |
| `focus-session/index.tsx` | 63 | `intervalRef` cleared inside the same `useEffect` (line 67) on completion AND in the `return () => { ... clearInterval(intervalRef.current) ... }` cleanup at lines 76–80. Additional cleanups at 110–119 and 144 cover pause/reset paths. | OK |
| `pair-queue/index.tsx` | 41 | `useEffect` with `return () => window.clearInterval(id)` at line 42. | OK |
| `time-travel/index.tsx` | 54 | `useRef<ReturnType<typeof setInterval>>`; cleared at lines 47–50 (when paused), 63–67 (effect cleanup on unmount or deps change). | OK |
| `rsc-payload-step/model/useAutoRefetch.ts` | 31 | `useEffect`; `return () => window.clearInterval(handle)` at line 32. | OK |

## Non-issue match

- `quick-docs/docs.ts:210` — string literal inside a documentation
  `example` field for `useEffect`. Not executable code. Skip.

## Summary

All 10 real `setInterval` sites have proper cleanup. No leaks
identified. No code change required for this audit.

## Defensive notes for future contributors

- The AI streaming overlays (`ai-commit-message`, `ai-inline-explain`,
  `ai-docstring`, `ai-route-scaffold`) all use the same pattern:
  `intervalRef` written from a `startStream` closure, cleared by
  `stopStream`, with `useEffect(() => stopStream, [])` for unmount.
  When adding a sibling overlay, follow the same triplet so the leak
  surface stays at zero.
- `focus-session` is the most complex — three `useEffect` blocks all
  touch the same `intervalRef`. Any further edit must keep its
  invariant: every code path that writes to `intervalRef.current` is
  paired with a `clearInterval` on the previous value before
  overwriting.
