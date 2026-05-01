# UI Primitives + Tokens Audit — 2026-05-01

Scope: `/Users/songmin/quanta-nextjs-ide/src/shared/ui` + sample of `src/features/*`.

## Inventory

25 primitives in `src/shared/ui/`:

- `button` — primary/ghost/accent button with size variants
- `chip` — pill/rounded label with tone variants (status/semantic colors)
- `code-block` — syntax-aware code rendering with copy/scroll
- `confidence-dot` — small dot indicating confidence/probability score
- `context-menu` — Radix-based right-click / kebab menu wrapper
- `cost-chip` — specialized chip rendering token cost / dollar amount
- `empty-state` — placeholder block (icon + title + hint) for empty panels
- `evidence-card` — card surface for citation/evidence with file ref
- `ghost-annotation` — inline subtle annotation overlay (suggestions)
- `icons` — re-exports of lucide icons used app-wide
- `inspector` — labeled key/value inspector grid
- `kbd` — keyboard-shortcut chip
- `lens-line` — single-line summary row used in list lenses
- `overlay-panel` — Radix Dialog wrapper used as the modal shell
- `patch-preview` — diff/patch chunk renderer
- `popover` — Radix popover wrapper
- `rendering-chip` — chip variant for static/isr/dynamic/edge tags
- `route-row` — list row for Next route entries
- `scrollarea` — Radix scroll area
- `section` — labeled grouping container with title + slot
- `severity-icon` — icon mapped to severity tone
- `sign-bar` — +/- sparkline-like bar for deltas
- `skeleton` — shimmer loading placeholder
- `tabs` — Radix tabs wrapper with styled triggers
- `tooltip` — Radix tooltip wrapper

## Findings

### Chip tone enum (canonical)

`neutral | muted | accent | err | warn | info | hint | static | isr | dynamic | edge | client | server` (from `src/shared/ui/chip.tsx`).

### Chip tone drift (spot-checked)

- None detected in sample of ~150 `<Chip tone=...>` literal usages. All literal tones map to the enum.
- Dynamic-tone passthroughs that should be audited at the source-of-truth (lookup tables) — these are not drift in the JSX itself but rely on helper correctness:
  - `src/features/diff-approval/index.tsx:225` — `tone={rf.severity}` — verified: `RiskSeverity` ∈ {`err`,`warn`,`info`}; in-enum.
  - `src/features/stripe-checkout-sim/index.tsx:221` — `tone={scenario.tone}` — relies on scenario typing; not statically guaranteed; recommend narrowing to `ChipTone` union.
  - `src/features/api-playground/index.tsx:386` — `tone={tone === 'static' ? 'static' : tone}` — redundant ternary; passthrough relies on caller passing valid enum.

No literal tone strings outside the enum were found in sample.

### Raw color violations (sample)

Token shorthand: `bg-bg`, `bg-bg-subtle`, `bg-bg-hover`, `text-ink-1/2/3`, `border-line`.

- `src/features/rtl-preview/index.tsx:200` — `bg-white` — should be `bg-bg` (or `bg-canvas` token).
- `src/features/runtime-logs/index.tsx:189` — `bg-white` (live indicator dot) — should be `bg-sev-err` or `bg-accent` (semantic) rather than raw white.
- `src/features/screen-reader-sim/index.tsx:222` — `bg-white` — should be `bg-bg`.
- `src/features/keyboard-flow-viz/index.tsx:233` — `bg-white` — should be `bg-bg`.
- `src/features/email-preview/index.tsx:371,390,409` — `bg-white` (toggle thumb) — should be `bg-bg` or new `bg-thumb` token.
- `src/features/settings-panel/sections/density.tsx:35` — `bg-white` — should be `bg-bg`.
- `src/features/settings-panel/sections/appearance.tsx:77,91,127` — `bg-white`, `text-black` — should be `bg-bg`, `text-ink-1` (note: HC-mode branch already exists; consider HC token instead of raw `text-black`).
- `src/features/draft-mode-viz/index.tsx:112` — `bg-white` — should be `bg-bg` or `bg-ink-1`.
- `src/features/rule-manager/index.tsx:292` — `bg-white` (toggle thumb) — should be `bg-bg`.

