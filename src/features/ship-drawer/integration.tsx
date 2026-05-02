/**
 * Ship-it Drawer integration helpers.
 *
 * Exports:
 *   - `<ShipButton>` — top-bar trigger with a tiny readiness dot.
 *   - `useShipDrawerKeybinding()` — registers Cmd+Shift+P to open the drawer.
 *
 * Importers (e.g. `widgets/top-bar/top-bar.tsx`) consume these directly.
 */

import { useEffect } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Kbd, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { selectShipDot, useShipDrawerStore } from './store';

const DOT_TONE: Record<'green' | 'amber' | 'red' | 'neutral', string> = {
  green: 'bg-sem-static',
  amber: 'bg-sev-warn',
  red: 'bg-sev-err',
  neutral: 'bg-ink-3',
};

export function ShipButton() {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const dot = useShipDrawerStore(selectShipDot);
  const refresh = useShipDrawerStore((s) => s.refresh);

  // Refresh once on mount so the dot has data.
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Tooltip
      content={
        <span className="flex items-center gap-1">
          Ship
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>P</Kbd>
        </span>
      }
      side="bottom"
    >
      <Button
        tone="soft"
        size="sm"
        onClick={() => openOverlay('shipDrawer')}
        className="mi-press gap-1.5 pr-2"
        data-testid="ship-button"
        aria-label="Open ship drawer"
      >
        <span
          aria-hidden
          className={cn('h-1.5 w-1.5 rounded-full', DOT_TONE[dot])}
        />
        <span className="font-medium">Ship</span>
      </Button>
    </Tooltip>
  );
}

/**
 * Registers Cmd+Shift+P / Ctrl+Shift+P → open ship drawer.
 *
 * Note: VSCode and others use Cmd+Shift+P for the command palette. The
 * existing palette is bound to ⌘P (no shift) in this IDE — see top-bar —
 * so this binding is unique.
 */
export function useShipDrawerKeybinding() {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const isOpen = useUiStore((s) => s.overlays.shipDrawer.open);
  const closeOverlay = useUiStore((s) => s.closeOverlay);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        if (isOpen) closeOverlay('shipDrawer');
        else openOverlay('shipDrawer');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, openOverlay, closeOverlay]);
}
