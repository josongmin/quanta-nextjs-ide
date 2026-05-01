import { useEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  useDismiss,
  useInteractions,
  useRole,
  FloatingPortal,
  type ReferenceType,
} from '@floating-ui/react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { EvidenceCard } from '@shared/ui';
import type { Diagnostic } from '@shared/types';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  diagnosticsByLine: Map<number, Diagnostic[]>;
}

export function DiagnosticHover({ editor, diagnosticsByLine }: Props) {
  const [diag, setDiag] = useState<Diagnostic | null>(null);
  const [virtualRef, setVirtualRef] = useState<ReferenceType | null>(null);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const activeLineRef = useRef<number | null>(null);
  const activeDiagIdRef = useRef<string | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: !!diag,
    strategy: 'fixed',
    onOpenChange: (open) => {
      if (!open) {
        setDiag(null);
        setVirtualRef(null);
        activeLineRef.current = null;
        activeDiagIdRef.current = null;
      }
    },
    placement: 'top-start',
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.max(220, availableHeight - 16)}px`;
        },
      }),
    ],
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  useEffect(() => {
    refs.setReference(virtualRef);
  }, [virtualRef, refs]);

  useEffect(() => {
    if (!editor) return;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const close = () => {
      setDiag(null);
      setVirtualRef(null);
      activeLineRef.current = null;
      activeDiagIdRef.current = null;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    /**
     * NON-resetting scheduler — if a hide is already pending we keep the
     * original deadline. Otherwise every mouse move over empty space
     * resets the timer and the popover never goes away.
     */
    const scheduleCloseOnce = (ms: number) => {
      if (hideTimer) return;
      hideTimer = setTimeout(close, ms);
    };

    const cancelClose = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const dispose = editor.onMouseMove((e) => {
      const target = e.target;
      // Trigger ONLY on actual text. CONTENT_EMPTY (= trailing whitespace
      // past the end of the line) is a hover dead zone — keeping the
      // popover alive there is what made it appear "stuck in a wrong
      // place" when the user hovered an empty line.
      if (target.type !== 6 /* CONTENT_TEXT */) {
        if (activeLineRef.current !== null) scheduleCloseOnce(120);
        return;
      }
      const lineNumber = target.position?.lineNumber;
      if (!lineNumber) {
        if (activeLineRef.current !== null) scheduleCloseOnce(120);
        return;
      }
      const list = diagnosticsByLine.get(lineNumber);
      const top = list?.[0];
      if (!top) {
        // Mouse is on a line with no diagnostic — close fast and only once.
        if (activeLineRef.current !== null) scheduleCloseOnce(120);
        return;
      }

      // If we're still hovering the same line + same top diagnostic, keep
      // the popover anchored where it was (don't re-position with cursor).
      if (
        activeLineRef.current === lineNumber &&
        activeDiagIdRef.current === top.id
      ) {
        cancelClose();
        return;
      }

      // ── Compute a stable anchor at the LINE position ──────────────────────
      // Y: top of the hovered line in viewport coordinates.
      // X: cursor X in viewport coordinates (so the popover appears near
      //    where the user is actually looking).
      const dom = editor.getDomNode();
      if (!dom) return;
      const coords = editor.getScrolledVisiblePosition({
        lineNumber,
        column: target.position?.column ?? 1,
      });
      if (!coords) return;
      const editorRect = dom.getBoundingClientRect();
      const lineTopY = editorRect.top + coords.top;
      const lineHeight = coords.height || 20;

      const browser = e.event.browserEvent as MouseEvent | undefined;
      const cursorX = browser?.clientX ?? editorRect.left + coords.left;
      // Clamp X so popover doesn't end up off-screen on extremely long lines
      const x = Math.min(
        Math.max(cursorX, editorRect.left + 32),
        editorRect.right - 32,
      );

      cancelClose();
      setDiag(top);
      activeLineRef.current = lineNumber;
      activeDiagIdRef.current = top.id;
      // Reference rect = the hovered LINE's vertical band, anchored at the
      // mouse X. With placement='top-start' + offset 8 the popover sits 8px
      // above the line, left-aligned to the cursor.
      setVirtualRef({
        getBoundingClientRect: () => ({
          x,
          y: lineTopY,
          left: x,
          top: lineTopY,
          right: x + 1,
          bottom: lineTopY + lineHeight,
          width: 1,
          height: lineHeight,
          toJSON() {
            return this;
          },
        }),
      });
    });

    const disposeLeave = editor.onMouseLeave(() => {
      // Mouse left the editor entirely — close immediately.
      close();
    });

    // Close on scroll — frozen ref would otherwise drift away from the line.
    const disposeScroll = editor.onDidScrollChange(() => {
      close();
    });

    return () => {
      dispose.dispose();
      disposeLeave.dispose();
      disposeScroll.dispose();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [editor, diagnosticsByLine]);

  if (!diag || !virtualRef) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-50"
        // Allow the user to mouse onto the card without dismissing.
        onMouseEnter={() => {
          // no-op — presence inside the portal already keeps it open via dismiss config
        }}
      >
        <EvidenceCard
          diagnostic={diag}
          onShowTrace={() => {
            openOverlay('evidenceTracer', { diagnosticId: diag.id });
            setDiag(null);
          }}
          onApplyFix={(fixId) =>
            toast('Quick fix queued', {
              description: `${diag.title} · fix ${fixId}`,
            })
          }
          onMute={(scope) => toast(`Muted ${scope}`, { description: diag.ruleId })}
        />
      </div>
    </FloatingPortal>
  );
}
