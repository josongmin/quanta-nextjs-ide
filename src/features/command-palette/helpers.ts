import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { Icon } from '@shared/ui';
import { isMac } from '@shared/lib/keys';

export type IconCmp = ComponentType<LucideProps>;

/**
 * Short basename for a path. Used in mono labels.
 */
export function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}

/**
 * Stable tab id used by the editor store for openTab().
 */
export function jumpTabId(file: string): string {
  return `tab-${file}`;
}

/**
 * Cross-platform shortcut formatter.
 * Pass internal symbols (`Mod`, `Shift`, etc) and we map to ⌘/Ctrl/⇧.
 */
export function fmtShortcut(parts: ReadonlyArray<'Mod' | 'Shift' | 'Alt' | string>): string[] {
  return parts.map((p) => {
    if (p === 'Mod') return isMac ? '⌘' : 'Ctrl';
    if (p === 'Shift') return '⇧';
    if (p === 'Alt') return isMac ? '⌥' : 'Alt';
    return p;
  });
}

/**
 * The curated NSS command set from docs/002.md §11.
 *
 * Most are presentational stubs that toast "would do X" — a few wire to real
 * UI store actions. Each command has a stable id, an Icon, an optional shortcut,
 * and a category that groups it visually inside the palette.
 */
export type CommandCategory =
  | 'Understand'
  | 'Find'
  | 'Refactor'
  | 'Migration'
  | 'Diff / Review'
  | 'Project'
  | 'Policy';

export interface NssCommandSpec {
  id: string;
  label: string;
  category: CommandCategory;
  icon: IconCmp;
  shortcut?: string[];
  /** Marker so the executor in index.tsx can dispatch to real store actions. */
  action:
    | { kind: 'toast'; message: string }
    | {
        kind: 'open-overlay';
        key: 'whatIf' | 'evidenceTracer' | 'blastRadius' | 'cockpit';
      }
    | { kind: 'set-bottom-tab'; tab: 'semantic-diff' | 'cache-lineage' | 'problems' }
    | { kind: 'set-inspector-project' }
    | { kind: 'set-left-tab'; tab: 'tags' };
}

