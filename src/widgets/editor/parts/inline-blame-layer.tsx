import { useEffect, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { InlineBlame, blameForLine } from '@features/inline-blame';
import { cn } from '@shared/lib/cn';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
}

interface AnchorState {
  line: number;
  top: number;
  left: number;
  height: number;
}

/**
 * Minimum gap between end-of-line text and the blame chip. Keeps the blame
 * far enough away that it never collides with lens chips or ghost
 * annotations rendered on the same line.
 */
const MIN_GAP_FROM_TEXT = 96;

/**
 * Inline blame overlay — VS Code GitLens-style ghost row showing author /
 * age / subject for the cursor's current line. Position recomputed on
 * cursor move + scroll.
 */
export function InlineBlameLayer({ editor, file }: Props) {
  const [anchor, setAnchor] = useState<AnchorState | null>(null);

  useEffect(() => {
    if (!editor) {
      setAnchor(null);
      return;
    }

    const recompute = () => {
      const pos = editor.getPosition();
      if (!pos) {
        setAnchor(null);
        return;
      }
      const blame = blameForLine(file, pos.lineNumber);
      if (!blame) {
        setAnchor(null);
        return;
      }
      const model = editor.getModel();
      if (!model) {
        setAnchor(null);
        return;
      }
      const maxColumn = model.getLineMaxColumn(pos.lineNumber);
      const coords = editor.getScrolledVisiblePosition({
        lineNumber: pos.lineNumber,
        column: maxColumn,
      });
      if (!coords) {
        setAnchor(null);
        return;
      }
      // Anchor at end-of-line, but pushed far enough right that the blame
      // never collides with code-lens chips or ghost annotations rendered
      // by other overlays on the same line.
      setAnchor({
        line: pos.lineNumber,
        top: coords.top,
        left: coords.left + MIN_GAP_FROM_TEXT,
        height: coords.height || 20,
      });
    };

    recompute();

    const dCursor = editor.onDidChangeCursorPosition(recompute);
    const dScroll = editor.onDidScrollChange(recompute);
    const dContent = editor.onDidChangeModelContent(recompute);
    const dLayout = editor.onDidLayoutChange(recompute);

    return () => {
      dCursor.dispose();
      dScroll.dispose();
      dContent.dispose();
      dLayout.dispose();
    };
  }, [editor, file]);

  if (!editor || !anchor) return null;

  const blame = blameForLine(file, anchor.line);
  if (!blame) return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-[6] flex items-center',
        'rounded-md px-1.5',
        'opacity-55 transition-opacity duration-moderate ease-swift-out',
        'hover:opacity-100',
      )}
      style={{
        top: anchor.top,
        left: anchor.left,
        height: anchor.height,
      }}
    >
      <InlineBlame entry={blame} />
    </div>
  );
}
