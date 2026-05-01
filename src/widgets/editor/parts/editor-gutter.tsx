import { useEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { match } from 'ts-pattern';
import { cn } from '@shared/lib/cn';
import { SignBar } from '@shared/ui';
import type { FileSemantics, LineInfo } from '../use-line-semantics';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  semantics: FileSemantics;
  onClickBlast(line: number): void;
}

interface VisibleLine {
  line: LineInfo;
  top: number;
  height: number;
}

const COL_A = 36; // line numbers
const COL_B = 8;  // severity dot
const COL_C = 8;  // sign bar
const COL_D = 28; // blast number

export const GUTTER_WIDTH = COL_A + COL_B + COL_C + COL_D;

export function EditorGutter({ editor, semantics, onClickBlast }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<VisibleLine[]>([]);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const recompute = () => {
      const layoutInfo = editor.getLayoutInfo();
      // Pull lineHeight from raw options (avoids brittle EditorOption-id lookup).
      const raw = editor.getRawOptions();
      const lineHeight = (typeof raw.lineHeight === 'number' && raw.lineHeight > 0)
        ? raw.lineHeight
        : 20;
      const next: VisibleLine[] = [];
      const totalLines = semantics.lines.length;
      const sTop = editor.getScrollTop();
      const viewportH = layoutInfo.height;
      for (let i = 0; i < totalLines; i++) {
        const li = semantics.lines[i];
        if (!li) continue;
        const top = editor.getTopForLineNumber(li.line);
        if (top + lineHeight < sTop) continue;
        if (top > sTop + viewportH + lineHeight) break;
        next.push({ line: li, top, height: lineHeight });
      }
      setVisible(next);
      setScrollTop(sTop);
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
  }, [editor, semantics]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-10 h-full overflow-hidden bg-bg select-none"
      style={{ width: GUTTER_WIDTH }}
    >
      {visible.map(({ line, top, height }) => {
        const dx = semantics.diagnosticsByLine.get(line.line) ?? [];
        const top1 = dx[0];
        return (
          <div
            key={line.line}
            className="absolute left-0 grid items-center font-mono text-[11px]"
            style={{
              top: top - scrollTop,
              height,
              gridTemplateColumns: `${COL_A}px ${COL_B}px ${COL_C}px ${COL_D}px`,
            }}
          >
            {/* A — line number */}
            <span className="pr-2 text-right text-ink-3 tabular-nums">
              {line.line}
            </span>
            {/* B — severity dot */}
            <span className="flex h-full w-full items-center justify-center">
              {top1 ? (
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    top1.severity === 'err' && 'bg-sev-err',
                    top1.severity === 'warn' && 'bg-sev-warn',
                    top1.severity === 'info' && 'bg-sev-info',
                    top1.severity === 'hint' && 'bg-sev-hint',
                  )}
                />
              ) : null}
            </span>
            {/* C — classification sign bar */}
            <span className="flex h-full w-full items-center justify-center">
              {line.classMark ? (
                <SignBar
                  tone={match(line.classMark)
                    .with('static', () => 'static' as const)
                    .with('isr', () => 'isr' as const)
                    .with('dynamic', () => 'dynamic' as const)
                    .with('client', () => 'client' as const)
                    .with('server', () => 'server' as const)
                    .with('err', () => 'err' as const)
                    .with('warn', () => 'warn' as const)
                    .exhaustive()}
                  width="thick"
                  className="h-3"
                />
              ) : null}
            </span>
            {/* D — blast number */}
            <span className="pointer-events-auto flex h-full w-full items-center justify-center">
              {typeof line.blast === 'number' && line.blast > 0 ? (
                <button
                  type="button"
                  onClick={() => onClickBlast(line.line)}
                  className="rounded px-0.5 text-[10px] text-ink-3 hover:bg-bg-hover hover:text-accent"
                  aria-label={`Show blast for line ${line.line}`}
                >
                  ↓{line.blast}
                </button>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
