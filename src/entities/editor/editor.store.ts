import { create } from 'zustand';

export interface EditorTab {
  id: string;
  file: string;
  label: string;
  dirty: boolean;
}

export interface CursorPosition {
  file: string;
  line: number;
  column: number;
  symbol?: string;
}

interface EditorStore {
  tabs: EditorTab[];
  activeTabId: string | null;
  cursor: CursorPosition | null;
  selection: { startLine: number; endLine: number; text: string } | null;
  openTab(tab: Omit<EditorTab, 'dirty'>): void;
  closeTab(id: string): void;
  setActive(id: string): void;
  setCursor(c: CursorPosition | null): void;
  setSelection(s: EditorStore['selection']): void;
}

const initialTabs: EditorTab[] = [
  {
    id: 'tab-page',
    file: 'app/(shop)/products/[id]/page.tsx',
    label: 'page.tsx',
    dirty: false,
  },
  {
    id: 'tab-layout',
    file: 'app/(shop)/layout.tsx',
    label: 'layout.tsx',
    dirty: true,
  },
  {
    id: 'tab-actions',
    file: 'app/admin/products/actions.ts',
    label: 'actions.ts',
    dirty: false,
  },
];

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: initialTabs,
  activeTabId: 'tab-page',
  cursor: {
    file: 'app/(shop)/products/[id]/page.tsx',
    line: 14,
    column: 12,
  },
  selection: null,
  openTab: (tab) =>
    set((s) => {
      if (s.tabs.some((t) => t.id === tab.id)) {
        return { activeTabId: tab.id };
      }
      return { tabs: [...s.tabs, { ...tab, dirty: false }], activeTabId: tab.id };
    }),
  closeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeTabId =
        s.activeTabId === id ? (tabs[0]?.id ?? null) : s.activeTabId;
      return { tabs, activeTabId };
    }),
  setActive: (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    set({
      activeTabId: id,
      cursor: { file: tab.file, line: 1, column: 0 },
    });
  },
  setCursor: (c) => set({ cursor: c }),
  setSelection: (s) => set({ selection: s }),
}));
