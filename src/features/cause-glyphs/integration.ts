/**
 * Monaco glyphMargin decorator manager for Cause Glyphs.
 *
 * Strict constraints:
 *   • Uses ONLY `editor.deltaDecorations` with `glyphMarginClassName`.
 *   • No view zones, no content widgets.
 *   • Idempotent — calling `applyGlyphs` repeatedly diffs the previous set.
 */

import type { editor as MonacoEditor, IMarkdownString } from 'monaco-editor';
import { classFor, KIND_TO_ICON, KIND_TO_LABEL } from './color-map';
import type { CauseGlyph, CauseKind } from './types';

export interface GlyphFilterState {
  /** When set, only this kind is visible at full opacity; others fade. */
  activeKind: CauseKind | null;
  /** When true, low-confidence glyphs are visible too. */
  showLowConfidence: boolean;
  /** Suppressed glyph ids (per-user, persisted in localStorage). */
  suppressed: ReadonlySet<string>;
}

export interface GlyphHandle {
  decorations: MonacoEditor.IEditorDecorationsCollection;
  /** Map of decoration id → glyph (for click-routing). */
  byDecorationId: Map<string, CauseGlyph>;
}

function buildHover(g: CauseGlyph): IMarkdownString {
  const lines: string[] = [];
  lines.push(`**${KIND_TO_LABEL[g.kind]}** — ${g.message}`);
  if (g.evidence) lines.push('', '```ts', g.evidence, '```');
  lines.push('', `*confidence: ${g.confidence} · severity: ${g.severity}*`);
  return { value: lines.join('\n'), isTrusted: false, supportThemeIcons: true };
}

function buildClass(g: CauseGlyph, filter: GlyphFilterState, isNew: boolean): string {
  const parts = [classFor(g.kind)];
  if (filter.activeKind && filter.activeKind !== g.kind) parts.push('cg-glyph--filtered-out');
  if (g.confidence === 'low') parts.push('cg-glyph--low');
  if (isNew) parts.push('cg-glyph--new');
  return parts.join(' ');
}

/**
 * Apply (or re-apply) glyph decorations.
 *
 * Returns a handle that the hook keeps alive between renders. The animation
 * cascade is encoded as a per-glyph `animation-delay` injected via inline
 * style on the line decoration class — Monaco doesn't pass style through to
 * margin classNames, so we add a style tag with line-numbered animation
 * delays once per file.
 */
export function applyGlyphs(
  editor: MonacoEditor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
  glyphs: ReadonlyArray<CauseGlyph>,
  filter: GlyphFilterState,
  prev: GlyphHandle | null,
  recentlyAppearedIds: ReadonlySet<string>,
): GlyphHandle {
  const model = editor.getModel();
  const decorations: MonacoEditor.IModelDeltaDecoration[] = [];
  const byDecorationId = new Map<string, CauseGlyph>();
  const visibleByLine = new Map<number, CauseGlyph[]>();

  for (const g of glyphs) {
    if (filter.suppressed.has(g.id)) continue;
    if (g.confidence === 'low' && !filter.showLowConfidence) continue;
    if (!model) continue;
    if (g.line < 1 || g.line > model.getLineCount()) continue;

    const list = visibleByLine.get(g.line) ?? [];
    list.push(g);
    visibleByLine.set(g.line, list);
  }

  // Monaco only paints one glyph margin class per line, so on collision pick
  // the highest-severity (err > warn > info) glyph.
  const sevRank: Record<CauseGlyph['severity'], number> = { err: 0, warn: 1, info: 2 };
  for (const [line, list] of visibleByLine) {
    list.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
    const top = list[0];
    if (!top) continue;
    const isNew = recentlyAppearedIds.has(top.id);
    const className = buildClass(top, filter, isNew);
    decorations.push({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        glyphMarginClassName: className,
        glyphMarginHoverMessage: buildHover(top),
        stickiness: 1,
      },
    });
  }

  const collection = prev?.decorations ?? editor.createDecorationsCollection([]);
  collection.set(decorations);
  // Map ids back; decoration ids accessible via collection.getRanges() doesn't
  // return ids directly, so we re-query.
  const ids = collection.getRanges();
  for (let i = 0; i < ids.length; i++) {
    const r = ids[i];
    if (!r) continue;
    const list = visibleByLine.get(r.startLineNumber);
    const top = list?.[0];
    if (top) byDecorationId.set(`${i}`, top);
  }
  // Inject icon attribute on rendered margin elements (Monaco renders on
  // next animation frame; we update via a microtask).
  queueMicrotask(() => {
    const root = (editor as unknown as { _domElement?: HTMLElement })._domElement
      ?? editor.getContainerDomNode?.();
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>('.cg-glyph');
    let i = 0;
    for (const el of Array.from(els)) {
      const line = decorations[i]?.range.startLineNumber ?? 1;
      const list = visibleByLine.get(line);
      const top = list?.[0];
      if (top) {
        el.setAttribute('data-cg-icon', KIND_TO_ICON[top.kind]);
        el.setAttribute('data-cg-id', top.id);
        // Cascade fade-in: 30ms × line index (capped 600ms).
        const delay = Math.min(600, line * 30);
        el.style.animationDelay = `${delay}ms`;
      }
      i++;
    }
  });

  return { decorations: collection, byDecorationId };
}

/**
 * Briefly paints a green "recovered" tick on a line where a glyph used to be.
 * Lifetime = 1s; auto-disposes itself.
 */
export function flashRecovered(
  editor: MonacoEditor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
  line: number,
): void {
  const model = editor.getModel();
  if (!model || line < 1 || line > model.getLineCount()) return;
  const collection = editor.createDecorationsCollection([
    {
      range: new monaco.Range(line, 1, line, 1),
      options: { glyphMarginClassName: 'cg-recovered', stickiness: 1 },
    },
  ]);
  setTimeout(() => collection.clear(), 1000);
}