export const nssCommands: NssCommandSpec[] = [
  // ── Understand ───────────────────────────────────────────────────────────
  {
    id: 'cmd_why_dynamic',
    label: 'Why is this route dynamic?',
    category: 'Understand',
    icon: Icon.Bulb,
    shortcut: fmtShortcut(['Mod', 'Shift', 'Y']),
    action: { kind: 'open-overlay', key: 'evidenceTracer' },
  },
  {
    id: 'cmd_blast_radius',
    label: 'Show client blast radius',
    category: 'Understand',
    icon: Icon.Net,
    shortcut: fmtShortcut(['Mod', 'Shift', 'B']),
    action: { kind: 'open-overlay', key: 'blastRadius' },
  },
  {
    id: 'cmd_explain_file',
    label: 'Explain this file',
    category: 'Understand',
    icon: Icon.Doc,
    action: { kind: 'toast', message: 'Explain this file (preview)' },
  },
  {
    id: 'cmd_show_route_contract',
    label: 'Show route contract',
    category: 'Understand',
    icon: Icon.Globe,
    action: { kind: 'toast', message: 'Show route contract (preview)' },
  },
  {
    id: 'cmd_show_cache_lineage_for_tag',
    label: 'Show cache lineage for tag…',
    category: 'Understand',
    icon: Icon.Tag,
    action: { kind: 'set-bottom-tab', tab: 'cache-lineage' },
  },
  {
    id: 'cmd_show_action_safety',
    label: 'Show server action safety…',
    category: 'Understand',
    icon: Icon.Shield,
    action: { kind: 'toast', message: 'Show server action safety (preview)' },
  },

  // ── Find ─────────────────────────────────────────────────────────────────
  {
    id: 'cmd_find_untagged_fetches',
    label: 'Find untagged fetches',
    category: 'Find',
    icon: Icon.Search,
    action: { kind: 'toast', message: 'Find untagged fetches (preview)' },
  },
  {
    id: 'cmd_find_missing_revalidate',
    label: 'Find missing revalidate pairs',
    category: 'Find',
    icon: Icon.Refresh,
    action: { kind: 'toast', message: 'Find missing revalidate pairs (preview)' },
  },
  {
    id: 'cmd_find_raw_fetches',
    label: 'Find raw fetches',
    category: 'Find',
    icon: Icon.Search,
    action: { kind: 'toast', message: 'Find raw fetches (preview)' },
  },
  {
    id: 'cmd_find_sequential_fetches',
    label: 'Find sequential fetches',
    category: 'Find',
    icon: Icon.Search,
    action: { kind: 'toast', message: 'Find sequential fetches (preview)' },
  },
  {
    id: 'cmd_find_use_client_boundaries',
    label: "Find 'use client' boundaries",
    category: 'Find',
    icon: Icon.Layers,
    action: { kind: 'toast', message: "Find 'use client' boundaries (preview)" },
  },
  {
    id: 'cmd_find_server_only_leaks',
    label: 'Find server-only leaks into client',
    category: 'Find',
    icon: Icon.Alert,
    action: { kind: 'toast', message: 'Find server-only leaks into client (preview)' },
  },
  {
    id: 'cmd_find_missing_boundaries',
    label: 'Find missing error/loading boundaries',
    category: 'Find',
    icon: Icon.Alert,
    action: { kind: 'toast', message: 'Find missing error/loading boundaries (preview)' },
  },
  {
    id: 'cmd_find_non_serializable_props',
    label: 'Find non-serializable props at boundaries',
    category: 'Find',
    icon: Icon.TriAlert,
    action: { kind: 'toast', message: 'Find non-serializable props (preview)' },
  },
  {
    id: 'cmd_find_missing_auth_admin',
    label: 'Find missing auth on /admin',
    category: 'Find',
    icon: Icon.Lock,
    action: { kind: 'toast', message: 'Find missing auth on /admin (preview)' },
  },

  // ── Refactor ─────────────────────────────────────────────────────────────
  {
    id: 'cmd_make_production_ready',
    label: 'Make this route production-ready',
    category: 'Refactor',
    icon: Icon.Zap,
    shortcut: fmtShortcut(['Mod', 'Shift', 'M']),
    action: { kind: 'toast', message: 'Make this route production-ready (preview)' },
  },
  {
    id: 'cmd_extract_island',
    label: 'Extract client island…',
    category: 'Refactor',
    icon: Icon.Box,
    action: { kind: 'toast', message: 'Extract client island (preview)' },
  },
  {
    id: 'cmd_convert_to_server',
    label: 'Convert to Server Component',
    category: 'Refactor',
    icon: Icon.Server,
    action: { kind: 'toast', message: 'Convert to Server Component (preview)' },
  },
  {
    id: 'cmd_move_use_client_down',
    label: "Move 'use client' down",
    category: 'Refactor',
    icon: Icon.Down,
    action: { kind: 'toast', message: "Move 'use client' down (preview)" },
  },
  {
    id: 'cmd_add_cache_policy',
    label: 'Add cache policy…',
    category: 'Refactor',
    icon: Icon.Database,
    action: { kind: 'toast', message: 'Add cache policy (preview)' },
  },
  {
    id: 'cmd_generate_loader_metadata',
    label: 'Generate loader/metadata/error',
    category: 'Refactor',
    icon: Icon.Plus,
    action: { kind: 'toast', message: 'Generate loader/metadata/error (preview)' },
  },
  {
    id: 'cmd_run_boundary_optimizer',
    label: 'Run boundary optimizer',
    category: 'Refactor',
    icon: Icon.Cog,
    shortcut: fmtShortcut(['Mod', 'Shift', 'L']),
    action: { kind: 'toast', message: 'Run boundary optimizer (preview)' },
  },

  // ── Migration ────────────────────────────────────────────────────────────
  {
    id: 'cmd_migrate_14_to_15',
    label: 'Migrate Next 14 → 15 (async request APIs)',
    category: 'Migration',
    icon: Icon.UpRight,
    action: { kind: 'toast', message: 'Migrate Next 14 → 15 (preview)' },
  },
  {
    id: 'cmd_migrate_unstable_cache',
    label: "Migrate unstable_cache → 'use cache'",
    category: 'Migration',
    icon: Icon.UpRight,
    action: { kind: 'toast', message: "Migrate unstable_cache → 'use cache' (preview)" },
  },
  {
    id: 'cmd_migrate_cache_handler',
    label: 'Migrate cacheHandler → cacheHandlers',
    category: 'Migration',
    icon: Icon.UpRight,
    action: { kind: 'toast', message: 'Migrate cacheHandler → cacheHandlers (preview)' },
  },

  // ── Diff / Review ────────────────────────────────────────────────────────
  {
    id: 'cmd_show_semantic_diff',
    label: 'Show semantic diff vs main',
    category: 'Diff / Review',
    icon: Icon.Branch,
    shortcut: fmtShortcut(['Mod', 'Shift', 'D']),
    action: { kind: 'set-bottom-tab', tab: 'semantic-diff' },
  },
  {
    id: 'cmd_generate_pr_comment',
    label: 'Generate PR comment',
    category: 'Diff / Review',
    icon: Icon.Doc,
    action: { kind: 'toast', message: 'Generate PR comment (preview)' },
  },
  {
    id: 'cmd_run_precommit_gate',
    label: 'Run pre-commit gate',
    category: 'Diff / Review',
    icon: Icon.Shield,
    action: { kind: 'toast', message: 'Run pre-commit gate (preview)' },
  },

  // ── Project ──────────────────────────────────────────────────────────────
  {
    id: 'cmd_open_project_health',
    label: 'Open Project Health',
    category: 'Project',
    icon: Icon.Info,
    action: { kind: 'set-inspector-project' },
  },
  {
    id: 'cmd_open_cockpit',
    label: 'Open Cockpit — project pulse',
    category: 'Project',
    icon: Icon.Zap,
    action: { kind: 'open-overlay', key: 'cockpit' },
  },
  {
    id: 'cmd_open_inspection_profile',
    label: 'Open Inspection Profile…',
    category: 'Project',
    icon: Icon.Settings,
    action: { kind: 'toast', message: 'Open Inspection Profile (preview)' },
  },
  {
    id: 'cmd_open_what_if',
    label: 'Open What-if editor',
    category: 'Project',
    icon: Icon.Filter,
    shortcut: fmtShortcut(['Mod', 'Shift', 'W']),
    action: { kind: 'open-overlay', key: 'whatIf' },
  },
  {
    id: 'cmd_open_route_flow_editor',
    label: 'Open Route Flow Editor',
    category: 'Project',
    icon: Icon.Net,
    action: { kind: 'toast', message: 'Open Route Flow Editor (preview)' },
  },
  {
    id: 'cmd_open_boundary_optimizer',
    label: 'Open Boundary Optimizer',
    category: 'Project',
    icon: Icon.Cog,
    action: { kind: 'toast', message: 'Open Boundary Optimizer (preview)' },
  },
  {
    id: 'cmd_open_cache_lineage',
    label: 'Open Cache Lineage',
    category: 'Project',
    icon: Icon.Hex,
    shortcut: fmtShortcut(['Mod', 'Shift', 'K']),
    action: { kind: 'set-bottom-tab', tab: 'cache-lineage' },
  },
  {
    id: 'cmd_snapshot_semantic',
    label: 'Snapshot semantic state',
    category: 'Project',
    icon: Icon.Pin,
    action: { kind: 'toast', message: 'Snapshot semantic state (preview)' },
  },
  {
    id: 'cmd_compare_semantic_snapshot',
    label: 'Compare semantic snapshot…',
    category: 'Project',
    icon: Icon.Branch,
    action: { kind: 'toast', message: 'Compare semantic snapshot (preview)' },
  },

  // ── Policy ───────────────────────────────────────────────────────────────
  {
    id: 'cmd_edit_route_contract',
    label: 'Edit route contract for /…',
    category: 'Policy',
    icon: Icon.Doc,
    action: { kind: 'toast', message: 'Edit route contract (preview)' },
  },
  {
    id: 'cmd_edit_team_rulebook',
    label: 'Edit team rulebook',
    category: 'Policy',
    icon: Icon.Doc,
    action: { kind: 'toast', message: 'Edit team rulebook (preview)' },
  },
  {
    id: 'cmd_set_inspection_profile',
    label: 'Set inspection profile…',
    category: 'Policy',
    icon: Icon.Settings,
    action: { kind: 'toast', message: 'Set inspection profile (preview)' },
  },
];

