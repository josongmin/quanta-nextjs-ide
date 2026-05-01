import { useEffect, useRef } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { match } from 'ts-pattern';
import type { FileSemantics } from './use-line-semantics';

interface Args {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  monaco: typeof import('monaco-editor') | null;
  semantics: FileSemantics;
}

function isValidModelLine(model: MonacoEditor.ITextModel, lineNo: number): boolean {
  if (!Number.isInteger(lineNo) || lineNo < 1) return false;
  try {
    return lineNo <= model.getLineCount();
  } catch {
    // Model can be disposed between the effect setup and the loop iteration;
    // treat any throw as "not valid" rather than crashing the editor.
    return false;
  }
}

function safeMaxColumn(model: MonacoEditor.ITextModel, lineNo: number): number | null {
  try {
    return model.getLineMaxColumn(lineNo);
  } catch {
    return null;
  }
}

function safeFirstNonWsColumn(model: MonacoEditor.ITextModel, lineNo: number): number {
  try {
    return model.getLineFirstNonWhitespaceColumn(lineNo) || 1;
  } catch {
    return 1;
  }
}

/**
 * Apply diagnostic squiggles + after-line ghost annotations as Monaco decorations.
 * Re-applies whenever the file or diagnostics change.
 */
export function useMonacoDecorations({ editor, monaco, semantics }: Args) {
  const collectionRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    if (!editor || !monaco) return;

    const decorations: MonacoEditor.IModelDeltaDecoration[] = [];

    // Squiggles / dotted underlines for diagnostics
    for (const [lineNo, dxs] of semantics.diagnosticsByLine) {
      const top = dxs[0];
      if (!top) continue;
      const className = match([top.severity, top.confidence] as const)
        .with(['err', 'high'], () => 'wave-underline-err')
        .with(['err', 'medium'], () => 'wave-underline-err')
        .with(['warn', 'high'], () => 'wave-underline-warn')
        .with(['warn', 'medium'], () => 'dashed-underline-warn')
        .with(['info', 'high'], () => 'dotted-underline')
        .with(['info', 'medium'], () => 'dotted-underline')
        .with(['hint', 'high'], () => 'dotted-underline')
        .with(['hint', 'medium'], () => 'dotted-underline')
        .otherwise(() => 'dotted-underline');

      const model = editor.getModel();
      if (!model || !isValidModelLine(model, lineNo)) continue;
      const lineMax = safeMaxColumn(model, lineNo);
      if (lineMax == null) continue;
      const lineMin = Math.min(safeFirstNonWsColumn(model, lineNo), lineMax);

      decorations.push({
        range: new monaco.Range(lineNo, lineMin, lineNo, lineMax),
        options: {
          inlineClassName: className,
          stickiness: 1,
          hoverMessage: { value: `**${top.title}** — ${top.message}` },
        },
      });
    }

    // After-line ghost annotations (inline labels)
    for (const line of semantics.lines) {
      if (!line.ghost) continue;
      const model = editor.getModel();
      if (!model || !isValidModelLine(model, line.line)) continue;
      const col = safeMaxColumn(model, line.line);
      if (col == null) continue;
      decorations.push({
        range: new monaco.Range(line.line, col, line.line, col),
        options: {
          after: {
            content: '   ' + line.ghost,
            inlineClassName: 'nss-ghost-after',
          },
          stickiness: 1,
        },
      });
    }

    if (collectionRef.current) {
      collectionRef.current.set(decorations);
    } else {
      collectionRef.current = editor.createDecorationsCollection(decorations);
    }

    return () => {
      collectionRef.current?.clear();
    };
  }, [editor, monaco, semantics]);
}
