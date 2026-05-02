/**
 * Right-rail floating callout — slides in for `'use client'` typed events
 * (and could host other right-rail moments later).
 *
 * Auto-dismiss after 6s; sticks while hovered. Click "Map" → fires a custom
 * window event `nmi:open-client-map` so any consumer (e.g. blast-radius
 * panel) can react without us importing it directly. Read-only across phases.
 */

import { useEffect, useRef, useState } from 'react';
import { on } from '../bus';
import { prefersReducedMotion } from '../utils/spring';

interface CalloutData {
  file: string;
  filesAdded: number;
  kbAdded: number;
  shownAt: number;
}

export function MiniCallout(): JSX.Element | null {
  const [data, setData] = useState<CalloutData | null>(null);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return on('use-client-typed', (e) => {
      setData({
        file: e.file,
        filesAdded: e.filesAdded ?? 0,
        kbAdded: e.kbAdded ?? 0,
        shownAt: Date.now(),
      });
    });
  }, []);

  // Auto-dismiss timer; pauses while hovered.
  useEffect(() => {
    if (!data || hovered) {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setData(null);
      timerRef.current = null;
    }, 6000);
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, hovered]);

  if (!data) return null;
  const reduced = prefersReducedMotion();

  const handleMap = () => {
    window.dispatchEvent(
      new CustomEvent('nmi:open-client-map', { detail: { file: data.file } }),
    );
    setData(null);
  };

  return (
    <div
      role="status"
      data-nmi="mini-callout"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: 64,
        right: 16,
        zIndex: 70,
        maxWidth: 280,
        padding: '8px 10px',
        borderRadius: 10,
        background: 'hsl(var(--bg-elev, var(--bg)))',
        color: 'hsl(var(--text))',
        border: '1px solid hsl(var(--border))',
        boxShadow:
          '0 1px 2px hsl(var(--text) / 0.04), 0 8px 24px hsl(var(--text) / 0.10)',
        fontSize: 12,
        lineHeight: 1.35,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        animation: reduced
          ? undefined
          : 'spring-up 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'hsl(var(--accent))',
          }}
        />
        <span style={{ fontWeight: 500 }}>Client tree grew</span>
      </div>
      <div style={{ color: 'hsl(var(--text-2))' }}>
        +{data.filesAdded} files now in client tree (~{data.kbAdded}KB)
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button
          type="button"
          onClick={handleMap}
          className="mi-press"
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--bg))',
            color: 'hsl(var(--text))',
            cursor: 'pointer',
          }}
        >
          Map
        </button>
      </div>
    </div>
  );
}
