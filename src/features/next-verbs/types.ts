/**
 * Phase 20 — Next.js Verbs in Command Palette.
 *
 * A "verb" is a small framework-aware operation that the command palette
 * exposes as a single line. Each verb may render a wizard / preview shell
 * after it runs, since the command palette closes on `onSelect`.
 *
 * All verbs are pure consumers of existing features; nothing here owns
 * mutable state besides the local preview-shell event bus.
 */

import type { ComponentType, ReactNode } from 'react';

export type VerbCategory =
  | 'mode'
  | 'cache'
  | 'fetch'
  | 'refactor'
  | 'security'
  | 'admission'
  | 'navigation';

/**
 * Context passed to every verb's `shouldShow` and `run`.
 * Computed lazily by the integration layer from current stores.
 */
export interface VerbContext {
  /** Currently focused file (from editor cursor) — undefined if none. */
  cursorFile: string | undefined;
  /** Current line. */
  cursorLine: number | undefined;
  /** Currently selected route path, if any. */
  routePath: string | undefined;
  /** Currently selected route id, if any. */
  routeId: string | undefined;
  /** Currently selected text from the editor selection. */
  selectionText: string | undefined;
  /** Convenience helpers for verbs. */
  isRouteFile: boolean;
  isServerActionFile: boolean;
  isClientFile: boolean;
}

export type VerbIcon = ComponentType<{ className?: string }>;

export interface NextVerb {
  /** Stable id, unique across verbs. */
  id: string;
  /** Title shown in the palette and preview header. */
  title: string;
  /** One-line description shown under the title. */
  description: string;
  /** Optional keyboard hotkey labels (display-only). */
  hotkey?: string[];
  category: VerbCategory;
  icon: VerbIcon;
  /** Should this verb appear given the current context? */
  shouldShow: (ctx: VerbContext) => boolean;
  /** Execute the verb. May open the preview shell or another overlay. */
  run: (ctx: VerbContext) => Promise<void> | void;
}

/**
 * Payload for the preview shell. Verbs publish this to display a wizard.
 */
export interface PreviewPayload {
  verbId: string;
  title: string;
  body: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void | Promise<void>;
  secondaryLabel?: string;
  onSecondary?: () => void;
}