/** Order in which categories appear in the palette. */
export const commandCategoryOrder: CommandCategory[] = [
  'Understand',
  'Find',
  'Refactor',
  'Migration',
  'Diff / Review',
  'Project',
  'Policy',
];

/**
 * Collect a small (~20) deduped file list from a routes / islands / layouts
 * universe. Used by the "Files" group.
 */
export interface FileRow {
  id: string;
  path: string;
  kind: 'page' | 'layout' | 'loading' | 'error' | 'island' | 'action';
}

export function collectFiles(args: {
  routes: ReadonlyArray<{
    id: string;
    files: {
      page?: string;
      layout?: string;
      loading?: string;
      error?: string;
      notFound?: string;
    };
  }>;
  islandFiles: ReadonlyArray<{ id: string; file: string }>;
  layoutFiles: ReadonlyArray<{ id: string; file: string }>;
  actionFiles: ReadonlyArray<{ id: string; file: string }>;
}): FileRow[] {
  const seen = new Map<string, FileRow>();
  const push = (path: string | undefined, kind: FileRow['kind'], id: string) => {
    if (!path) return;
    if (seen.has(path)) return;
    seen.set(path, { id, path, kind });
  };
  for (const r of args.routes) {
    push(r.files.page, 'page', `f_page_${r.id}`);
    push(r.files.layout, 'layout', `f_layout_${r.id}`);
    push(r.files.loading, 'loading', `f_loading_${r.id}`);
    push(r.files.error, 'error', `f_error_${r.id}`);
  }
  for (const i of args.islandFiles) push(i.file, 'island', `f_island_${i.id}`);
  for (const l of args.layoutFiles) push(l.file, 'layout', `f_layout2_${l.id}`);
  for (const a of args.actionFiles) push(a.file, 'action', `f_action_${a.id}`);
  return [...seen.values()].slice(0, 24);
}
