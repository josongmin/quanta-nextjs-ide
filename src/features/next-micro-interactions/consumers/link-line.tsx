/**
 * Draws a quick SVG curve between two editor lines (server-action def → call)
 * when a `server-action-linked` event fires. Auto-fades after 1200ms.
 */

import { useEffect, useRef, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { on } from '../bus';
import { prefersReducedMotion } from '../utils/spring';

interface LinkEntry {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const VISIBLE_MS = 1200;

function fileFromModel(model: MonacoEditor.ITextModel): string {
  const raw = model.uri.path || model.uri.toString();
  try {
    return decodeURIComponent(raw).replace(/^\//, '');
  } catch {
    return raw.replace(/^\//, '');
  }
}

export function LinkLine(): JSX.Element | null {
  const monaco = useMonaco();
  const [entries, setEntries] = useState<LinkEntry[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!monaco) return undefined;
    return on('server-action-linked', (e) => {
      if (prefersReducedMotion()) return;
      const eds = monaco.editor.getEditors();
      let target: MonacoEditor.ICodeEditor | undefined;
      for (const ed of eds) {
        const m = ed.getModel();
        if (m && fileFromModel(m) === e.file) {
          target = ed;
          break;
        }
      }
      if (!target) return;
      const dom = target.getDomNode();
      if (!dom) return;
      const rect = dom.getBoundingClientRect();
      const scrollTop = target.getScrollTop();
      const fromY = rect.top + (target.getTopForLineNumber(e.defLine) - scrollTop) + 8;
      const toY = rect.top + (target.getTopForLineNumber(e.callLine) - scrollTop) + 8;
      const id = ++idRef.current;
      setEntries((prev) => [
        ...prev,
        {
          id,
          fromX: rect.left + 24,
          fromY,
          toX: rect.left + 60,
          toY,
        },
      ]);
      window.setTimeout(() => {
        setEntries((prev) => prev.filter((x) => x.id !== id));
      }, VISIBLE_MS);
    });
  }, [monaco]);

  if (entries.length === 0) return null;

  return (
    <svg
      aria-hidden
      data-nmi="link-line-root"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 55,
        width: '100vw',
        height: '100vh',
      }}
    >
      {entries.map((e) => {
        const midX = (e.fromX + e.toX) / 2 + 32;
        const d = `M ${e.fromX} ${e.fromY} Q ${midX} ${(e.fromY + e.toY) / 2} ${e.toX} ${e.toY}`;
        return (
          <path
            key={e.id}
            d={d}
            stroke="hsl(var(--accent))"
            strokeWidth={1.25}
            strokeOpacity={0.75}
            fill="none"
            strokeLinecap="round"
            style={{
              animation:
                'nmi-link-fade 1200ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
              strokeDasharray: 240,
              strokeDashoffset: 240,
            }}
          />
        );
      })}
      <style>{`
        @keyframes nmi-link-fade {
          0% { stroke-dashoffset: 240; opacity: 0; }
          25% { opacity: 1; }
          60% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>
    </svg>
  );
}
