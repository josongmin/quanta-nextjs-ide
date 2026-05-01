/**
 * Notification shape types.
 *
 * Lives in `shared/types` so both the `entities/notification` store
 * and the `shared/mocks/notifications.ts` seed data can reference
 * these without `shared` importing from `entities`.
 */

export type NotificationKind = 'risk' | 'pr' | 'build' | 'analysis' | 'tip';

export type NotificationAction =
  | { kind: 'open-overlay'; overlayKey: string; payload?: Record<string, unknown> }
  | { kind: 'open-route'; routeId: string }
  | { kind: 'toast'; message: string }
  | { kind: 'noop' };

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  at: number;
  read: boolean;
  action?: { label: string; run: NotificationAction };
}
