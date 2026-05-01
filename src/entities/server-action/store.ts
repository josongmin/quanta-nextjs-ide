import { create } from 'zustand';
import type { RouteHandler, ServerAction } from '@shared/types';
import { mockRouteHandlers, mockServerActions } from '@shared/mocks/actions';

interface ActionStore {
  actions: ServerAction[];
  handlers: RouteHandler[];
  selectedActionId: string | null;
  selectedHandlerId: string | null;
  setSelectedAction(id: string | null): void;
  setSelectedHandler(id: string | null): void;
  byActionId(id: string): ServerAction | undefined;
  byHandlerId(id: string): RouteHandler | undefined;
  actionsForRoute(routeId: string): ServerAction[];
  riskyActions(): ServerAction[];
  webhookHandlers(): RouteHandler[];
}

const RISKY_THRESHOLD = 60;
const isRisky = (a: ServerAction): boolean => a.score < RISKY_THRESHOLD;

export const useActionStore = create<ActionStore>((set, get) => ({
  actions: mockServerActions,
  handlers: mockRouteHandlers,
  selectedActionId: null,
  selectedHandlerId: null,
  setSelectedAction: (id) => set({ selectedActionId: id }),
  setSelectedHandler: (id) => set({ selectedHandlerId: id }),
  byActionId: (id) => get().actions.find((a) => a.id === id),
  byHandlerId: (id) => get().handlers.find((h) => h.id === id),
  actionsForRoute: (routeId) =>
    get().actions.filter((a) => a.routeId === routeId),
  riskyActions: () => get().actions.filter(isRisky),
  webhookHandlers: () => get().handlers.filter((h) => h.isWebhook),
}));

// Standalone selectors
export const selectActions = (s: ActionStore): ServerAction[] => s.actions;
export const selectActionById =
  (id: string) =>
  (s: ActionStore): ServerAction | undefined =>
    s.actions.find((a) => a.id === id);
export const selectActionsForRoute =
  (routeId: string) =>
  (s: ActionStore): ServerAction[] =>
    s.actions.filter((a) => a.routeId === routeId);
export const selectRiskyActions = (s: ActionStore): ServerAction[] =>
  s.actions.filter(isRisky);
export const selectWebhookHandlers = (s: ActionStore): RouteHandler[] =>
  s.handlers.filter((h) => h.isWebhook);
