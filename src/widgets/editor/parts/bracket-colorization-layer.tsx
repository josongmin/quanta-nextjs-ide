import { useEffect, useId, useRef } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
}

interface Pos {
  line: number;
  col: number;
}

interface BracketPair {
  open: Pos;
  close: Pos;
  depth: number;
  kind: '{' | '(' | '[';
}

const COLORS = ['#7c4dff', '#0e9f6e', '#d97706', '#0284c7', '#dc2626'];

function isOpener(c: string): c is '{' | '(' | '[' {
  return c === '{' || c === '(' || c === '[';
}

function matchClose(c: string, open: string): boolean {
  return (
    (c === '}' && open === '{') ||
    (c === ')' && open === '(') ||
    (c === ']' && open === '[')
  );
}

function scanPairs(model: MonacoEditor.ITextModel): BracketPair[] {
  const stack: { kind: '{' | '(' | '['; pos: Pos; depth: number }[] = [];
  const out: BracketPair[] = [];
  const total = model.getLineCount();
  for (let line = 1; line <= total; line++) {
    const text = model.getLineContent(line);
    let inStr: string | null = null;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charAt(i);
      if (inStr) {
        if (ch === '\\') {
          i++;
          continue;
        }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === '/' && text.charAt(i + 1) === '/') break;
      if (ch === '"' || ch === "'" || ch === '`') {
        inStr = ch;
        continue;
      }
      if (isOpener(ch)) {
        stack.push({
          kind: ch,
          pos: { line, col: i + 1 },
          depth: stack.length,
        });
      } else if (ch === '}' || ch === ')' || ch === ']') {
        const top = stack[stack.length - 1];
        if (top && matchClose(ch, top.kind)) {
          stack.pop();
          out.push({
            open: top.pos,
            close: { line, col: i + 1 },
            depth: top.depth,
            kind: top.kind,
          });
        }
      }
    }
  }
  return out;
}

export function BracketColorizationLayer({ editor }: Props) {
  const styleId = useId().replace(/[:]/g, '');
  const collectionRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(
    null,
  );
  const pairsRef = useRef<BracketPair[]>([]);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.dataset.bcl = styleId;
    const rules: string[] = [];
    COLORS.forEach((color, idx) => {
      rules.push(
        `.bcl-${styleId}-color-${idx} { color: ${color} !important; font-weight: 600; }`,
      );
    });
    rules.push(
      `.bcl-${styleId}-scope { box-shadow: inset 2px 0 0 0 rgba(124,77,255,0.35); }`,
    );
    styleEl.textContent = rules.join('\n');
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [styleId]);

  useEffect(() => {
    if (!editor) return;

    const apply = () => {
      const model = editor.getModel();
      if (!model) {
        collectionRef.current?.clear();
        pairsRef.current = [];
        return;
      }
      const pairs = scanPairs(model);
      pairsRef.current = pairs;

      const cursor = editor.getPosition();
      const decorations: MonacoEditor.IModelDeltaDecoration[] = [];

      for (const p of pairs) {
        const colorIdx = p.depth % COLORS.length;
        const cls = `bcl-${styleId}-color-${colorIdx}`;
        decorations.push({
          range: {
            startLineNumber: p.open.line,
            startColumn: p.open.col,
            endLineNumber: p.open.line,
            endColumn: p.open.col + 1,
          },
          options: { inlineClassName: cls, stickiness: 1 },
        });
        decorations.push({
          range: {
            startLineNumber: p.close.line,
            startColumn: p.close.col,
            endLineNumber: p.close.line,
            endColumn: p.close.col + 1,
          },
          options: { inlineClassName: cls, stickiness: 1 },
        });
      }

      // Active scope guide — innermost pair containing the cursor.
      if (cursor) {
        let active: BracketPair | null = null;
        for (const p of pairs) {
          const afterOpen =
            cursor.lineNumber > p.open.line ||
            (cursor.lineNumber === p.open.line &&
              cursor.column > p.open.col);
          const beforeClose =
            cursor.lineNumber < p.close.line ||
            (cursor.lineNumber === p.close.line &&
              cursor.column <= p.close.col);
          if (afterOpen && beforeClose) {
            if (!active || p.depth > active.depth) active = p;
          }
        }
        if (active && active.close.line > active.open.line) {
          decorations.push({
            range: {
              startLineNumber: active.open.line,
              startColumn: 1,
              endLineNumber: active.close.line,
              endColumn: 1,
            },
            options: {
              linesDecorationsClassName: `bcl-${styleId}-scope`,
              stickiness: 1,
            },
          });
        }
      }

      if (collectionRef.current) {
        collectionRef.current.set(decorations);
      } else {
        collectionRef.current = editor.createDecorationsCollection(decorations);
      }
    };

    apply();
    const dContent = editor.onDidChangeModelContent(apply);
    const dCursor = editor.onDidChangeCursorPosition(apply);
    const dModel = editor.onDidChangeModel(apply);

    return () => {
      dContent.dispose();
      dCursor.dispose();
      dModel.dispose();
      collectionRef.current?.clear();
      collectionRef.current = null;
    };
  }, [editor, styleId]);

  return null;
}
