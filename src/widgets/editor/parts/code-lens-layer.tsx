import { useEffect, useMemo, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { toast } from 'sonner';
import { Chip, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { lensesForFile, type CodeLensDecl, type LensKind } from './code-lens-helpers';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
}

interface PositionedLens extends CodeLensDecl {
  top: number;
  left: number;
}

const LENS_HEIGHT = 18;

function chipTone(kind: LensKind): 'accent' | 'info' | 'muted' {
  if (kind === 'refs') return 'accent';
  if (kind === 'impls') return 'info';
  return 'muted';
}

export function CodeLensLayer({ editor, file }: Props) {
  const [positions, setPositions] = useState<PositionedLens[]>([]);

  const decls = useMemo(() => lensesForFile(file), [file]);

  useEffect(() => {
    if (!editor) {
      setPositions([]);
      return;
    }

    const compute = () => {
      const model = editor.getModel();
      if (!model) {
        setPositions([]);
        return;
      }
      const totalLines = model.getLineCount();
      const ranges = editor.getVisibleRanges();
      if (ranges.length === 0) {
        setPositions([]);
        return;
      }
      const first = ranges[0];
      const last = ranges[ranges.length - 1];
      if (!first || !last) {
        setPositions([]);
        return;
      }
      const startLine = Math.max(1, first.startLineNumber - 2);
      const endLine = Math.min(totalLines, last.endLineNumber + 2);

      const out: PositionedLens[] = [];
      for (const decl of decls) {
        if (decl.line > totalLines) continue;
        if (decl.line < startLine || decl.line > endLine) continue;
        const coords = editor.getScrolledVisiblePosition({
          lineNumber: decl.line,
          column: 1,
        });
        if (!coords) continue;
        const indentCol = model.getLineFirstNonWhitespaceColumn(decl.line) || 1;
        const indentCoords = editor.getScrolledVisiblePosition({
          lineNumber: decl.line,
          column: indentCol,
        });
        out.push({
          ...decl,
          top: coords.top - LENS_HEIGHT - 2,
          left: indentCoords ? indentCoords.left : coords.left,
        });
      }
      setPositions(out);
    };

    compute();
    const dScroll = editor.onDidScrollChange(compute);
    const dContent = editor.onDidChangeModelContent(compute);
    const dLayout = editor.onDidLayoutChange(compute);
    const dModel = editor.onDidChangeModel(compute);

    return () => {
      dScroll.dispose();
      dContent.dispose();
      dLayout.dispose();
      dModel.dispose();
    };
  }, [editor, file, decls]);

  if (!editor) return null;

  return (
    <div
      aria-hidden={false}
      className="pointer-events-none absolute inset-0 z-20"
    >
      {positions.map((p) => (
        <div
          key={`${p.line}-${p.symbol}`}
          className={cn(
            'pointer-events-auto absolute flex items-center gap-1.5',
            'rounded-sm px-1 py-0',
          )}
          style={{ top: p.top, left: p.left, height: LENS_HEIGHT }}
        >
          {p.chips.map((c) => (
            <Tooltip key={c.kind} content={c.tooltip}>
              <button
                type="button"
                onClick={() =>
                  toast(`${c.tooltip}: ${p.symbol}`, {
                    description: `Line ${p.line} · ${c.label}`,
                  })
                }
                className="inline-flex items-center"
              >
                <Chip tone={chipTone(c.kind)} size="xs">
                  {c.label}
                </Chip>
              </button>
            </Tooltip>
          ))}
        </div>
      ))}
    </div>
  );
}
