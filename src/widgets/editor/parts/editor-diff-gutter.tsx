import { useEffect, useMemo, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { match } from 'ts-pattern';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useSemanticDiffStore } from '@entities/semantic-diff';
import type { SemanticDiffEntry } from '@shared/types';
import { Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Props {
  /** target file currently shown in the editor */
  file: string;
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  /** absolute left offset (px) where this 6-px strip should be placed */
  left: number;
  className?: string;
}

export const DIFF_GUTTER_WIDTH = 6;

/** plausible target lines per file (mock), since SemanticDiffEntry has no line info */
const FALLBACK_LINES = [1, 8, 14] as const;

interface MarkSpec {
  line: number;
  entry: SemanticDiffEntry;
}

function colorFor(category: SemanticDiffEntry['category']): string {
  return match(category)
    .with('rendering', () => 'bg-sev-warn')
    .with('cache', () => 'bg-sev-info')
    .with('boundary', () => 'bg-sem-client')
    .with('auth', () => 'bg-sev-err')
    .with('contract', () => 'bg-sev-err')
    .with('cost', () => 'bg-sev-warn')
    .with('metadata', () => 'bg-ink-3')
    .exhaustive();
}

interface VisibleMark {
  spec: MarkSpec;
  top: number;
  height: number;
}

export function EditorDiffGutter({ file, editor, left, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const diff = useSemanticDiffStore((s) => s.diff);
  const setSelected = useSemanticDiffStore((s) => s.setSelected);
  const setBottomTab = useUiStore((s) => s.setBottomTab);
  const routes = useRouteStore((s) => s.routes);

  const marks = useMemo<MarkSpec[]>(() => {
    const out: MarkSpec[] = [];
    let i = 0;
    for (const entry of diff.entries) {
      if (!entry.routeId) continue;
      const route = routes.find((r) => r.id === entry.routeId);
      if (!route) continue;
      if (route.files.page !== file && route.files.layout !== file) continue;
      const fallback = FALLBACK_LINES[i % FALLBACK_LINES.length] ?? 1;
      i += 1;
      out.push({ line: fallback, entry });
    }
    return out;
  }, [diff, routes, file]);

  const [visible, setVisible] = useState<VisibleMark[]>([]);
  const [scrollTop, setScrollTop] = useState(0);

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
      const next: VisibleMark[] = [];
      for (const m of marks) {
        const top = editor.getTopForLineNumber(m.line);
        if (top + lineHeight < sTop) continue;
        if (top > sTop + layout.height + lineHeight) continue;
        next.push({ spec: m, top, height: lineHeight });
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
  }, [editor, marks]);

  const handleClick = (entry: SemanticDiffEntry) => {
    setBottomTab('semantic-diff');
    setSelected(entry.id);
  };

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('absolute top-0 z-10 h-full overflow-hidden', className)}
      style={{ left, width: DIFF_GUTTER_WIDTH }}
    >
      {visible.map(({ spec, top, height }) => (
        <Tooltip
          key={`${spec.entry.id}-${spec.line}`}
          content={
            <div className="flex flex-col gap-0.5 text-[11px] leading-tight">
              <span className="font-medium text-ink-1">
                semantic-diff · {spec.entry.category}
              </span>
              <span className="text-ink-2">{spec.entry.scope}</span>
              <span className="text-ink-3">
                {spec.entry.before} → {spec.entry.after}
              </span>
              {spec.entry.cause ? (
                <span className="text-ink-3">{spec.entry.cause}</span>
              ) : null}
            </div>
          }
          side="right"
        >
          <button
            type="button"
            onClick={() => handleClick(spec.entry)}
            aria-label={`Open semantic diff for line ${spec.line}`}
            className={cn(
              'absolute left-1 right-1 cursor-pointer rounded-[1px] hover:opacity-100',
              colorFor(spec.entry.category),
            )}
            style={{
              top: top - scrollTop,
              height: Math.max(4, height - 6),
              opacity: 0.8,
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
}
