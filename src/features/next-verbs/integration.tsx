/**
 * Phase 20 — integration with the command palette and global keybindings.
 *
 * The existing palette in src/features/command-palette/index.tsx renders
 * its own static command list. Rather than fork it, this module exports:
 *
 *   - <NextVerbsRegistration /> — a self-mounted component that:
 *       1. Registers verb hotkeys (⌘⇧S/W/T/D) globally.
 *       2. Renders the <NextVerbPreviewShell />.
 *       3. Renders an inline panel of verbs into a portal that sits on top
 *          of the cmd-palette overlay (when it's open).
 *
 *   - getRelevantVerbs(ctx) — returns the 3 most relevant verbs for the
 *     current context (used by the overlay's "Suggested" section).
 *
 *   - useVerbContext() — hook that derives a VerbContext from the active
 *     stores. Re-exported for tests + verb authors.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { useUiStore } from '@entities/ui-shell';
import { Icon, Kbd } from '@shared/ui';
import { isMac } from '@shared/lib/keys';
import { cn } from '@shared/lib/cn';
import {
  NEXT_VERBS,
  VERB_CATEGORY_LABEL,
  VERB_CATEGORY_ORDER,
  findVerb,
} from './registry';
import { NextVerbPreviewShell } from './preview-shell';
import type { NextVerb, VerbContext } from './types';

// ── Context derivation ──────────────────────────────────────────────────

function isRoutePath(file: string | undefined): boolean {
  if (!file) return false;
  return /(?:^|\/)app\/.*\/(?:page|layout|loading|error|template)\.(?:tsx?|jsx?)$/.test(
    file,
  );
}

function isServerActionPath(file: string | undefined): boolean {
  if (!file) return false;
  return /actions?\.tsx?$/.test(file);
}

function isClientPath(file: string | undefined): boolean {
  if (!file) return false;
  // Heuristic: anything inside _components or with .client. prefix.
  return /(?:_components|\.client\.)/.test(file);
}

export function useVerbContext(): VerbContext {
  const cursor = useEditorStore((s) => s.cursor);
  const selection = useEditorStore((s) => s.selection);
  const routes = useRouteStore((s) => s.routes);
  const selectedRouteId = useRouteStore((s) => s.selectedRouteId);
  const route = useMemo(
    () => routes.find((r) => r.id === selectedRouteId),
    [routes, selectedRouteId],
  );
  const cursorFile = cursor?.file;
  return {
    cursorFile,
    cursorLine: cursor?.line,
    routePath: route?.path,
    routeId: route?.id,
    selectionText: selection?.text,
    isRouteFile: isRoutePath(cursorFile),
    isServerActionFile: isServerActionPath(cursorFile),
    isClientFile: isClientPath(cursorFile),
  };
}

/** Imperatively read the current verb context (useful for keybindings). */
export function readVerbContext(): VerbContext {
  const cursor = useEditorStore.getState().cursor;
  const selection = useEditorStore.getState().selection;
  const routeStore = useRouteStore.getState();
  const route = routeStore.routes.find(
    (r) => r.id === routeStore.selectedRouteId,
  );
  const cursorFile = cursor?.file;
  return {
    cursorFile,
    cursorLine: cursor?.line,
    routePath: route?.path,
    routeId: route?.id,
    selectionText: selection?.text,
    isRouteFile: isRoutePath(cursorFile),
    isServerActionFile: isServerActionPath(cursorFile),
    isClientFile: isClientPath(cursorFile),
  };
}

// ── Suggestions ─────────────────────────────────────────────────────────

const SUGGESTION_BY_CONTEXT: ReadonlyArray<{
  match: (ctx: VerbContext) => boolean;
  ids: ReadonlyArray<string>;
}> = [
  {
    match: (ctx) => ctx.isServerActionFile,
    ids: ['add-revalidate', 'trace-fullstack', 'run-admission'],
  },
  {
    match: (ctx) => ctx.isRouteFile,
    ids: ['why-dynamic', 'make-static', 'trace-fullstack'],
  },
];

export function getRelevantVerbs(ctx: VerbContext): NextVerb[] {
  const rule = SUGGESTION_BY_CONTEXT.find((r) => r.match(ctx));
  if (rule) {
    return rule.ids
      .map((id) => findVerb(id))
      .filter((v): v is NextVerb => Boolean(v));
  }
  // Default suggestions: first 3 visible verbs.
  return NEXT_VERBS.filter((v) => v.shouldShow(ctx)).slice(0, 3);
}

// ── Hotkeys ─────────────────────────────────────────────────────────────

const HOTKEY_TO_VERB: ReadonlyArray<{ key: string; id: string }> = [
  { key: 's', id: 'make-static' },
  { key: 'w', id: 'why-dynamic' },
  { key: 't', id: 'trace-tag' },
  { key: 'd', id: 'find-dup-fetches' },
];

