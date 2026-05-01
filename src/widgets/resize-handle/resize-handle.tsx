import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  orientation: 'vertical' | 'horizontal';
  onResize(deltaPx: number): void;
  onDoubleClick?(): void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Pixel-stable resize handle.
 *
 * Sources of jitter that this component eliminates:
 *  1. The handle's own width must NOT change between resting and hover/drag —
 *     a 1px shift on the handle itself causes the entire panel layout to nudge.
 *     Visual feedback comes from a wider (transparent) hit area + colour only.
 *  2. PointerMove fires more often than the browser can paint. We coalesce all
 *     deltas inside a single requestAnimationFrame tick before calling
 *     onResize, so the panel updates exactly once per frame.
 *  3. Sub-pixel cursor positions: clientX/Y can be fractional. We round before
 *     applying so widths are always integer pixels.
 *  4. Browser text selection during drag causes flicker; we lock body
 *     user-select for the duration of the drag.
 */
export function ResizeHandle({
  orientation,
  onResize,
  onDoubleClick,
  className,
  ariaLabel,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const flushPending = useCallback(() => {
    rafRef.current = null;
    const d = pendingDeltaRef.current;
    if (d === 0) return;
    pendingDeltaRef.current = 0;
    onResize(d);
  }, [onResize]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startRef.current =
        orientation === 'vertical' ? Math.round(e.clientX) : Math.round(e.clientY);
      pendingDeltaRef.current = 0;
      setDragging(true);
    },
    [orientation],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (startRef.current == null) return;
      const cur =
        orientation === 'vertical' ? Math.round(e.clientX) : Math.round(e.clientY);
      const delta = cur - startRef.current;
      if (delta === 0) return;
      startRef.current = cur;
      pendingDeltaRef.current += delta;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushPending);
      }
    },
    [orientation, flushPending],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      startRef.current = null;
      // Flush any in-flight delta synchronously so the final position is
      // committed before the user lets go.
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      flushPending();
      setDragging(false);
    },
    [flushPending],
  );

  // Lock body cursor + selection for the duration of a drag.
  useEffect(() => {
    if (!dragging) return;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    const prevWebkitUserSelect = (document.body.style as unknown as {
      webkitUserSelect?: string;
    }).webkitUserSelect ?? '';
    document.body.style.cursor =
      orientation === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    (document.body.style as unknown as { webkitUserSelect?: string }).webkitUserSelect =
      'none';
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      (document.body.style as unknown as { webkitUserSelect?: string }).webkitUserSelect =
        prevWebkitUserSelect;
    };
  }, [dragging, orientation]);

  // Cleanup any pending raf on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      role="separator"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      // Visible bar is FIXED at 1px — no width transition, no hover swell.
      // Hit area is widened separately (the absolutely-positioned span below).
      className={cn(
        'group relative shrink-0 select-none touch-none',
        orientation === 'vertical' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        dragging
          ? 'bg-accent'
          : 'bg-line transition-colors duration-150 hover:bg-accent',
        className,
      )}
      style={{ touchAction: 'none' }}
    >
      {/* Larger transparent hit area so users don't have to hit a 1px line.
          Does not contribute to layout. */}
      <span
        aria-hidden
        className={cn(
          'absolute',
          orientation === 'vertical'
            ? 'inset-y-0 -left-1.5 -right-1.5'
            : 'inset-x-0 -top-1.5 -bottom-1.5',
        )}
      />
    </div>
  );
}
