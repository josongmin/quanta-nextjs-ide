import type { StateCreator } from 'zustand';
import type { BottomTab, LeftTab } from './types';

export interface LayoutSlice {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  leftTab: LeftTab;
  bottomTab: BottomTab;
  focusMode: boolean;
  toggleLeft(): void;
  toggleRight(): void;
  toggleBottom(): void;
  setLeftWidth(px: number): void;
  setRightWidth(px: number): void;
  setBottomHeight(px: number): void;
  setLeftTab(t: LeftTab): void;
  setBottomTab(t: BottomTab): void;
  toggleFocusMode(): void;
  setFocusMode(v: boolean): void;
}

export const layoutPersistKeys = [
  'leftPanelOpen',
  'rightPanelOpen',
  'bottomPanelOpen',
  'leftPanelWidth',
  'rightPanelWidth',
  'bottomPanelHeight',
  'leftTab',
  'bottomTab',
  'focusMode',
] as const;

export const createLayoutSlice: StateCreator<
  LayoutSlice,
  [],
  [],
  LayoutSlice
> = (set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,
  leftPanelWidth: 280,
  rightPanelWidth: 340,
  bottomPanelHeight: 240,
  leftTab: 'routes',
  bottomTab: 'problems',
  focusMode: false,
  toggleLeft: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRight: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleBottom: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  setLeftWidth: (px) =>
    set({ leftPanelWidth: Math.min(520, Math.max(200, Math.round(px))) }),
  setRightWidth: (px) =>
    set({ rightPanelWidth: Math.min(560, Math.max(240, Math.round(px))) }),
  setBottomHeight: (px) =>
    set({ bottomPanelHeight: Math.min(540, Math.max(120, Math.round(px))) }),
  setLeftTab: (t) => set({ leftTab: t }),
  setBottomTab: (t) => set({ bottomTab: t }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setFocusMode: (v) => set({ focusMode: v }),
});