function useVerbHotkeys(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || !e.shiftKey) return;
      const key = e.key.toLowerCase();
      const match = HOTKEY_TO_VERB.find((h) => h.key === key);
      if (!match) return;
      const verb = findVerb(match.id);
      if (!verb) return;
      const ctx = readVerbContext();
      if (!verb.shouldShow(ctx)) return;
      e.preventDefault();
      e.stopPropagation();
      void verb.run(ctx);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}

// ── Inline overlay (rendered above the command-palette panel) ──────────

interface VerbRowProps {
  verb: NextVerb;
  onSelect: (v: NextVerb) => void;
}

function VerbRow({ verb, onSelect }: VerbRowProps): ReactNode {
  const IconCmp = verb.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(verb)}
      className={cn(
        'group flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
        'hover:bg-bg-selected',
      )}
    >
      <IconCmp className="h-3.5 w-3.5 shrink-0 text-ink-3" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium text-ink-1 truncate">{verb.title}</span>
        <span className="truncate text-2xs text-ink-3">{verb.description}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-sm bg-gradient-to-r from-accent/20 to-accent/0 px-1 py-0.5">
          <span className="h-1 w-1 rounded-full bg-accent" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
            Next.js
          </span>
        </span>
        <span className="text-[10px] uppercase tracking-wider text-ink-3">
          {VERB_CATEGORY_LABEL[verb.category]}
        </span>
        {verb.hotkey ? (
          <span className="ml-1 flex items-center gap-0.5">
            {verb.hotkey.map((k, i) => (
              <Kbd key={`${verb.id}-${i}-${k}`}>{k}</Kbd>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function NextVerbsOverlay(): ReactNode {
  const open = useUiStore((s) => s.overlays.commandPalette.open);
  const close = useUiStore((s) => s.closeOverlay);
  const ctx = useVerbContext();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!open) setFilter('');
  }, [open]);

  if (!open) return null;

  const visible = NEXT_VERBS.filter((v) => v.shouldShow(ctx));
  const filtered = filter
    ? visible.filter(
        (v) =>
          v.title.toLowerCase().includes(filter.toLowerCase()) ||
          v.description.toLowerCase().includes(filter.toLowerCase()),
      )
    : visible;

  const suggested = filter ? [] : getRelevantVerbs(ctx);

  const onSelect = (v: NextVerb): void => {
    close('commandPalette');
    void v.run(ctx);
  };

  return createPortal(
    <div
      className="fixed left-1/2 top-[calc(50%+220px)] z-[60] w-[620px] -translate-x-1/2 rounded-md border border-line/60 bg-bg-1/95 shadow-xl backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-3 py-2 hairline-b">
        <span className="inline-flex items-center gap-1 rounded-sm bg-gradient-to-r from-accent/20 to-accent/0 px-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
            Next.js Verbs
          </span>
        </span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter framework verbs…"
          className="flex-1 bg-transparent text-xs text-ink-1 placeholder:text-ink-3 focus:outline-none"
        />
        <span className="text-2xs text-ink-3">{filtered.length} verbs</span>
      </div>
      <div className="max-h-[35vh] overflow-y-auto py-1">
        {suggested.length > 0 ? (
          <div>
            <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wider text-ink-3">
              Suggested for current context
            </div>
            {suggested.map((v) => (
              <VerbRow key={`s-${v.id}`} verb={v} onSelect={onSelect} />
            ))}
            <div className="mx-3 my-1 border-t border-line/60" />
          </div>
        ) : null}
        {VERB_CATEGORY_ORDER.map((cat) => {
          const items = filtered.filter((v) => v.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wider text-ink-3">
                {VERB_CATEGORY_LABEL[cat]}
              </div>
              {items.map((v) => (
                <VerbRow key={v.id} verb={v} onSelect={onSelect} />
              ))}
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-center text-2xs text-ink-3">
            No verbs match the current filter / context.
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 hairline-t text-[10px] text-ink-3">
        <span className="inline-flex items-center gap-1">
          <Icon.Bulb className="h-3 w-3" /> framework-aware operations
        </span>
        <span className="inline-flex items-center gap-2">
          <span>
            <Kbd>⌘⇧S</Kbd> static
          </span>
          <span>
            <Kbd>⌘⇧W</Kbd> why
          </span>
          <span>
            <Kbd>⌘⇧T</Kbd> tag
          </span>
          <span>
            <Kbd>⌘⇧D</Kbd> dup
          </span>
        </span>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Mountable component. Drop near the app root next to <CommandPaletteOverlay />.
 *
 *   <CommandPaletteOverlay />
 *   <NextVerbsRegistration />
 *
 * It renders the verb panel only when the palette is open, and always
 * renders the preview shell so verbs can pop their wizards.
 */
export function NextVerbsRegistration(): ReactNode {
  useVerbHotkeys();
  return (
    <>
      <NextVerbsOverlay />
      <NextVerbPreviewShell />
    </>
  );
}
