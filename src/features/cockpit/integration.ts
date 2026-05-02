/**
 * Cockpit overlay integration helpers.
 *
 * Two entry points:
 *   - `<CockpitView />` is mounted directly in the editor's "no tab" slot.
 *   - The same view can also be opened as an overlay via the `cockpit`
 *     key on the UI shell's overlays slice.
 *
 * `useCockpitOverlay()` returns the open/close API plus a derived flag
 * indicating whether the cockpit is currently visible (either inline
 * or as an overlay).
 */

import { useCallback } from 'react';
import { useUiStore } from '@entities/ui-shell';

export interface CockpitOverlayApi {
  open: boolean;
  openCockpit: () => void;
  closeCockpit: () => void;
  toggleCockpit: () => void;
}

export function useCockpitOverlay(): CockpitOverlayApi {
  const open = useUiStore((s) => s.overlays.cockpit.open);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const closeOverlay = useUiStore((s) => s.closeOverlay);

  const openCockpit = useCallback(
    () => openOverlay('cockpit'),
    [openOverlay],
  );
  const closeCockpit = useCallback(
    () => closeOverlay('cockpit'),
    [closeOverlay],
  );
  const toggleCockpit = useCallback(() => {
    if (open) closeOverlay('cockpit');
    else openOverlay('cockpit');
  }, [open, openOverlay, closeOverlay]);

  return { open, openCockpit, closeCockpit, toggleCockpit };
}

/**
 * Imperative variant — usable from non-component contexts (command
 * palette executors, keyboard shortcut handlers, etc.).
 */
export function openCockpitOverlay(): void {
  useUiStore.getState().openOverlay('cockpit');
}

export function closeCockpitOverlay(): void {
  useUiStore.getState().closeOverlay('cockpit');
}
