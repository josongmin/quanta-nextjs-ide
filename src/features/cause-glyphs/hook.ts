/**
 * `useCauseGlyphs` — mounts the gutter glyph layer for the open file.
 *
 * Strictly additive: import + call this hook from `editor-surface.tsx`
 * alongside `useMonacoDecorations`. The hook owns its own decoration
 * collection, listens for file content changes, and re-runs the detector
 * with a debounce. Animations + recovered ticks are managed internally.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { detectCauses, tallyByKind } from './detector';
import {
  applyGlyphs,
  flashRecovered,
  type GlyphFilterState,
  type GlyphHandle,
} from './integration';
import type { CauseGlyph, CauseKind } from './types';
import './styles.css';

const SUPPRESS_KEY = 'cg:suppressed:v1';

function loadSuppressed(): Set<string> {
  try {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(SUPPRESS_KEY) : null;
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    // ignore
  }
  return new Set();
}

function saveSuppressed(s: ReadonlySet<string>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SUPPRESS_KEY, JSON.stringify(Array.from(s)));
    }
  } catch {
    // ignore
  }
}

export interface UseCauseGlyphsOptions {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  monaco: typeof import('monaco-editor') | null;
  file: string;
  source: string;
}

export interface UseCauseGlyphsResult {
  glyphs: ReadonlyArray<CauseGlyph>;
  /** Per-kind counts in this file (post-suppression). */
  countsByKind: Record<CauseKind, number>;
  filter: GlyphFilterState;
  setActiveKind: (k: CauseKind | null) => void;
  toggleShowLowConfidence: () => void;
  suppress: (id: string) => void;
  unsuppressAll: () => void;
}

export function useCauseGlyphs(
  options: UseCauseGlyphsOptions,
): UseCauseGlyphsResult {
  const { editor, monaco, file, source } = options;

  const [activeKind, setActiveKind] = useState<CauseKind | null>(null);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [suppressed, setSuppressed] = useState<Set<string>>(() => loadSuppressed());
  const handleRef = useRef<GlyphHandle | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const prevLineByIdRef = useRef<Map<string, number>>(new Map());

  // The glyph margin must be on for decorations to paint. Toggle it the
  // first time we mount on this editor; this is a no-op if already enabled.
  useEffect(() => {
    if (!editor) return;
    try {
      editor.updateOptions({ glyphMargin: true });
    } catch {
      // ignore
    }
  }, [editor]);

  const glyphs = useMemo<ReadonlyArray<CauseGlyph>>(() => {
    return detectCauses({ file, source });
  }, [file, source]);

  const filter: GlyphFilterState = useMemo(
    () => ({ activeKind, showLowConfidence, suppressed }),
    [activeKind, showLowConfidence, suppressed],
  );

  // Apply / re-apply decorations.
  useEffect(() => {
    if (!editor || !monaco) return;
    const currentIds = new Set(glyphs.map((g) => g.id));
    const recentlyAppeared = new Set<string>();
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id)) recentlyAppeared.add(id);
    }
    // Disappeared: flash green tick at last known line.
    for (const id of prevIdsRef.current) {
      if (!currentIds.has(id)) {
        const line = prevLineByIdRef.current.get(id);
        if (line) flashRecovered(editor, monaco, line);
      }
    }
    handleRef.current = applyGlyphs(
      editor,
      monaco,
      glyphs,
      filter,
      handleRef.current,
      recentlyAppeared,
    );
    prevIdsRef.current = currentIds;
    const lineMap = new Map<string, number>();
    for (const g of glyphs) lineMap.set(g.id, g.line);
    prevLineByIdRef.current = lineMap;
  }, [editor, monaco, glyphs, filter]);

  // Click routing: when a glyph is clicked, jump to its line.
  useEffect(() => {
    if (!editor) return;
    const dispose = editor.onMouseDown((e) => {
      const target = e.target;
      // Monaco's MouseTargetType.GUTTER_GLYPH_MARGIN === 2.
      if (target.type !== 2) return;
      const line = target.position?.lineNumber;
      if (!line) return;
      editor.revealLineInCenterIfOutsideViewport(line);
      editor.setPosition({ lineNumber: line, column: 1 });
    });
    return () => dispose.dispose();
  }, [editor]);

  // Reset filter when file changes.
  useEffect(() => {
    setActiveKind(null);
  }, [file]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      handleRef.current?.decorations.clear();
      handleRef.current = null;
    };
  }, []);

  const countsByKind = useMemo(() => tallyByKind(glyphs), [glyphs]);

  return {
    glyphs,
    countsByKind,
    filter,
    setActiveKind,
    toggleShowLowConfidence: () => setShowLowConfidence((v) => !v),
    suppress: (id: string) => {
      setSuppressed((s) => {
        const next = new Set(s);
        next.add(id);
        saveSuppressed(next);
        return next;
      });
    },
    unsuppressAll: () => {
      setSuppressed(() => {
        const next = new Set<string>();
        saveSuppressed(next);
        return next;
      });
    },
  };
}
