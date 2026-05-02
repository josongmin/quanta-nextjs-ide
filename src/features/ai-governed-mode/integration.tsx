/**
 * Phase 18 — Integration surface.
 *
 * The single import the ui-shell / top-bar / ai-panel use to render the
 * Governed Flow into the existing app. We expose:
 *
 *   - <GovernedFlowPanel />   embeddable body
 *   - <GovernedFlowOverlay /> ui-shell overlay (rendered by ui-shell)
 *   - <GovernedFlowButton />  small button (toggles the overlay)
 *   - <GovernedFlowKeyboardShortcut /> registers ⌘⇧G
 *
 * KNOWN TODOs:
 *   - Wire onApply to a real patch-application pipeline
 *   - Stream tool-call events from the coordinator into the active stage
 *     (currently ToolCallView is a typed slot the runtime doesn't fill yet)
 *   - Persist a small history of recent flows
 *   - "Why?" obligation source-jump
 */

import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useUiStore } from '@entities/ui-shell';
import { Button, Tooltip } from '@shared/ui';

export {
  GovernedFlowPanel,
  GovernedFlowOverlay,
  useGovernedFlowStore,
  runGovernedFlow,
} from './index';

interface ButtonProps {
  /** Compact icon-only style for the top bar. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Small button that opens the Governed Flow overlay. Shared between the
 * top bar and the existing ai-panel header so both invocations look the
 * same.
 */
export function GovernedFlowButton({
  iconOnly,
  className,
}: ButtonProps): JSX.Element {
  const openOverlay = useUiStore((s) => s.openOverlay);
  return (
    <Tooltip content="Governed Flow — Co-shipper (⌘⇧G)" side="bottom">
      <Button
        tone="ghost"
        size={iconOnly ? 'icon' : 'sm'}
        className={className}
        aria-label="Open Governed Flow"
        onClick={() => openOverlay('governedFlow')}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
        {iconOnly ? null : <span className="text-ink-2">Governed</span>}
      </Button>
    </Tooltip>
  );
}

/**
 * Keyboard shortcut registrant — render once at app root (or rely on
 * the integration in `ai-panel`). ⌘⇧G toggles the overlay.
 */
export function GovernedFlowKeyboardShortcut(): null {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const isOpen = useUiStore((s) => s.overlays.governedFlow?.open);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (isOpen) closeOverlay('governedFlow');
        else openOverlay('governedFlow');
      }
      if (e.key === 'Escape' && isOpen) {
        // Esc handled by the dialog itself.
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, openOverlay, closeOverlay]);

  return null;
}
