/**
 * Overlays a 1-line gradient sweep on a Monaco editor line. Triggered by
 * `use-client-typed` events. We acquire the active editor through the
 * monaco namespace's `getEditors()` to remain decoupled from editor-area.
 */

import { useEffect, useRef, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { on } from '../bus';
import { prefersReducedMotion } from '../utils/spring';

interface SweepEntry {
  id: number;
  file: string;
  line: number;
  top: number;
  height: number;
  width: number;
  startedAt: number;
}

const DURATION_MS = 600;

function fileFromModel(model: MonacoEditor.ITextModel): string {
  const raw = model.uri.path || model.uri.toString();
  try {
    return decodeURIComponent(raw).replace(/^\//, '');
  } catch {
    return raw.replace(/^\//, '');
  }
}

export function LineSweep(): JSX.Element | null {
  const monaco = useMonaco();
  const [entries, setEntries] = useState<SweepEntry[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!monaco) return undefined;
    return on('use-client-typed', (e) => {
      if (prefersReducedMotion()) return;
      // Find the editor whose model corresponds to the event file.
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
      const top = target.getTopForLineNumber(e.line);
      const lineHeight = target.getOption(
        // 66 = monaco.editor.EditorOption.lineHeight, but the enum value is
        // version-sensitive; use the API by name instead.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (monaco.editor as any).EditorOption?.lineHeight ?? 66,
      ) as number;
      const dom = target.getDomNode();
      if (!dom) return;
      const rect = dom.getBoundingClientRect();
      const scrollTop = target.getScrollTop();
      const id = ++idRef.current;
      setEntries((prev) => [
        ...prev,
        {
          id,
          file: e.file,
          line: e.line,
          top: rect.top + (top - scrollTop),
          height: lineHeight,
          width: rect.width,
          startedAt: Date.now(),
        },
      ]);
      window.setTimeout(() => {
        setEntries((prev) => prev.filter((x) => x.id !== id));
      }, DURATION_MS + 60);
    });
  }, [monaco]);

  if (entries.length === 0) return null;

  return (
    <div
      aria-hidden
      data-nmi="line-sweep-root"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 55,
      }}
    >
      {entries.map((e) => (
        <div
          key={e.id}
          data-nmi="line-sweep"
          style={{
            position: 'absolute',
            top: e.top + e.height - 2,
            left: 0,
            width: e.width,
            height: 1,
            background:
              'linear-gradient(90deg, transparent 0%, hsl(var(--accent) / 0.95) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: `hairline-sweep ${DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          }}
        />
      ))}
    </div>
  );
}
