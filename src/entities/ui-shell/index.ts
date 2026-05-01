// Public API for the ui-shell entity. Owns global UI shell state:
// panels, overlays, prefs, recents, inspector context, annotations.
//
// All ~280 historical importers used `@app/store`; that path is kept as a
// thin re-export shim that delegates here, so behavior is byte-identical.

export { useUiStore } from './ui.store';
export type { UiStore } from './ui.store';
export type {
  LeftTab,
  BottomTab,
  InspectorContext,
  Density,
  InspectionProfile,
  ColorMode,
  AutofixPolicy,
  RecentItem,
  Annotation,
} from './ui/types';
export type { OverlayState } from './ui/overlays.slice';
export { initialOverlays } from './ui/overlays.slice';
