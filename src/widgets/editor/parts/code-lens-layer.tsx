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
  height: number;
}

const LENS_GAP_LEFT = 24; // px past end-of-line

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
        const maxCol = model.getLineMaxColumn(decl.line);
        const endCoords = editor.getScrolledVisiblePosition({
          lineNumber: decl.line,
          column: maxCol,
        });
        if (!endCoords) continue;
        // Trailing position: end-of-line + gap. This keeps the chip out of
        // the gutter and never pushes the line itself, so line numbers stay
        // visually contiguous (1, 2, 3, … rather than the gappy 1, 2, 4, …
        // we saw when the lens floated above the line).
        out.push({
          ...decl,
          top: endCoords.top,
          left: endCoords.left + LENS_GAP_LEFT,
          height: endCoords.height || 20,
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
      className="pointer-events-none absolute inset-0 z-[5]"
    >
      {positions.map((p) => (
        <div
          key={`${p.line}-${p.symbol}`}
          className={cn(
            'pointer-events-auto group absolute flex items-center gap-1',
            'opacity-55 hover:opacity-100',
            'transition-opacity duration-moderate ease-swift-out',
          )}
          style={{ top: p.top, left: p.left, height: p.height }}
          data-lens-line={p.line}
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
                className="mi-press inline-flex items-center"
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
