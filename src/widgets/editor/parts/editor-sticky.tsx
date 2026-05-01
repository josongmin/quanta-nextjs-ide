import { useEffect, useMemo, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { getSourceForFile } from '@shared/mocks';

interface Props {
  file: string;
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  className?: string;
}

const STICKY_HEIGHT = 22;

const CONTEXT_PATTERNS: RegExp[] = [
  /^\s*export\s+default\s+async\s+function\b/,
  /^\s*export\s+async\s+function\b/,
  /^\s*export\s+default\s+function\b/,
  /^\s*export\s+function\b/,
  /^\s*async\s+function\b/,
  /^\s*function\b/,
  /^\s*export\s+(?:default\s+)?class\b/,
  /^\s*class\b/,
  /^\s*export\s+(?:default\s+)?interface\b/,
  /^\s*interface\b/,
  /^\s*export\s+(?:default\s+)?type\s+\w+\s*=/,
  /^\s*type\s+\w+\s*=/,
  /^\s*export\s+const\s+\w+\s*=/,
  /^\s*const\s+\w+\s*=/,
  /=>\s*\{\s*$/,
  /^\s*\/\/\s*section:/i,
];

function isContextLine(text: string): boolean {
  return CONTEXT_PATTERNS.some((p) => p.test(text));
}

/**
 * 22px sticky-scroll bar that shows the nearest "context" line for the topmost
 * visible line in the editor. Click → scroll to that line.
 */
export function EditorSticky({ file, editor, className }: Props) {
  const source = getSourceForFile(file);
  const lines = useMemo(() => source.split('\n'), [source]);

  const [topVisibleLine, setTopVisibleLine] = useState<number>(1);

  useEffect(() => {
    if (!editor) return;

    const recompute = () => {
      const raw = editor.getRawOptions();
      const lineHeight =
        typeof raw.lineHeight === 'number' && raw.lineHeight > 0
          ? raw.lineHeight
          : 20;
      const sTop = editor.getScrollTop();
      const top = Math.max(1, Math.floor(sTop / lineHeight) + 1);
      setTopVisibleLine(top);
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

  const matched = useMemo<{ line: number; text: string } | null>(() => {
    // scan upward (inclusive) from topVisibleLine to find context line
    const start = Math.min(lines.length, Math.max(1, topVisibleLine));
    for (let n = start; n >= 1; n--) {
      const text = lines[n - 1];
      if (text === undefined) continue;
      if (isContextLine(text)) {
        return { line: n, text: text.trimEnd() };
      }
    }
    return null;
  }, [topVisibleLine, lines]);

  if (!matched || matched.line === 1) {
    // hide if no match or matched line is line 1 (avoid duplicating header)
    return null;
  }

  const handleClick = () => {
    if (!editor) return;
    editor.revealLineInCenter(matched.line);
    editor.focus();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Jump to line ${matched.line}`}
      className={cn(
        'flex w-full shrink-0 items-center gap-1.5 hairline-b bg-bg-subtle/60 px-3 text-left text-ink-2 hover:bg-bg-hover',
        className,
      )}
      style={{ height: STICKY_HEIGHT }}
    >
      <Icon.ChevDown aria-hidden className="h-3 w-3 shrink-0 text-ink-3" />
      <span className="truncate font-mono text-[11px] leading-none">
        {matched.text.replace(/^\s+/, '')}
      </span>
      <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-ink-3">
        L{matched.line}
      </span>
    </button>
  );
}
