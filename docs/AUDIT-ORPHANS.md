# Orphan Feature Audit

Goal: list every directory under `src/features/` that is **not** registered
in `src/widgets/overlays/overlays-host.tsx`, and note where (if anywhere)
it is consumed.

Method:
1. `ls src/features/` → 193 directories.
2. Extract registered import paths from `overlays-host.tsx` (the lazy
   import registry). 181 distinct features registered.
3. `comm` the two lists. 12 features are not registered with the overlay
   host — verify each is wired somewhere else before considering removal.

## Unregistered features (12)

Do **not** delete any of these without explicit user confirmation. Most
are non-overlay surfaces (editor layers, top-bar widgets, bottom-panel
tabs, internal helpers).

| Feature dir | Status | Consumer (where it's wired) |
| --- | --- | --- |
| `activity-feed` | In use | `src/widgets/editor/editor-area.tsx` (floating dock, gated by focus mode). |
| `ai-pane` | **Empty / orphaned candidate** | Directory is empty (no files). Not referenced anywhere via grep. Likely a placeholder dir from a scrapped wave. **Safe to remove**, but per task constraints the user may keep it intentionally. |
| `annotations` | In use | `src/widgets/editor/parts/annotations-layer.tsx`. |
| `color-picker` | In use | `src/widgets/editor/parts/color-picker-layer.tsx`. |
| `focus-mode` | In use | `src/widgets/top-bar/top-bar.tsx`. |
| `image-preview` | In use | `src/widgets/editor/parts/image-preview-layer.tsx`. |
| `inline-blame` | In use | `src/widgets/editor/parts/inline-blame-layer.tsx`. |
| `keybindings` | In use | `src/features/command-palette/{index,keybindings-help}.tsx`, `src/features/shortcut-help/keymap.ts`. Acts as a shared keymap module. |
| `linked-editing` | In use | `src/widgets/editor/parts/linked-editing-layer.tsx`. |
| `recents` | In use | `src/widgets/top-bar/top-bar.tsx`. |
| `rule-manager` | In use | `src/features/settings-panel/index.tsx` (Rules tab). |
| `runtime-logs` | In use | `src/widgets/bottom-panel/tabs/live-tab.tsx`. |

## Verdict

11 of 12 unregistered features are intentionally non-overlay surfaces and
are correctly wired into widgets or other features. Only one candidate
appears genuinely orphaned:

- `src/features/ai-pane/` — empty directory, no files inside, not
  referenced anywhere. Recommendation: leave for the user to decide
  (could be a reserved slot for an upcoming wave).

## Notes on the audit method

- The grep that "found" `setInterval` in `src/features/quick-docs/docs.ts`
  was a string literal inside a documentation example for `useEffect`
  (lines 209–212). It's not real code, so it does not need cleanup.
- `wizards/*` features (`wizards/server-action`, `wizards/route-handler`,
  `wizards/new-route`) are nested overlays and are correctly registered
  via their nested import paths.
