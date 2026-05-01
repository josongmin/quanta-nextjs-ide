import { useEffect, useMemo, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { toast } from 'sonner';
import {
  Icon,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Button,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { Diagnostic, QuickFix } from '@shared/types';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  diagnosticsByLine: Map<number, Diagnostic[]>;
  /** absolute left offset (px) where this 16-px column should be placed */
  left: number;
  className?: string;
}

export const LIGHTBULB_WIDTH = 16;

interface BulbSite {
  line: number;
  fixes: QuickFix[];
  /** representative diagnostic for context in the popover */
  diagnostic: Diagnostic;
}

interface VisibleBulb {
  site: BulbSite;
  top: number;
  height: number;
}

export function EditorLightbulb({
  editor,
  diagnosticsByLine,
  left,
  className,
}: Props) {
  const sites = useMemo<BulbSite[]>(() => {
    const out: BulbSite[] = [];
    for (const [line, dxs] of diagnosticsByLine) {
      // collect every fix across diagnostics on this line, preserve order
      const fixes: QuickFix[] = [];
      const seenFixIds = new Set<string>();
      let head: Diagnostic | undefined;
      for (const d of dxs) {
        if (!head) head = d;
        for (const f of d.fixes) {
          if (seenFixIds.has(f.id)) continue;
          seenFixIds.add(f.id);
          fixes.push(f);
        }
      }
      if (!head || fixes.length === 0) continue;
      out.push({ line, fixes, diagnostic: head });
    }
    return out.sort((a, b) => a.line - b.line);
  }, [diagnosticsByLine]);

  const [visible, setVisible] = useState<VisibleBulb[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [openLine, setOpenLine] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const recompute = () => {
      const layout = editor.getLayoutInfo();
      const raw = editor.getRawOptions();
      const lineHeight =
        typeof raw.lineHeight === 'number' && raw.lineHeight > 0
          ? raw.lineHeight
          : 20;
      const sTop = editor.getScrollTop();
      const next: VisibleBulb[] = [];
      for (const site of sites) {
        const top = editor.getTopForLineNumber(site.line);
        if (top + lineHeight < sTop) continue;
        if (top > sTop + layout.height + lineHeight) continue;
        next.push({ site, top, height: lineHeight });
      }
      setVisible(next);
      setScrollTop(sTop);
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
  }, [editor, sites]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn('absolute top-0 z-10 h-full overflow-hidden', className)}
      style={{ left, width: LIGHTBULB_WIDTH }}
    >
      {visible.map(({ site, top, height }) => {
        const isOpen = openLine === site.line;
        return (
          <Popover
            key={site.line}
            open={isOpen}
            onOpenChange={(o) => setOpenLine(o ? site.line : null)}
          >
            <PopoverAnchor asChild>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  width: LIGHTBULB_WIDTH,
                  top: top - scrollTop,
                  height,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenLine(isOpen ? null : site.line)}
                  aria-label={`Quick fixes for line ${site.line}`}
                  title={`${site.fixes.length} quick fix${site.fixes.length === 1 ? '' : 'es'}`}
                  className={cn(
                    'flex h-full w-full items-center justify-center rounded-sm text-sev-warn opacity-70 hover:bg-bg-hover hover:opacity-100',
                  )}
                >
                  <Icon.Bulb className="h-3 w-3" />
                </button>
              </div>
            </PopoverAnchor>
            <PopoverContent
              align="start"
              side="right"
              sideOffset={4}
              className="w-[280px] p-0 text-sm"
            >
              <QuickFixList site={site} onClose={() => setOpenLine(null)} />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

interface QuickFixListProps {
  site: BulbSite;
  onClose(): void;
}

function QuickFixList({ site, onClose }: QuickFixListProps) {
  const apply = (fix: QuickFix) => {
    toast('Apply: ' + fix.title, {
      description: fix.description ?? site.diagnostic.title,
    });
    onClose();
  };
  const applyToAll = (fix: QuickFix) => {
    toast('Apply to all sites: ' + fix.title);
    onClose();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 hairline-b text-[11px] text-ink-3">
        <Icon.Bulb className="h-3 w-3 text-sev-warn" />
        <span>Quick fixes · L{site.line}</span>
        <span className="ml-auto truncate text-ink-3">{site.diagnostic.ruleId}</span>
      </div>
      <ul className="flex flex-col gap-0.5 p-1">
        {site.fixes.map((fix) => (
          <li
            key={fix.id}
            className="flex flex-col gap-0.5 rounded-sm px-2 py-1.5 hover:bg-bg-hover"
          >
            <div className="flex items-start gap-2">
              <Icon.Bulb className="mt-0.5 h-3 w-3 shrink-0 text-sev-warn" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] text-ink-1">{fix.title}</div>
                {fix.description ? (
                  <div className="truncate text-[11px] text-ink-3">
                    {fix.description}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-1">
              <Button
                size="xs"
                tone="ghost"
                onClick={() => apply(fix)}
              >
                Apply
              </Button>
              {fix.applyToAll ? (
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => applyToAll(fix)}
                >
                  Apply to all
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
