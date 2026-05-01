import { useEffect } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDiagnosticStore } from '@entities/diagnostic';
import { isMac } from '@shared/lib/keys';

/** Names match what we register so the help component can mirror them. */
export interface KeybindingDescriptor {
  id: string;
  combo: string;
  description: string;
}

/**
 * Source of truth for the global keybindings (used by both the listener
 * and the help popover). Strings are the cross-platform display form.
 */
export const globalKeybindings: KeybindingDescriptor[] = [
  { id: 'palette', combo: '⌘P / Ctrl+P', description: 'Open Command Palette' },
  { id: 'palette-cmds', combo: '⌘⇧P', description: 'Open Command Palette (commands)' },
  { id: 'why-dynamic', combo: '⌘⇧Y', description: 'Why Dynamic? — Evidence Tracer' },
  { id: 'blast', combo: '⌘⇧B', description: 'Show client blast radius' },
  { id: 'evidence', combo: '⌘⇧E', description: 'Show evidence trace' },
  { id: 'what-if', combo: '⌘⇧W', description: 'Open What-if editor' },
  { id: 'make-prod', combo: '⌘⇧M', description: 'Make this route production-ready' },
  { id: 'semantic-diff', combo: '⌘⇧D', description: 'Open Semantic Diff' },
  { id: 'cache-lineage', combo: '⌘⇧K', description: 'Open Cache Lineage' },
  { id: 'boundary-opt', combo: '⌘⇧L', description: 'Open Boundary Optimizer' },
  { id: 'toggle-right', combo: '⌘\\', description: 'Toggle right Inspector' },
  { id: 'toggle-left', combo: '⌘B', description: 'Toggle left App Map' },
  { id: 'toggle-bottom', combo: '⌘J', description: 'Toggle bottom panel' },
  { id: 'esc', combo: 'Esc', description: 'Close any open overlay' },
];

/**
 * True when focus is inside a text-editable element. We use this to avoid
 * hijacking ⌘B (Bold) inside editors / inputs.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // Monaco renders into a child .monaco-editor with role="textbox" descendants.
  if (target.closest('.monaco-editor')) return true;
  return false;
}

/**
 * Registers global window keydown listeners as described in docs/002.md §13.
 */
export function useGlobalKeybindings(): void {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const toggleLeft = useUiStore((s) => s.toggleLeft);
  const toggleRight = useUiStore((s) => s.toggleRight);
  const toggleBottom = useUiStore((s) => s.toggleBottom);
  const setBottomTab = useUiStore((s) => s.setBottomTab);
  const bottomPanelOpen = useUiStore((s) => s.bottomPanelOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();
      const editable = isEditableTarget(e.target);

      // ── Palette ────────────────────────────────────────────────────────
      if (mod && key === 'p') {
        // Both ⌘P (file/symbol) and ⌘⇧P (commands) open the palette here.
        e.preventDefault();
        openOverlay('commandPalette');
        return;
      }

      // ── Why Dynamic? — open Evidence Tracer for first diag of cursor file ─
      if (mod && shift && key === 'y') {
        e.preventDefault();
        const cursor = useEditorStore.getState().cursor;
        const file = cursor?.file;
        const firstDiag = file
          ? useDiagnosticStore.getState().forFile(file)[0]
          : undefined;
        if (firstDiag) {
          openOverlay('evidenceTracer', { diagnosticId: firstDiag.id });
        } else {
          toast(
            'Why dynamic? (would open Evidence Tracer for current cursor)',
            { description: file ?? 'no cursor file' },
          );
        }
        return;
      }

      // ── Blast Radius (⌘⇧B) ─────────────────────────────────────────────
      if (mod && shift && key === 'b') {
        e.preventDefault();
        const cursor = useEditorStore.getState().cursor;
        openOverlay('blastRadius', { sourceFile: cursor?.file });
        return;
      }

      // ── Evidence Tracer (⌘⇧E) ──────────────────────────────────────────
      if (mod && shift && key === 'e') {
        e.preventDefault();
        const cursor = useEditorStore.getState().cursor;
        const file = cursor?.file;
        const firstDiag = file
          ? useDiagnosticStore.getState().forFile(file)[0]
          : undefined;
        openOverlay(
          'evidenceTracer',
          firstDiag ? { diagnosticId: firstDiag.id } : {},
        );
        return;
      }

      // ── What-if (⌘⇧W) ──────────────────────────────────────────────────
      if (mod && shift && key === 'w') {
        e.preventDefault();
        openOverlay('whatIf');
        return;
      }

      // ── Make production-ready (⌘⇧M) ────────────────────────────────────
      if (mod && shift && key === 'm') {
        e.preventDefault();
        toast('Make this route production-ready (preview)');
        return;
      }

      // ── Semantic Diff (⌘⇧D) ────────────────────────────────────────────
      if (mod && shift && key === 'd') {
        e.preventDefault();
        setBottomTab('semantic-diff');
        if (!bottomPanelOpen) toggleBottom();
        return;
      }

      // ── Cache Lineage (⌘⇧K) ────────────────────────────────────────────
      if (mod && shift && key === 'k') {
        e.preventDefault();
        setBottomTab('cache-lineage');
        if (!bottomPanelOpen) toggleBottom();
        return;
      }

      // ── Boundary Optimizer (⌘⇧L) ───────────────────────────────────────
      if (mod && shift && key === 'l') {
        e.preventDefault();
        toast('Open Boundary Optimizer (preview)');
        return;
      }

      // ── Toggle right inspector (⌘\) ────────────────────────────────────
      if (mod && key === '\\') {
        e.preventDefault();
        toggleRight();
        return;
      }

      // ── Toggle bottom (⌘J) ─────────────────────────────────────────────
      if (mod && !shift && key === 'j') {
        e.preventDefault();
        toggleBottom();
        return;
      }

      // ── Toggle left (⌘B) — but skip when typing ───────────────────────
      if (mod && !shift && key === 'b') {
        if (editable) return; // let bold/text input through
        e.preventDefault();
        toggleLeft();
        return;
      }

      // ── Esc — close any single open overlay ────────────────────────────
      if (e.key === 'Escape') {
        // Read overlays via getState() so this effect doesn't resubscribe on
        // every overlay state change (which would re-bind the listener).
        const overlays = useUiStore.getState().overlays;
        const opens = (
          ['evidenceTracer', 'blastRadius', 'whatIf', 'commandPalette', 'patchPreview'] as const
        ).filter((k) => overlays[k].open);
        if (opens.length > 0) {
          // close the topmost — preference order matches above list
          for (const k of opens) closeOverlay(k);
          // do not preventDefault — Escape may still be useful elsewhere
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    openOverlay,
    closeOverlay,
    toggleLeft,
    toggleRight,
    toggleBottom,
    setBottomTab,
    bottomPanelOpen,
  ]);
}

/** Mountable component (returns null) for app-level wiring. */
export function GlobalKeybindings(): null {
  useGlobalKeybindings();
  return null;
}
