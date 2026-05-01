import { useEffect, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { LinkedEditingHint } from '@features/linked-editing';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
}

interface LinkPair {
  tag: string;
  open: { line: number; startCol: number; endCol: number };
  close: { line: number; startCol: number; endCol: number };
}

interface PositionedPair extends LinkPair {
  openTop: number;
  openLeft: number;
  openWidth: number;
  closeTop: number;
  closeLeft: number;
  closeWidth: number;
  height: number;
}

const TAG_TOKEN_RE = /<(\/?)([A-Za-z][A-Za-z0-9_]*)\b([^<>]*?)(\/?)>/g;

interface TagToken {
  line: number;
  startCol: number;
  endCol: number;
  tag: string;
  /** "open", "close", or "self-closing". */
  kind: 'open' | 'close' | 'self';
}

/**
 * Tokenize ALL JSX-ish tags between `fromLine` and `toLine` (inclusive).
 */
function tokenizeTags(
  model: MonacoEditor.ITextModel,
  fromLine: number,
  toLine: number,
): TagToken[] {
  const out: TagToken[] = [];
  for (let line = fromLine; line <= toLine; line++) {
    const text = model.getLineContent(line);
    TAG_TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TAG_TOKEN_RE.exec(text)) !== null) {
      const isClose = m[1] === '/';
      const isSelf = m[4] === '/';
      const tag = m[2];
      if (!tag) continue;
      const startCol = m.index + 1;
      const endCol = startCol + m[0].length;
      out.push({
        line,
        startCol,
        endCol,
        tag,
        kind: isClose ? 'close' : isSelf ? 'self' : 'open',
      });
    }
  }
  return out;
}

/**
 * Given the cursor line/column, find an enclosing JSX <Tag> opening token on
 * the cursor's line and the matching closing tag using stack-based pairing.
 */
function findPair(
  model: MonacoEditor.ITextModel,
  cursorLine: number,
  cursorCol: number,
): LinkPair | null {
  const totalLines = model.getLineCount();
  // Scan a bounded window forward — visible-only spec says ~150 lines max.
  const windowEnd = Math.min(totalLines, cursorLine + 200);
  const tokens = tokenizeTags(model, cursorLine, windowEnd);

  // Find the opening tag on cursorLine whose range contains the cursor.
  let opener: TagToken | null = null;
  let openIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (t.line !== cursorLine) break;
    if (t.kind !== 'open') continue;
    if (cursorCol >= t.startCol && cursorCol <= t.endCol) {
      opener = t;
      openIdx = i;
      break;
    }
  }
  if (!opener || openIdx < 0) return null;

  // Now stack-walk forward from openIdx+1 looking for matching closing tag.
  let depth = 1;
  for (let i = openIdx + 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (t.tag !== opener.tag) continue;
    if (t.kind === 'self') continue;
    if (t.kind === 'open') depth += 1;
    else if (t.kind === 'close') {
      depth -= 1;
      if (depth === 0) {
        return {
          tag: opener.tag,
          open: {
            line: opener.line,
            startCol: opener.startCol,
            endCol: opener.endCol,
          },
          close: { line: t.line, startCol: t.startCol, endCol: t.endCol },
        };
      }
    }
  }
  return null;
}

const SCAN_DEBOUNCE_MS = 70;

export function LinkedEditingLayer({ editor, file }: Props) {
  const [pair, setPair] = useState<PositionedPair | null>(null);

  useEffect(() => {
    if (!editor) {
      setPair(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;

    const compute = () => {
      const model = editor.getModel();
      const pos = editor.getPosition();
      if (!model || !pos) {
        setPair(null);
        return;
      }
      const found = findPair(model, pos.lineNumber, pos.column);
      if (!found) {
        setPair(null);
        return;
      }
      const openStart = editor.getScrolledVisiblePosition({
        lineNumber: found.open.line,
        column: found.open.startCol,
      });
      const openEnd = editor.getScrolledVisiblePosition({
        lineNumber: found.open.line,
        column: found.open.endCol,
      });
      const closeStart = editor.getScrolledVisiblePosition({
        lineNumber: found.close.line,
        column: found.close.startCol,
      });
      const closeEnd = editor.getScrolledVisiblePosition({
        lineNumber: found.close.line,
        column: found.close.endCol,
      });
      if (!openStart || !openEnd || !closeStart || !closeEnd) {
        setPair(null);
        return;
      }
      setPair({
        ...found,
        openTop: openStart.top,
        openLeft: openStart.left,
        openWidth: Math.max(2, openEnd.left - openStart.left),
        closeTop: closeStart.top,
        closeLeft: closeStart.left,
        closeWidth: Math.max(2, closeEnd.left - closeStart.left),
        height: openStart.height || 20,
      });
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(compute, SCAN_DEBOUNCE_MS);
    };

    compute();
    const dCursor = editor.onDidChangeCursorPosition(schedule);
    const dContent = editor.onDidChangeModelContent(schedule);
    const dScroll = editor.onDidScrollChange(schedule);
    const dLayout = editor.onDidLayoutChange(schedule);

    return () => {
      dCursor.dispose();
      dContent.dispose();
      dScroll.dispose();
      dLayout.dispose();
      if (timer) clearTimeout(timer);
    };
  }, [editor, file]);

  if (!editor || !pair) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
    >
      {/* Open tag underline */}
      <div
        className="absolute rounded-[1px] bg-accent/30"
        style={{
          top: pair.openTop + pair.height - 2,
          left: pair.openLeft,
          width: pair.openWidth,
          height: 2,
        }}
      />
      {/* Close tag underline */}
      <div
        className="absolute rounded-[1px] bg-accent/30"
        style={{
          top: pair.closeTop + pair.height - 2,
          left: pair.closeLeft,
          width: pair.closeWidth,
          height: 2,
        }}
      />
      {/* Hint chip near the closing tag */}
      <div
        className="absolute"
        style={{
          top: pair.closeTop + pair.height + 2,
          left: pair.closeLeft,
        }}
      >
        <LinkedEditingHint tag={pair.tag} />
      </div>
    </div>
  );
}
