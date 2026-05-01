import { useEffect, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  type ReferenceType,
} from '@floating-ui/react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { Button } from '@shared/ui';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
}

type SelectionContext =
  | { kind: 'use-client' }
  | { kind: 'fetch' }
  | { kind: 'function' }
  | { kind: 'generic' };

function detectContext(text: string): SelectionContext {
  if (/['"]use client['"]/.test(text)) return { kind: 'use-client' };
  if (/\bfetch\s*\(/.test(text)) return { kind: 'fetch' };
  if (/\b(?:export\s+)?(?:default\s+)?(?:async\s+)?function\b/.test(text)) {
    return { kind: 'function' };
  }
  return { kind: 'generic' };
}

export function SelectionActionBar({ editor }: Props) {
  const [text, setText] = useState('');
  const [virtualRef, setVirtualRef] = useState<ReferenceType | null>(null);
  const { refs, floatingStyles } = useFloating({
    open: !!virtualRef,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(virtualRef);
  }, [virtualRef, refs]);

  useEffect(() => {
    if (!editor) return;
    const dispose = editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      const model = editor.getModel();
      if (!model || sel.isEmpty()) {
        setVirtualRef(null);
        setText('');
        return;
      }
      const selectedText = model.getValueInRange(sel);
      const dom = editor.getDomNode();
      if (!dom) return;
      const startCoords = editor.getScrolledVisiblePosition({
        lineNumber: sel.startLineNumber,
        column: sel.startColumn,
      });
      if (!startCoords) {
        setVirtualRef(null);
        return;
      }
      const rect = dom.getBoundingClientRect();
      const x = rect.left + startCoords.left;
      const y = rect.top + startCoords.top;
      const virt: ReferenceType = {
        getBoundingClientRect: () => ({
          x,
          y,
          left: x,
          top: y,
          right: x + 1,
          bottom: y + 1,
          width: 1,
          height: 1,
          toJSON() {
            return this;
          },
        }),
      };
      setVirtualRef(virt);
      setText(selectedText);
    });
    return () => dispose.dispose();
  }, [editor]);

  if (!virtualRef || !text) return null;
  const ctx = detectContext(text);

  const handle = (label: string) => () => toast(label, { description: 'Action triggered (prototype)' });

  const buttons = match(ctx)
    .with({ kind: 'use-client' }, () => [
      { label: 'Show blast', onClick: handle('Show blast radius') },
      { label: 'Move down', onClick: handle('Move "use client" down') },
      { label: 'Extract island', onClick: handle('Extract Client Island') },
      { label: 'Convert to server', onClick: handle('Convert to Server Component') },
    ])
    .with({ kind: 'fetch' }, () => [
      { label: '+ cache policy', onClick: handle('Add cache policy') },
      { label: '+ tag', onClick: handle('Add cache tag') },
      { label: 'Wrap helper', onClick: handle('Wrap with team fetch helper') },
    ])
    .with({ kind: 'function' }, () => [
      { label: 'Convert', onClick: handle('Convert function') },
      { label: 'Extract', onClick: handle('Extract function') },
      { label: 'Add Cache', onClick: handle('Add cache()') },
      { label: 'Wrap Auth', onClick: handle('Wrap with auth guard') },
    ])
    .with({ kind: 'generic' }, () => [
      { label: 'Refactor', onClick: handle('Refactor') },
      { label: 'Comment', onClick: handle('Toggle comment') },
    ])
    .exhaustive();

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-30 flex items-center gap-1 rounded-md border border-line bg-bg p-1 shadow-pop animate-fade-in"
    >
      {buttons.map((b) => (
        <Button
          key={b.label}
          tone="ghost"
          size="xs"
          onClick={b.onClick}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}
