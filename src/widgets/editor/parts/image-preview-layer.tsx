import { useEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import {
  useFloating,
  offset,
  flip,
  shift,
  FloatingPortal,
  type ReferenceType,
} from '@floating-ui/react';
import { ImagePreviewCard, deriveImageInfo } from '@features/image-preview';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
}

const IMG_RE = /([\w./@\-]+\.(png|jpg|jpeg|webp|avif|svg|gif))/i;

interface HoverState {
  filename: string;
  rect: DOMRect;
}

export function ImagePreviewLayer({ editor }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [virtualRef, setVirtualRef] = useState<ReferenceType | null>(null);
  const lineRef = useRef<number | null>(null);

  const { refs, floatingStyles } = useFloating({
    open: !!hover,
    strategy: 'fixed',
    placement: 'top-start',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  useEffect(() => {
    refs.setReference(virtualRef);
  }, [virtualRef, refs]);

  useEffect(() => {
    if (!editor) return;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const close = () => {
      setHover(null);
      setVirtualRef(null);
      lineRef.current = null;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const scheduleClose = (ms: number) => {
      if (hideTimer) return;
      hideTimer = setTimeout(close, ms);
    };

    const cancelClose = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const dispose = editor.onMouseMove((e) => {
      const target = e.target;
      if (target.type !== 6 /* CONTENT_TEXT */) {
        if (lineRef.current !== null) scheduleClose(120);
        return;
      }
      const lineNumber = target.position?.lineNumber;
      if (!lineNumber) {
        if (lineRef.current !== null) scheduleClose(120);
        return;
      }
      const model = editor.getModel();
      if (!model) return;
      const text = model.getLineContent(lineNumber);
      const m = text.match(IMG_RE);
      if (!m) {
        if (lineRef.current !== null) scheduleClose(120);
        return;
      }

      // Already showing for this line — keep popover stable.
      if (lineRef.current === lineNumber) {
        cancelClose();
        return;
      }

      const dom = editor.getDomNode();
      if (!dom) return;
      const coords = editor.getScrolledVisiblePosition({
        lineNumber,
        column: target.position?.column ?? 1,
      });
      if (!coords) return;
      const editorRect = dom.getBoundingClientRect();
      const lineTopY = editorRect.top + coords.top;
      const lineHeight = coords.height || 20;
      const browser = e.event.browserEvent as MouseEvent | undefined;
      const cursorX = browser?.clientX ?? editorRect.left + coords.left;
      const x = Math.min(
        Math.max(cursorX, editorRect.left + 32),
        editorRect.right - 32,
      );

      const rect: DOMRect = {
        x,
        y: lineTopY,
        left: x,
        top: lineTopY,
        right: x + 1,
        bottom: lineTopY + lineHeight,
        width: 1,
        height: lineHeight,
        toJSON() {
          return this;
        },
      };

      cancelClose();
      // Extract just the filename — strip path components.
      const full = m[1] ?? m[0];
      const slash = full.lastIndexOf('/');
      const filename = slash >= 0 ? full.slice(slash + 1) : full;

      lineRef.current = lineNumber;
      setHover({ filename, rect });
      setVirtualRef({ getBoundingClientRect: () => rect });
    });

    const disposeLeave = editor.onMouseLeave(close);
    const disposeScroll = editor.onDidScrollChange(close);

    return () => {
      dispose.dispose();
      disposeLeave.dispose();
      disposeScroll.dispose();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [editor]);

  if (!hover || !virtualRef) return null;

  const info = deriveImageInfo(hover.filename);

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="z-50 rounded-md border border-line bg-bg shadow-pop"
      >
        <ImagePreviewCard info={info} />
      </div>
    </FloatingPortal>
  );
}
