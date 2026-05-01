import { create } from 'zustand';
import { mockNotifications } from '@shared/mocks/notifications';
import type { Notification } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@entities/notification/store` and `@entities/notification` consumers
// keep working without taking a direct dependency on `shared/types`.
export type {
  NotificationKind,
  NotificationAction,
  Notification,
} from '@shared/types';

interface NotificationStore {
  list: Notification[];
  unreadCount: number;
  markRead(id: string): void;
  markAllRead(): void;
  push(n: Omit<Notification, 'id' | 'at' | 'read'>): void;
}

let counter = 1000;
const nextId = (): string => `n_${++counter}`;

const computeUnread = (list: Notification[]): number =>
  list.reduce((acc, n) => (n.read ? acc : acc + 1), 0);

export const useNotificationStore = create<NotificationStore>((set) => ({
  list: mockNotifications,
  unreadCount: computeUnread(mockNotifications),
  markRead: (id) =>
    set((s) => {
      const list = s.list.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { list, unreadCount: computeUnread(list) };
    }),
  markAllRead: () =>
    set((s) => {
      const list = s.list.map((n) => ({ ...n, read: true }));
      return { list, unreadCount: 0 };
    }),
  push: (n) =>
    set((s) => {
      const next: Notification = {
        ...n,
        id: nextId(),
        at: Date.now(),
        read: false,
      };
      const list = [next, ...s.list];
      return { list, unreadCount: computeUnread(list) };
    }),
}));
