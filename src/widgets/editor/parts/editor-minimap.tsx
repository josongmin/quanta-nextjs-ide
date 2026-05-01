import { useEffect, useMemo, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { match } from 'ts-pattern';
import { cn } from '@shared/lib/cn';
import { getSourceForFile } from '@shared/mocks';
import type { Diagnostic } from '@shared/types';

interface Props {
  file: string;
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  diagnostics: Diagnostic[];
  className?: string;
}

const ROW_HEIGHT = 2;
const MINIMAP_WIDTH = 80;

type RowKind =
  | 'empty'
  | 'comment'
  | 'err'
  | 'warn'
  | 'hint'
  | 'function'
  | 'import'
  | 'plain';

interface RowSpec {
  kind: RowKind;
  /** indent length in chars, used for visual width hint */
  indent: number;
  /** approximate non-whitespace text width (chars), used for hint cell */
  contentLen: number;
}

function detectRowKind(
  text: string,
  topSeverity: Diagnostic['severity'] | undefined,
): RowKind {
  if (!text.trim()) return 'empty';
  if (topSeverity === 'err') return 'err';
  if (topSeverity === 'warn') return 'warn';
  if (topSeverity === 'hint' || topSeverity === 'info') return 'hint';
  const t = text.trimStart();
  if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return 'comment';
  if (/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\b/.test(t)) return 'function';
  if (/^(?:export\s+)?(?:async\s+)?function\b/.test(t)) return 'function';
  if (/^import\b/.test(t) || /^export\s+\{/.test(t) || /^export\s+\*/.test(t)) {
    return 'import';
  }
  return 'plain';
}

function rowColorClass(kind: RowKind): string {
  return match(kind)
    .with('empty', () => 'bg-transparent')
    .with('comment', () => 'bg-ink-3/30')
    .with('err', () => 'bg-sev-err')
    .with('warn', () => 'bg-sev-warn')
    .with('hint', () => 'bg-ink-3/40')
    .with('function', () => 'bg-ink-2/60')
    .with('import', () => 'bg-ink-2/40')
    .with('plain', () => 'bg-ink-3/20')
    .exhaustive();
}

/**
 * Synthetic minimap rendered as a vertical strip of tiny colored rows.
 * Reads source from mocks and overlays a "viewport indicator" rectangle
 * synced to the live Monaco editor scroll position.
 */
export function EditorMinimap({ file, editor, diagnostics, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const source = getSourceForFile(file);

  const rows = useMemo<RowSpec[]>(() => {
    const dxByLine = new Map<number, Diagnostic['severity']>();
    for (const d of diagnostics) {
      if (d.location.file !== file) continue;
      const cur = dxByLine.get(d.location.line);
      // err > warn > info > hint
      const rank = (s: Diagnostic['severity']) =>
        s === 'err' ? 4 : s === 'warn' ? 3 : s === 'info' ? 2 : 1;
      if (!cur || rank(d.severity) > rank(cur)) {
        dxByLine.set(d.location.line, d.severity);
      }
    }
    const lines = source.split('\n');
    return lines.map((text, idx) => {
      const sev = dxByLine.get(idx + 1);
      const kind = detectRowKind(text, sev);
      const indent = text.length - text.trimStart().length;
      return { kind, indent, contentLen: text.trim().length };
    });
  }, [source, diagnostics, file]);

  // Viewport indicator state
  const [viewport, setViewport] = useState<{
    topLine: number;
    bottomLine: number;
  }>({ topLine: 1, bottomLine: 1 });

  useEffect(() => {
    if (!editor) return;

    const recompute = () => {
      const layout = editor.getLayoutInfo();
      const raw = editor.getRawOptions();
      const lineHeight =
        typeof raw.lineHeight === 'number' && raw.lineHeight > 0
          ? raw.lineHeight
          : 20;
      const sTop = editor.getScrollTop();
      const topLine = Math.max(1, Math.floor(sTop / lineHeight) + 1);
      const visibleLines = Math.max(1, Math.floor(layout.height / lineHeight));
      const bottomLine = topLine + visibleLines - 1;
      setViewport({ topLine, bottomLine });
    };

    recompute();
    const dispScroll = editor.onDidScrollChange(recompute);
    const dispLayout = editor.onDidLayoutChange(recompute);
    const dispContent = editor.onDidChangeModelContent(recompute);
    return () => {
      dispScroll.dispose();
      dispLayout.dispose();
      dispContent.dispose();
    };
  }, [editor]);

  const totalRows = rows.length;
  const totalHeight = totalRows * ROW_HEIGHT;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    const lineGuess = Math.max(1, Math.min(totalRows, Math.round(y / ROW_HEIGHT)));
    editor.revealLineInCenter(lineGuess);
    editor.focus();
  };

  // No editor yet → dim placeholder strip
  if (!editor) {
    return (
      <div
        aria-hidden
        className={cn(
          'shrink-0 hairline-l bg-bg-subtle/60',
          className,
        )}
        style={{ width: MINIMAP_WIDTH }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      role="presentation"
      onClick={handleClick}
      className={cn(
        'relative shrink-0 cursor-pointer overflow-y-auto overflow-x-hidden hairline-l bg-bg-subtle/40 select-none',
        className,
      )}
      style={{ width: MINIMAP_WIDTH }}
    >
      <div className="relative" style={{ height: totalHeight }}>
        {rows.map((r, i) => {
          if (r.kind === 'empty') {
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: i * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                  left: 0,
                  right: 0,
                }}
              />
            );
          }
          // crude content width — capped at minimap width; emphasizes shape
          const widthPx = Math.min(
            MINIMAP_WIDTH - 8,
            Math.max(2, Math.round(r.contentLen * 0.7)),
          );
          const leftPx = Math.min(
            MINIMAP_WIDTH - 4,
            Math.round(r.indent * 0.5) + 4,
          );
          const isSeverity = r.kind === 'err' || r.kind === 'warn' || r.kind === 'hint';
          return (
            <div
              key={i}
              className={cn(rowColorClass(r.kind))}
              style={{
                position: 'absolute',
                top: i * ROW_HEIGHT,
                height: isSeverity ? 1 : ROW_HEIGHT - 0.5,
                left: isSeverity ? 0 : leftPx,
                width: isSeverity ? MINIMAP_WIDTH : widthPx,
                opacity: isSeverity ? 0.9 : 0.85,
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border border-accent/40 bg-accent/10"
          style={{
            top: (viewport.topLine - 1) * ROW_HEIGHT,
            height: Math.max(
              ROW_HEIGHT * 2,
              (viewport.bottomLine - viewport.topLine + 1) * ROW_HEIGHT,
            ),
          }}
        />
      </div>
    </div>
  );
}
