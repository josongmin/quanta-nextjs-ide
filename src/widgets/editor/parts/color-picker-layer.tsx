import { useEffect, useMemo, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@shared/ui';
import {
  ColorPickerPopover,
  findColorsInLine,
  rgbaCss,
  type ColorMatch,
} from '@features/color-picker';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
}

interface PositionedMatch {
  match: ColorMatch;
  top: number;
  left: number;
  height: number;
}

const SCAN_DEBOUNCE_MS = 90;
const SWATCH_SIZE = 12;
const MIN_LEFT = 4;

/**
 * Scans visible lines for color tokens (hex / rgb / rgba / hsl / hsla) and
 * renders a small clickable swatch at each match. Click → popover with a
 * basic CSS color picker.
 */
export function ColorPickerLayer({ editor, file }: Props) {
  const [matches, setMatches] = useState<PositionedMatch[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) {
      setMatches([]);
      return;
    }

    const compute = () => {
      const model = editor.getModel();
      if (!model) {
        setMatches([]);
        return;
      }
      const ranges = editor.getVisibleRanges();
      if (!ranges.length) {
        setMatches([]);
        return;
      }
      const out: PositionedMatch[] = [];
      // Add a small bleed above/below visible range so swatches don't pop in.
      const firstRange = ranges[0];
      const lastRange = ranges[ranges.length - 1];
      if (!firstRange || !lastRange) {
        setMatches([]);
        return;
      }
      const first = Math.max(1, firstRange.startLineNumber - 4);
      const last = Math.min(
        model.getLineCount(),
        lastRange.endLineNumber + 4,
      );
      for (let line = first; line <= last; line++) {
        const text = model.getLineContent(line);
        const lineMatches = findColorsInLine(text, line);
        for (const m of lineMatches) {
          const coords = editor.getScrolledVisiblePosition({
            lineNumber: line,
            column: m.column,
          });
          if (!coords) continue;
          out.push({
            match: m,
            top: coords.top,
            left: Math.max(MIN_LEFT, coords.left - SWATCH_SIZE - 4),
            height: coords.height || 20,
          });
        }
      }
      setMatches(out);
    };

    const schedule = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(compute, SCAN_DEBOUNCE_MS);
    };

    compute();
    const dScroll = editor.onDidScrollChange(schedule);
    const dContent = editor.onDidChangeModelContent(schedule);
    const dLayout = editor.onDidLayoutChange(schedule);

    return () => {
      dScroll.dispose();
      dContent.dispose();
      dLayout.dispose();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor, file]);

  // Build a stable key for diff detection — same key when only positions change.
  const keyFor = (p: PositionedMatch) =>
    `${p.match.line}:${p.match.column}:${p.match.raw}`;

  const items = useMemo(() => matches.map((m, i) => ({ p: m, i })), [matches]);

  if (!editor) return null;

  return (
    <div
      aria-hidden={false}
      className="pointer-events-none absolute inset-0 z-20"
    >
      {items.map(({ p, i }) => {
        const css =
          p.match.a < 1
            ? rgbaCss(p.match.r, p.match.g, p.match.b, p.match.a)
            : `rgb(${p.match.r}, ${p.match.g}, ${p.match.b})`;
        const isOpen = openIdx === i;
        return (
          <Popover
            key={keyFor(p)}
            open={isOpen}
            onOpenChange={(o) => setOpenIdx(o ? i : null)}
          >
            <PopoverAnchor asChild>
              <button
                type="button"
                aria-label={`Edit color ${p.match.raw}`}
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="pointer-events-auto absolute rounded-sm border border-line/80 hover:border-accent"
                style={{
                  top: p.top + (p.height - SWATCH_SIZE) / 2,
                  left: p.left,
                  width: SWATCH_SIZE,
                  height: SWATCH_SIZE,
                  background: css,
                }}
              />
            </PopoverAnchor>
            {isOpen ? (
              <PopoverContent
                align="start"
                side="right"
                sideOffset={6}
                className="p-0"
              >
                <ColorPickerPopover
                  initial={p.match}
                  onClose={() => setOpenIdx(null)}
                />
              </PopoverContent>
            ) : null}
          </Popover>
        );
      })}
    </div>
  );
}
