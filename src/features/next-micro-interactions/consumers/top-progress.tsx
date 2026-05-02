/**
 * 1px top-of-editor progress bar. Listens for build-started/success/failed
 * events and animates a hairline gradient sweep.
 *
 * Mounted globally — positions itself fixed at the top of the editor area
 * via a CSS-only anchor (`[data-editor-area]`). Falls back to top-of-viewport
 * if no anchor is found, which keeps Storybook/dev simple.
 */

import { useEffect, useRef, useState } from 'react';
import { on } from '../bus';
import { prefersReducedMotion } from '../utils/spring';

type Phase = 'idle' | 'running' | 'success' | 'failed';

export function TopProgress(): JSX.Element | null {
  const [phase, setPhase] = useState<Phase>('idle');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const offStart = on('build-started', () => setPhase('running'));
    const offSuccess = on('build-success', () => {
      setPhase('success');
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      // Flash green, then sweep out, then idle.
      timerRef.current = window.setTimeout(() => {
        setPhase('idle');
        timerRef.current = null;
      }, 380);
    });
    const offFailed = on('build-failed', () => {
      setPhase('failed');
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setPhase('idle');
        timerRef.current = null;
      }, 480);
    });
    return () => {
      offStart();
      offSuccess();
      offFailed();
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (phase === 'idle') return null;

  const reduced = prefersReducedMotion();

  // Common layout: a 1px tall bar, full width, fixed near the top.
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    pointerEvents: 'none',
    zIndex: 60,
  };

  if (phase === 'running') {
    const fill: React.CSSProperties = reduced
      ? { background: 'hsl(var(--accent) / 0.6)' }
      : {
          background:
            'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.85) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'hairline-sweep 1200ms linear infinite',
        };
    return (
      <div
        data-nmi="top-progress"
        data-phase="running"
        style={{ ...baseStyle, ...fill }}
        aria-hidden
      />
    );
  }

  if (phase === 'success') {
    return (
      <div
        data-nmi="top-progress"
        data-phase="success"
        style={{
          ...baseStyle,
          background:
            'linear-gradient(90deg, transparent, hsl(var(--success, 142 71% 45%) / 0.95), transparent)',
          backgroundSize: '200% 100%',
          animation: reduced
            ? undefined
            : 'hairline-sweep 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
        aria-hidden
      />
    );
  }

  // failed
  return (
    <div
      data-nmi="top-progress"
      data-phase="failed"
      style={{
        ...baseStyle,
        background: 'hsl(var(--danger, 0 72% 51%) / 0.85)',
        opacity: reduced ? 1 : 0.9,
        transition: 'opacity 320ms ease-out',
      }}
      aria-hidden
    />
  );
}
