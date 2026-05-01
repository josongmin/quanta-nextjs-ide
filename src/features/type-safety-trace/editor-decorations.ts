/**
 * Monaco decoration helpers for the Type Safety Trace feature family.
 *
 * Centralised so that all sub-features (any-leakage gutter dots, unsafe
 * cast inline chips, import-cost end-of-line pills) share a single
 * "owner" key on Monaco's deltaDecorations API and never accidentally
 * delete each other's decorations.
 *
 * Visual contract:
 *   - 'gutter-dot'   — 6-8px semi-transparent circle in the line gutter.
 *   - 'inline-chip'  — small monospace pill at the end of the line.
 *   - 'underline'    — wavy underline on a span (severity colored).
 */

import type { editor as MonacoEditor } from 'monaco-editor';
import type { RangeRef } from './types';

export const DECORATION_OWNER_KEY = 'quanta-type-safety';

export type DecorationKind = 'gutter-dot' | 'inline-chip' | 'underline';

export interface TypeSafetyDecoration {
  range: RangeRef;
  kind: DecorationKind;
  severity: 'info' | 'warn' | 'err';
  /** Hover content rendered as Monaco markdown. */
  hoverMarkdown?: string;
  /** End-of-line annotation text (only used by `inline-chip`). */
  inlineText?: string;
}

const SEV_GUTTER_CLASS: Record<TypeSafetyDecoration['severity'], string> = {
  info: 'qts-gutter-dot qts-gutter-dot-info',
  warn: 'qts-gutter-dot qts-gutter-dot-warn',
  err: 'qts-gutter-dot qts-gutter-dot-err',
};

const SEV_UNDERLINE_CLASS: Record<TypeSafetyDecoration['severity'], string> = {
  info: 'qts-underline qts-underline-info',
  warn: 'qts-underline qts-underline-warn',
  err: 'qts-underline qts-underline-err',
};

function decorationFor(
  d: TypeSafetyDecoration,
): MonacoEditor.IModelDeltaDecoration {
  const range = {
    startLineNumber: d.range.startLine,
    startColumn: d.range.startColumn,
    endLineNumber: d.range.endLine,
    endColumn: d.range.endColumn,
  };
  const hover = d.hoverMarkdown
    ? [{ value: d.hoverMarkdown, isTrusted: false }]
    : undefined;

  switch (d.kind) {
    case 'gutter-dot':
      return {
        range,
        options: {
          isWholeLine: false,
          glyphMarginClassName: SEV_GUTTER_CLASS[d.severity],
          glyphMarginHoverMessage: hover,
          stickiness: 1, // NeverGrowsWhenTypingAtEdges
        },
      };
    case 'underline':
      return {
        range,
        options: {
          inlineClassName: SEV_UNDERLINE_CLASS[d.severity],
          hoverMessage: hover,
          stickiness: 1,
        },
      };
    case 'inline-chip':
      return {
        range,
        options: {
          after: d.inlineText
            ? {
                content: ' ' + d.inlineText,
                inlineClassName:
                  d.severity === 'err'
                    ? 'qts-inline-chip qts-inline-chip-err'
                    : d.severity === 'warn'
                      ? 'qts-inline-chip qts-inline-chip-warn'
                      : 'qts-inline-chip qts-inline-chip-info',
                cursorStops: 0 /* Both */,
              }
            : undefined,
          hoverMessage: hover,
          stickiness: 1,
        },
      };
  }
}

/**
 * Apply a set of decorations to a Monaco model under our owner key.
 * Returns the new ids so callers can later swap them out.
 */
export function applyDecorations(
  model: MonacoEditor.ITextModel,
  prevIds: ReadonlyArray<string>,
  next: ReadonlyArray<TypeSafetyDecoration>,
): string[] {
  return model.deltaDecorations(
    [...prevIds],
    next.map(decorationFor),
  );
}

/** Owner-keyed clear (call on unmount). */
export function clearDecorations(
  model: MonacoEditor.ITextModel,
  prevIds: ReadonlyArray<string>,
): void {
  model.deltaDecorations([...prevIds], []);
}

/**
 * Stylesheet for the decoration classes. Injected once into the document
 * head when the editor integration mounts. We embed instead of relying on
 * the global Tailwind sheet so the feature stays self-contained.
 */
export const TYPE_SAFETY_DECORATION_CSS = `
.qts-gutter-dot {
  border-radius: 999px;
  width: 7px !important;
  height: 7px !important;
  margin-left: 4px;
  margin-top: 6px;
  display: inline-block;
}
.qts-gutter-dot-info { background: hsl(var(--accent) / 0.55); }
.qts-gutter-dot-warn { background: hsl(45 95% 55% / 0.65); }
.qts-gutter-dot-err  { background: hsl(0 80% 58% / 0.7); }

.qts-underline {
  text-decoration: underline wavy;
  text-decoration-skip-ink: none;
  text-underline-offset: 3px;
}
.qts-underline-info { text-decoration-color: hsl(var(--accent) / 0.7); }
.qts-underline-warn { text-decoration-color: hsl(45 95% 55% / 0.85); }
.qts-underline-err  { text-decoration-color: hsl(0 80% 58% / 0.85); }

.qts-inline-chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: 1px;
  letter-spacing: 0.01em;
}
.qts-inline-chip-info {
  background: hsl(var(--accent) / 0.10);
  color: hsl(var(--accent));
}
.qts-inline-chip-warn {
  background: hsl(45 95% 55% / 0.14);
  color: hsl(35 80% 35%);
}
.qts-inline-chip-err {
  background: hsl(0 80% 58% / 0.14);
  color: hsl(0 70% 40%);
}
`;

let cssInjected = false;
export function ensureDecorationCss(): void {
  if (cssInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-quanta-type-safety', 'true');
  style.textContent = TYPE_SAFETY_DECORATION_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}
