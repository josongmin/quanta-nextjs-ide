export type DeviceStatus = 'in-sync' | 'pending' | 'conflict' | 'offline';

export type SyncDirection = 'up' | 'down' | 'both';

export interface Device {
  id: string;
  name: string;
  lastSync: number;
  settingsHash: string;
  conflictCount: number;
  status: DeviceStatus;
  direction: SyncDirection;
}

export type DiffCategory =
  | 'settings'
  | 'keybindings'
  | 'extensions'
  | 'snippets';

export interface CategoryDiffSummary {
  added: number;
  removed: number;
  changed: number;
}

export interface DiffEntry {
  key: string;
  oldValue: string;
  newValue: string;
  changeType: 'added' | 'removed' | 'changed';
}

const NOW = 1_730_000_000_000;

export const DEVICES: ReadonlyArray<Device> = [
  {
    id: 'd-mini',
    name: 'Mac mini (home)',
    lastSync: NOW - 2 * 60_000,
    settingsHash: '0x71fa9b3',
    conflictCount: 0,
    status: 'in-sync',
    direction: 'both',
  },
  {
    id: 'd-mbp',
    name: 'MacBook Pro 16',
    lastSync: NOW - 47 * 60_000,
    settingsHash: '0x4c1ade8',
    conflictCount: 4,
    status: 'conflict',
    direction: 'both',
  },
  {
    id: 'd-linux',
    name: 'Linux Laptop (Fedora)',
    lastSync: NOW - 6 * 3600_000,
    settingsHash: '0x880aa11',
    conflictCount: 1,
    status: 'pending',
    direction: 'down',
  },
  {
    id: 'd-ipad',
    name: 'iPad (pen demo)',
    lastSync: NOW - 4 * 86_400_000,
    settingsHash: '0xc31eeff',
    conflictCount: 0,
    status: 'offline',
    direction: 'up',
  },
];

export const DIFF_SUMMARY: Record<DiffCategory, CategoryDiffSummary> = {
  settings: { added: 4, removed: 1, changed: 7 },
  keybindings: { added: 2, removed: 0, changed: 3 },
  extensions: { added: 5, removed: 2, changed: 0 },
  snippets: { added: 1, removed: 0, changed: 2 },
};

export const DIFF_ENTRIES: Record<DiffCategory, ReadonlyArray<DiffEntry>> = {
  settings: [
    {
      key: 'editor.fontSize',
      oldValue: '12',
      newValue: '13',
      changeType: 'changed',
    },
    {
      key: 'editor.formatOnSave',
      oldValue: 'false',
      newValue: 'true',
      changeType: 'changed',
    },
    {
      key: 'editor.minimap.enabled',
      oldValue: 'true',
      newValue: 'false',
      changeType: 'changed',
    },
    {
      key: 'workbench.colorTheme',
      oldValue: '"Default Dark+"',
      newValue: '"Quanta Light"',
      changeType: 'changed',
    },
    {
      key: 'eslint.run',
      oldValue: '—',
      newValue: '"onType"',
      changeType: 'added',
    },
    {
      key: 'tailwindCSS.experimental.classRegex',
      oldValue: '—',
      newValue: '[["cn\\\\(([^)]*)\\\\)"]]',
      changeType: 'added',
    },
    {
      key: 'editor.tabCompletion',
      oldValue: '"on"',
      newValue: '—',
      changeType: 'removed',
    },
  ],
  keybindings: [
    {
      key: 'cmd+shift+p',
      oldValue: 'workbench.action.showCommands',
      newValue: 'quanta.commandPalette',
      changeType: 'changed',
    },
    {
      key: 'cmd+k cmd+s',
      oldValue: 'workbench.action.openGlobalKeybindings',
      newValue: 'quanta.openKeybindings',
      changeType: 'changed',
    },
    {
      key: 'cmd+\\',
      oldValue: 'workbench.action.splitEditor',
      newValue: 'quanta.splitEditor',
      changeType: 'changed',
    },
    {
      key: 'alt+z',
      oldValue: '—',
      newValue: 'editor.action.toggleWordWrap',
      changeType: 'added',
    },
    {
      key: 'cmd+l',
      oldValue: '—',
      newValue: 'expandLineSelection',
      changeType: 'added',
    },
  ],
  extensions: [
    {
      key: 'bradlc.vscode-tailwindcss',
      oldValue: '—',
      newValue: '0.12.5',
      changeType: 'added',
    },
    {
      key: 'esbenp.prettier-vscode',
      oldValue: '—',
      newValue: '11.0.1',
      changeType: 'added',
    },
    {
      key: 'orta.vscode-jest',
      oldValue: '—',
      newValue: '6.4.0',
      changeType: 'added',
    },
    {
      key: 'redhat.vscode-yaml',
      oldValue: '—',
      newValue: '1.15.0',
      changeType: 'added',
    },
    {
      key: 'wix.vscode-import-cost',
      oldValue: '—',
      newValue: '3.3.0',
      changeType: 'added',
    },
    {
      key: 'old.vscode-rainbow',
      oldValue: '2.1.0',
      newValue: '—',
      changeType: 'removed',
    },
    {
      key: 'old.vscode-bracket-pair',
      oldValue: '1.4.0',
      newValue: '—',
      changeType: 'removed',
    },
  ],
  snippets: [
    {
      key: 'tsx/component',
      oldValue: 'function Comp() {}',
      newValue: 'export function Comp() { return null; }',
      changeType: 'changed',
    },
    {
      key: 'tsx/use-state',
      oldValue: 'const [v,sV]=useState();',
      newValue: 'const [value, setValue] = useState<$1>($2);',
      changeType: 'changed',
    },
    {
      key: 'sh/strict',
      oldValue: '—',
      newValue: 'set -euo pipefail',
      changeType: 'added',
    },
  ],
};

export const CATEGORIES: ReadonlyArray<DiffCategory> = [
  'settings',
  'keybindings',
  'extensions',
  'snippets',
];

export function statusTone(
  s: DeviceStatus,
): 'accent' | 'info' | 'warn' | 'err' | 'muted' {
  switch (s) {
    case 'in-sync':
      return 'info';
    case 'pending':
      return 'accent';
    case 'conflict':
      return 'err';
    case 'offline':
      return 'muted';
  }
}

export function relTime(ts: number): string {
  const diff = NOW - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function totalConflicts(): number {
  return DEVICES.reduce((acc, d) => acc + d.conflictCount, 0);
}
