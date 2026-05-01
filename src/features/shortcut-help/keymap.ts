import { globalKeybindings, type KeybindingDescriptor } from '@features/keybindings';

export interface KeymapRow {
  /** Display tokens, one per <Kbd>. e.g. ['⌘', '⇧', 'P'] */
  keys: string[];
  label: string;
  description?: string;
}

export interface KeymapSection {
  id: string;
  title: string;
  rows: KeymapRow[];
}

/**
 * Split a "⌘⇧P / Ctrl+Shift+P" combo string into mac-side display tokens.
 * Mirrors the convention used by the existing palette help component.
 */
function macSideTokens(combo: string): string[] {
  const macSide = combo.split('/')[0]?.trim() ?? combo;
  const out: string[] = [];
  let buf = '';
  for (const ch of macSide) {
    if (ch === '⌘' || ch === '⇧' || ch === '⌥' || ch === '⌃' || ch === '↩' || ch === '↑' || ch === '↓' || ch === '←' || ch === '→') {
      if (buf) {
        out.push(buf);
        buf = '';
      }
      out.push(ch);
    } else if (ch === '+' || ch === ' ') {
      if (buf) {
        out.push(buf);
        buf = '';
      }
    } else {
      buf += ch;
    }
  }
  if (buf) out.push(buf);
  return out.length > 0 ? out : [macSide];
}

const byId = new Map<string, KeybindingDescriptor>(
  globalKeybindings.map((k) => [k.id, k]),
);

function fromBinding(id: string, fallback: KeymapRow): KeymapRow {
  const b = byId.get(id);
  if (!b) return fallback;
  return {
    keys: macSideTokens(b.combo),
    label: b.description,
    description: fallback.description,
  };
}

/**
 * Source-of-truth shortcut catalog. Pulls live combos from `globalKeybindings`
 * where possible, augmented with docs/002.md §13 entries that are not yet wired
 * in the global listener (Quick Fix, Go to, Find references, Semantic rename, ⌘?).
 */
export const KEYMAP_SECTIONS: KeymapSection[] = [
  {
    id: 'navigate',
    title: 'Navigate',
    rows: [
      fromBinding('palette', {
        keys: ['⌘', 'P'],
        label: 'Open Command Palette',
        description: 'Files, symbols, commands — fuzzy search.',
      }),
      fromBinding('palette-cmds', {
        keys: ['⌘', '⇧', 'P'],
        label: 'Command Palette (commands)',
      }),
      {
        keys: ['F12'],
        label: 'Go to definition',
        description: 'Semantic-aware. ⌘B inside the editor also works.',
      },
      {
        keys: ['⇧', 'F12'],
        label: 'Find references (grouped)',
      },
      {
        keys: ['F2'],
        label: 'Semantic rename',
      },
    ],
  },
  {
    id: 'inspect',
    title: 'Inspect',
    rows: [
      fromBinding('why-dynamic', {
        keys: ['⌘', '⇧', 'Y'],
        label: 'Why Dynamic? — open Evidence Tracer',
      }),
      fromBinding('blast', {
        keys: ['⌘', '⇧', 'B'],
        label: 'Show client blast radius',
      }),
      fromBinding('evidence', {
        keys: ['⌘', '⇧', 'E'],
        label: 'Show evidence trace',
      }),
      fromBinding('semantic-diff', {
        keys: ['⌘', '⇧', 'D'],
        label: 'Open Semantic Diff',
      }),
      fromBinding('cache-lineage', {
        keys: ['⌘', '⇧', 'K'],
        label: 'Open Cache Lineage',
      }),
    ],
  },
  {
    id: 'refactor',
    title: 'Refactor',
    rows: [
      {
        keys: ['⌘', '.'],
        label: 'Quick Fix',
        description: 'Surface autofixes for the diagnostic at cursor.',
      },
      fromBinding('what-if', {
        keys: ['⌘', '⇧', 'W'],
        label: 'Open What-if editor',
      }),
      fromBinding('make-prod', {
        keys: ['⌘', '⇧', 'M'],
        label: 'Make this route production-ready',
      }),
      fromBinding('boundary-opt', {
        keys: ['⌘', '⇧', 'L'],
        label: 'Open Boundary Optimizer',
      }),
    ],
  },
  {
    id: 'view',
    title: 'View',
    rows: [
      fromBinding('toggle-left', {
        keys: ['⌘', 'B'],
        label: 'Toggle left App Map',
      }),
      fromBinding('toggle-right', {
        keys: ['⌘', '\\'],
        label: 'Toggle right Inspector',
      }),
      fromBinding('toggle-bottom', {
        keys: ['⌘', 'J'],
        label: 'Toggle bottom panel',
      }),
      {
        keys: ['⌘', '?'],
        label: 'Show this keyboard help',
      },
      fromBinding('esc', {
        keys: ['Esc'],
        label: 'Close any open overlay',
      }),
    ],
  },
];