No `bg-gray-*`, `text-gray-*`, `border-gray-*` matches in sample (only raw `bg-white` / `text-black`).

### Inline hex

- `src/features/rtl-preview/index.tsx:234` — `stroke="#dc2626"` — should be `stroke-sev-err` or `var(--sev-err)`.
- `src/features/rtl-preview/index.tsx:301` — `stroke="#e5e7eb"` — should be `var(--line)`.
- `src/features/comment-thread/index.tsx:44-47` — palette of 6 hex values for avatar tint — extract to `--avatar-1..6` tokens (justifiable as a deliberate categorical palette, but must be tokenized for theming).
- `src/features/push-notification-lab/index.tsx:42-149` — heavy hex usage for iOS / Android / Firefox notification mocks (`#1c1c1e`, `#1a73e8`, `#202124`, `#fafafa`, etc.). Justified: these reproduce platform UI fidelity. Recommend isolating in a `push-notification-lab/platform-colors.ts` constant module and adding an ESLint exception comment so global hex-lint stays strict.

### OverlayPanel width distribution

189 usages total (`<OverlayPanel`). Sampled 80+ explicit `width={N}` props.

Distinct width values observed (px): `680, 720, 760, 780, 860, 880, 920, 940, 960, 980, 1000, 1020, 1040, 1080, 1100, 1140, 1180, 1200, 1240`.

That is **19 distinct widths** for ~80 sampled panels — high entropy, no consistent grid. Distribution skews to 1080–1240.

Suggested size scale (replace numeric `width` with named):

| size | px  | use case |
|------|-----|----------|
| `sm` | 640 | quick popups (recent files, learn-more) |
| `md` | 880 | single-pane forms, detail views |
| `lg` | 1080| 2-pane list+detail (most current uses) |
| `xl` | 1240| dense visualizations (turbopack-graph, rsc-payload-step) |
| `full`| `min(96vw, 1440)` | full-canvas tools |

Migration: `width?: number` -> `size?: 'sm'\|'md'\|'lg'\|'xl'\|'full'` (keep `width` as escape hatch).

### Other smells

1. **`max-h-[70vh]` hard-coded in `OverlayPanel`** — at ~1240px wide and high content density (e.g. `rsc-payload-step`), 70vh truncates. Make configurable (`maxH?: 'md'|'lg'|'tall'`).
2. **Toggle thumbs** (`email-preview`, `rule-manager`) re-implement the same `h-3 w-3 rounded-full bg-white translate-x-*` pattern inline 4+ times — extract a `<Switch>` primitive (currently absent from `src/shared/ui/`).
3. **`scenario.tone` typed loosely** (`stripe-checkout-sim`) — multiple features pipe arbitrary strings into `<Chip tone>`. Export and reuse a `ChipTone` type from `chip.tsx`; enforce at helper signatures.

## Top 5 recommendations

1. **Add a `Switch` primitive** to `src/shared/ui/` — eliminates 4+ inline `bg-white` toggle-thumb violations (`email-preview`, `rule-manager`) and unblocks consistent HC-mode theming.
2. **Replace `OverlayPanel.width?: number` with a `size` token scale** (`sm|md|lg|xl|full`) and migrate the ~80 numeric callsites; keep `width` as an escape hatch. Cuts 19 distinct values to 5.
3. **Export and reuse `ChipTone` type** from `chip.tsx`; type all helpers (`riskTone`, `statusTone`, `KIND_TONE`, `scenario.tone`, etc.) so dynamic `<Chip tone={x}>` is statically validated against the enum.
4. **Tokenize remaining raw colors**: replace `bg-white`/`text-black` in `rtl-preview`, `screen-reader-sim`, `keyboard-flow-viz`, `settings-panel/appearance`, `draft-mode-viz` with `bg-bg`/`text-ink-1`. Replace SVG `stroke="#dc2626"`/`"#e5e7eb"` with token CSS vars.
5. **Quarantine deliberate hex palettes** (`push-notification-lab` platform colors, `comment-thread` avatar palette) into named constant modules with eslint-disable annotation, then enable a project-wide `no-hex-color` lint rule across `src/features/`.
