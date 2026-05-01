import { useEffect, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { InlineBlame, blameForLine } from '@features/inline-blame';

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

const MIN_LEFT_OFFSET = 32;

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
      // Anchor at end-of-line; clamp so we never escape the editor surface.
      setAnchor({
        line: pos.lineNumber,
        top: coords.top,
        left: Math.max(MIN_LEFT_OFFSET, coords.left + 16),
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
      className="pointer-events-none absolute z-20 flex items-center"
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
