import { useEffect, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { AnnotationComposer, AnnotationPin } from '@features/annotations';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
  /** Horizontal offset from the editor's left edge, in pixels. */
  left?: number;
}

interface PinPosition {
  id: string;
  index: number;
  body: string;
  line: number;
  top: number;
}

const DEFAULT_LEFT = 8;
const LINE_HEIGHT_FALLBACK = 20;

/**
 * Floating layer that renders annotation pins (and a composer affordance for
 * the cursor's line) above the editor. Stays in sync with Monaco scrolling
 * via `onDidScrollChange`.
 */
export function AnnotationsLayer({ editor, file, left = DEFAULT_LEFT }: Props) {
  const all = useUiStore((s) => s.annotations);
  const annotations = all.filter((a) => a.file === file);
  const cursor = useEditorStore((s) => s.cursor);

  const [scrollTick, setScrollTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setScrollTick((t) => (t + 1) % 1_000_000);
    bump();
    const dScroll = editor.onDidScrollChange(bump);
    const dLayout = editor.onDidLayoutChange(bump);
    const dContent = editor.onDidChangeModelContent(bump);
    return () => {
      dScroll.dispose();
      dLayout.dispose();
      dContent.dispose();
    };
  }, [editor]);

  // Recompute screen-y of each annotation on every relevant change.
  const positions: PinPosition[] = (() => {
    if (!editor) return [];
    void scrollTick; // dependency for refresh
    const raw = editor.getRawOptions();
    const lineHeight =
      typeof raw.lineHeight === 'number' && raw.lineHeight > 0
        ? raw.lineHeight
        : LINE_HEIGHT_FALLBACK;
    const sTop = editor.getScrollTop();
    const out: PinPosition[] = [];
    annotations.forEach((a, i) => {
      const top = editor.getTopForLineNumber(a.line) - sTop;
      // Allow some clipping but skip wildly off-screen pins.
      if (top < -lineHeight * 2) return;
      out.push({
        id: a.id,
        index: i + 1,
        body: a.body,
        line: a.line,
        top,
      });
    });
    return out;
  })();

  // Composer affordance — anchored to the cursor's current line, only when the
  // cursor is in this file.
  const composerLine = cursor && cursor.file === file ? cursor.line : null;
  const composerTop =
    editor && composerLine != null
      ? editor.getTopForLineNumber(composerLine) - editor.getScrollTop()
      : null;

  return (
    <div
      aria-hidden={false}
      className="pointer-events-none absolute top-0 z-30 h-full"
      style={{ left, width: 24 }}
    >
      {positions.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{ top: p.top, transform: 'translateY(2px)' }}
        >
          <AnnotationPin
            id={p.id}
            index={p.index}
            body={p.body}
            file={file}
            line={p.line}
          />
        </div>
      ))}

      {composerTop != null && composerLine != null ? (
        <div
          className={cn(
            'absolute opacity-40 transition-opacity duration-150',
            'hover:opacity-100 focus-within:opacity-100',
          )}
          style={{ top: composerTop, transform: 'translateY(2px)' }}
        >
          <AnnotationComposer file={file} line={composerLine}>
            <button
              type="button"
              className={cn(
                'pointer-events-auto inline-flex h-4 w-4 items-center justify-center',
                'rounded-full border border-line bg-bg text-ink-3',
                'hover:border-accent hover:text-accent',
              )}
              aria-label={`Add annotation at line ${composerLine}`}
            >
              <Icon.Plus className="h-2.5 w-2.5" />
            </button>
          </AnnotationComposer>
        </div>
      ) : null}
    </div>
  );
}
