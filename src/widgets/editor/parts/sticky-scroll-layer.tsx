import { useEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { cn } from '@shared/lib/cn';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
}

interface StickyLine {
  line: number;
  text: string;
  indent: number;
}

const MAX_PINNED = 3;

function leadingIndent(text: string): number {
  let i = 0;
  while (i < text.length) {
    const c = text.charCodeAt(i);
    if (c !== 32 && c !== 9) break;
    i++;
  }
  return i;
}

function isScopeHeading(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  const first = t.charAt(0);
  if (first === '}' || first === ')' || first === ']') return false;
  return true;
}

function collectOuterScopes(
  model: MonacoEditor.ITextModel,
  topLine: number,
): StickyLine[] {
  if (topLine <= 1) return [];
  const out: StickyLine[] = [];
  const topText = model.getLineContent(topLine);
  let frontier = leadingIndent(topText);
  for (let line = topLine - 1; line >= 1; line--) {
    const text = model.getLineContent(line);
    if (!text.trim()) continue;
    const indent = leadingIndent(text);
    if (indent < frontier && isScopeHeading(text)) {
      out.unshift({ line, text, indent });
      frontier = indent;
      if (out.length >= MAX_PINNED) break;
      if (indent === 0) break;
    }
  }
  return out;
}

export function StickyScrollLayer({ editor, file }: Props) {
  const [pinned, setPinned] = useState<StickyLine[]>([]);
  const [lineHeight, setLineHeight] = useState(20);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) {
      setPinned([]);
      return;
    }

    const compute = () => {
      const model = editor.getModel();
      if (!model) {
        setPinned([]);
        return;
      }
      const ranges = editor.getVisibleRanges();
      const first = ranges[0];
      if (!first) {
        setPinned([]);
        return;
      }
      const topLine = first.startLineNumber;
      const scopes = collectOuterScopes(model, topLine);
      setPinned(scopes);
      const raw = editor.getRawOptions();
      if (typeof raw.lineHeight === 'number' && raw.lineHeight > 0) {
        setLineHeight(raw.lineHeight);
      }
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        compute();
      });
    };

    compute();
    const dScroll = editor.onDidScrollChange(schedule);
    const dLayout = editor.onDidLayoutChange(schedule);
    const dContent = editor.onDidChangeModelContent(schedule);

    return () => {
      dScroll.dispose();
      dLayout.dispose();
      dContent.dispose();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [editor, file]);

  if (!editor || pinned.length === 0) return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-0 right-0 top-0 z-30',
        'bg-bg/95 backdrop-blur-[2px] hairline-b',
      )}
    >
      {pinned.map((p) => (
        <button
          key={p.line}
          type="button"
          onClick={() => editor.revealLineInCenter(p.line)}
          className={cn(
            'pointer-events-auto block w-full text-left font-mono text-[12.5px] leading-[1.4]',
            'truncate px-3 text-ink-1 hover:bg-bg-subtle',
          )}
          style={{ height: lineHeight }}
          title={`Jump to line ${p.line}`}
        >
          <span className="text-ink-3 mr-3 select-none">{p.line}</span>
          <span className="whitespace-pre">{p.text}</span>
        </button>
      ))}
    </div>
  );
}
